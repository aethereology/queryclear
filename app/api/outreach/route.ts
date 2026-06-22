import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { buildOutreachEmail, buildFollowupEmail, outreachReportTtlMs } from "@/lib/outreach";
import { AgentRuntimeError } from "@/lib/agent-runtime";
import {
  outreachStore,
  normalizeEmail,
  ACTIVE_STATUSES,
  type ContactStatus,
} from "@/lib/outreach-store";
import { nextStep, computeNextDueAt, COLD_FOLLOWUPS } from "@/lib/outreach-cadence";
import { publicAuditStore } from "@/lib/public-audit";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TIMEOUT_MS = 8_000;
const STATUSES: ContactStatus[] = ["cold", "opened", "replied", "unsubscribed", "bounced", "customer"];

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Email delivery timed out.")), ms);
  });
  try {
    return await Promise.race([promise, timedOut]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Constant-time secret check (sha256 → fixed length, so timingSafeEqual never
// throws on length mismatch and we don't leak the secret's length).
function secretOk(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const resend = new Resend(key);
  const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";
  const replyTo = process.env.LEAD_TO ?? site.email;
  await withTimeout(resend.emails.send({ from, to, replyTo, subject, html }), EMAIL_TIMEOUT_MS);
  return true;
}

type Body = {
  secret?: string;
  action?: "send-cold" | "check" | "set-status" | "list" | "due" | "send-touch";
  // send-cold
  domainUrl?: string;
  email?: string;
  businessName?: string;
  city?: string;
  vertical?: string;
  sourceCsv?: string;
  mode?: "preview" | "send";
  // check
  emails?: string[];
  // set-status
  status?: string;
};

// Founder-only outreach operations, gated by OUTREACH_SECRET (the only endpoint that
// runs an audit + sends mail outside the rate-limited public flow). One auth point;
// `action` routes the operation. Defaults to send-cold for the existing form/CLI.
export async function POST(request: Request) {
  const expected = process.env.OUTREACH_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Outreach is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  if (typeof body.secret !== "string" || !secretOk(body.secret, expected)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const store = outreachStore();
  const action = body.action ?? "send-cold";

  // ── dedup check for CSV ingest ───────────────────────────────────────────────
  if (action === "check") {
    const emails = Array.isArray(body.emails) ? body.emails : [];
    const results = await Promise.all(
      emails.map(async (e) => {
        const c = await store.getContact(e);
        return { email: normalizeEmail(e), status: c?.status ?? null };
      }),
    );
    return NextResponse.json({ results });
  }

  // ── set a contact's status (manual reply/unsub/customer handling) ────────────
  if (action === "set-status") {
    const email = (body.email ?? "").trim();
    const status = body.status as ContactStatus;
    if (!EMAIL.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${STATUSES.join(", ")}` }, { status: 400 });
    }
    const updated = await store.setStatus(email, status);
    if (!updated) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    return NextResponse.json({ contact: updated });
  }

  // ── export the masterlist ────────────────────────────────────────────────────
  if (action === "list") {
    const contacts = await store.listContacts();
    return NextResponse.json({ contacts });
  }

  // ── due queue: active contacts whose next touch is due, rendered for review ───
  if (action === "due") {
    const now = new Date().toISOString();
    const due = await store.dueForTouch(now);
    const items = [];
    for (const c of due) {
      const step = nextStep(c);
      if (!step) continue;
      const { subject, html } = buildFollowupEmail(c, step);
      const flags: string[] = [];
      const token = c.touches[0]?.reportToken;
      if (!token) flags.push("no-report-link");
      else if (!(await publicAuditStore().getReport(token))) flags.push("report-expired");
      items.push({
        email: c.email,
        business: c.business,
        domain: c.domain,
        status: c.status,
        step: { n: step.n, type: step.type },
        subject,
        html,
        flags,
      });
    }
    return NextResponse.json({ due: items });
  }

  // ── send the next due touch to one contact (the founder-approved action) ──────
  if (action === "send-touch") {
    const email = (body.email ?? "").trim();
    if (!EMAIL.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    const c = await store.getContact(email);
    if (!c) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    if (!ACTIVE_STATUSES.includes(c.status)) {
      return NextResponse.json({ skipped: `status:${c.status}` });
    }
    const step = nextStep(c);
    if (!step) return NextResponse.json({ skipped: "no-step" });

    const { subject, html } = buildFollowupEmail(c, step);
    let delivered: boolean;
    try {
      delivered = await sendEmail(email, subject, html);
    } catch {
      return NextResponse.json({ error: "Email delivery failed." }, { status: 502 });
    }
    if (!delivered) {
      return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
    }

    const now = new Date().toISOString();
    const touch = { n: step.n, type: step.type, at: now };
    const after = nextStep({ ...c, touches: [...c.touches, touch], lastTouchAt: now });
    const nextDue = after ? computeNextDueAt(now, after) : null;
    await store.recordTouch(email, touch, nextDue);
    return NextResponse.json({ sent: true, n: step.n, type: step.type, subject });
  }

  // ── send-cold: run audit + preview or send the cold email ────────────────────
  const domainUrl = (body.domainUrl ?? "").trim();
  const email = (body.email ?? "").trim();
  const mode = body.mode === "send" ? "send" : "preview";

  if (!domainUrl) {
    return NextResponse.json({ error: "A domain is required." }, { status: 400 });
  }
  if (mode === "send" && !EMAIL.test(email)) {
    return NextResponse.json({ error: "A valid recipient email is required to send." }, { status: 400 });
  }

  // Dedup: never send to anyone already in the masterlist (any status).
  if (mode === "send") {
    const existing = await store.getContact(email);
    if (existing) {
      return NextResponse.json({ skipped: "duplicate", status: existing.status });
    }
  }

  let built;
  try {
    built = await buildOutreachEmail({ domainUrl, businessName: body.businessName });
  } catch (err) {
    if (err instanceof AgentRuntimeError) {
      return NextResponse.json({ error: `Audit failed: ${err.message}` }, { status: err.status });
    }
    return NextResponse.json({ error: "Audit failed." }, { status: 502 });
  }

  if (mode === "preview") {
    // Surface whether we'd dedup this on send, so the console/CLI can warn.
    const existing = EMAIL.test(email) ? await store.getContact(email) : null;
    return NextResponse.json({
      subject: built.subject,
      html: built.html,
      reportUrl: built.reportUrl,
      token: built.token,
      alreadyContacted: !!existing,
    });
  }

  // mode === "send"
  let delivered: boolean;
  try {
    delivered = await sendEmail(email, built.subject, built.html);
  } catch {
    return NextResponse.json({ error: "Email delivery failed." }, { status: 502 });
  }
  if (!delivered) {
    return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
  }

  // Record in the masterlist: create the contact, log touch #1, and link the report
  // token → email so an open of /r/<token> can graduate this contact to "opened".
  const now = new Date().toISOString();
  await store.upsertContact({
    email,
    business: body.businessName,
    domain: domainUrl,
    city: body.city,
    vertical: body.vertical,
    sourceCsv: body.sourceCsv,
    status: "cold",
  });
  await store.recordTouch(
    email,
    { n: 1, type: "cold-audit", at: now, reportToken: built.token },
    computeNextDueAt(now, COLD_FOLLOWUPS[0]), // schedule touch 2 (cold bump)
  );
  await store.linkToken(built.token, email, outreachReportTtlMs());

  return NextResponse.json({ sent: true, subject: built.subject, reportUrl: built.reportUrl });
}
