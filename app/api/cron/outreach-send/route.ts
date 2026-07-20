import { NextResponse } from "next/server";
import { cronAuthOk } from "@/lib/secret";
import { sendEmail } from "@/lib/outreach-send";
import { makeUnsubscribeToken } from "@/lib/unsubscribe-token";
import { outreachStore } from "@/lib/outreach-store";
import { nextStep, computeNextDueAt, COLD_FOLLOWUPS } from "@/lib/outreach-cadence";
import { buildOutreachEmail, buildFollowupEmail, outreachReportTtlMs } from "@/lib/outreach";
import { publicAuditStore } from "@/lib/public-audit";
import { prospectQueue } from "@/lib/prospect-queue";
import { qaSend } from "@/lib/outreach-qa";
import { site } from "@/lib/site";

// The autonomous sender. Runs ONCE PER DAY on a Vercel cron (see vercel.json —
// Vercel Hobby only allows daily crons; the original design was a multi-tick
// intraday drip, collapsed to one run/day 2026-07-20 when the Hobby plan
// rejected the deploy). Each run processes follow-ups first (cheap, no audit),
// then new cold sends, until OUTREACH_DAILY_SEND_CAP is reached — set
// OUTREACH_TICK_TOUCH_MAX/OUTREACH_TICK_COLD_MAX high enough that a single
// daily run can actually reach the cap (the cap itself, not the tick limits,
// is what bounds total sends). Every send passes the automated QA gate
// (lib/outreach-qa.ts); anything that fails is quarantined, never sent.
// Imports the same libs the founder-facing /api/outreach route uses — no
// self-HTTP, so this never double-runs or double-charges an audit.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function unsubUrl(email: string): string {
  return `${site.url}/api/outreach/unsubscribe?token=${makeUnsubscribeToken(email)}`;
}

export async function GET(request: Request) {
  if (!cronAuthOk(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cap = num(process.env.OUTREACH_DAILY_SEND_CAP, 25);
  const touchMax = num(process.env.OUTREACH_TICK_TOUCH_MAX, 3);
  const coldMax = num(process.env.OUTREACH_TICK_COLD_MAX, 2);

  const store = outreachStore();
  const queue = prospectQueue();
  const result = {
    touchesSent: 0,
    touchesSkippedQa: 0,
    coldSent: 0,
    coldSkippedQa: 0,
    coldSkippedDuplicate: 0,
    coldSkippedAuditFailed: 0,
    capped: false,
  };

  // ── Follow-ups first (cheap — no audit) ──────────────────────────────────
  const nowIso = new Date().toISOString();
  const due = (await store.dueForTouch(nowIso)).slice(0, touchMax);
  for (const contact of due) {
    const step = nextStep(contact);
    if (!step) continue;

    const reserved = await store.reserveSend(1, cap);
    if (!reserved.allowed) {
      result.capped = true;
      break;
    }

    const { subject, html } = buildFollowupEmail(contact, step);
    const token = contact.touches[0]?.reportToken;
    const reportLinkOk = token ? !!(await publicAuditStore().getReport(token)) : false;
    const qa = await qaSend({ subject, html, toEmail: contact.email, reportLinkOk });
    if (!qa.pass) {
      await queue.quarantine({
        prospect: { email: contact.email, businessName: contact.business, domainUrl: contact.domain },
        reasons: qa.reasons,
        subject,
      });
      result.touchesSkippedQa += 1;
      continue;
    }

    let delivered: boolean;
    try {
      delivered = await sendEmail(contact.email, subject, html, { unsubscribeUrl: unsubUrl(contact.email) });
    } catch {
      delivered = false;
    }
    if (!delivered) continue;

    const touchAt = new Date().toISOString();
    const touch = { n: step.n, type: step.type, at: touchAt };
    const after = nextStep({ ...contact, touches: [...contact.touches, touch], lastTouchAt: touchAt });
    const nextDue = after ? computeNextDueAt(touchAt, after) : null;
    await store.recordTouch(contact.email, touch, nextDue);
    result.touchesSent += 1;
  }

  // ── New cold, only if budget remains ─────────────────────────────────────
  if (!result.capped) {
    const prospects = await queue.popBatch(coldMax);
    for (const prospect of prospects) {
      // Backstop dedup: the masterlist is the source of truth, not just pq:seen.
      const existing = await store.getContact(prospect.email);
      if (existing) {
        result.coldSkippedDuplicate += 1;
        continue;
      }

      const reserved = await store.reserveSend(1, cap);
      if (!reserved.allowed) {
        result.capped = true;
        break;
      }

      let built;
      try {
        built = await buildOutreachEmail({ domainUrl: prospect.domainUrl, businessName: prospect.businessName });
      } catch {
        await queue.quarantine({ prospect, reasons: ["content: audit failed"] });
        result.coldSkippedAuditFailed += 1;
        continue;
      }

      const qa = await qaSend({
        subject: built.subject,
        html: built.html,
        toEmail: prospect.email,
        reportLinkOk: true,
      });
      if (!qa.pass) {
        await queue.quarantine({ prospect, reasons: qa.reasons, subject: built.subject });
        result.coldSkippedQa += 1;
        continue;
      }

      let delivered: boolean;
      try {
        delivered = await sendEmail(prospect.email, built.subject, built.html, {
          unsubscribeUrl: unsubUrl(prospect.email),
        });
      } catch {
        delivered = false;
      }
      if (!delivered) continue;

      const sentAt = new Date().toISOString();
      await store.upsertContact({
        email: prospect.email,
        business: prospect.businessName,
        domain: prospect.domainUrl,
        city: prospect.city,
        vertical: prospect.vertical,
        sourceCsv: prospect.source,
        status: "cold",
      });
      await store.recordTouch(
        prospect.email,
        { n: 1, type: "cold-audit", at: sentAt, reportToken: built.token },
        computeNextDueAt(sentAt, COLD_FOLLOWUPS[0]),
      );
      await store.linkToken(built.token, prospect.email, outreachReportTtlMs());
      result.coldSent += 1;
    }
  }

  return NextResponse.json(result);
}
