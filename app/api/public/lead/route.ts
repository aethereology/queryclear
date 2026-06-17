import { NextResponse } from "next/server";
import { Resend } from "resend";
import { publicAuditStore } from "@/lib/public-audit";
import { renderPublicAuditLeadEmail, type PublicAuditLeadEmail } from "@/lib/email";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TIMEOUT_MS = 8_000;

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

// Notify the team that a free-audit lead came in. Never blocks/loses the lead.
async function notifyLead(lead: PublicAuditLeadEmail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // delivery not configured — lead still logged below
  const resend = new Resend(key);
  const to = process.env.LEAD_TO ?? site.email;
  const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";
  const result = await Promise.allSettled([
    withTimeout(
      resend.emails.send({
        from,
        to,
        replyTo: lead.email,
        subject:
          lead.source === "capacity-gate"
            ? `Free-audit lead (over cap) — ${lead.domainUrl}`
            : `New free-audit lead — ${lead.domainUrl}`,
        html: renderPublicAuditLeadEmail(lead, site),
      }),
      EMAIL_TIMEOUT_MS
    ),
  ]);
  if (result[0].status === "rejected") {
    console.error("[free-audit-lead] delivery failed");
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    token?: string;
    domainUrl?: string;
  };
  const email = (body.email ?? "").trim();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  // Unlock path: a report was generated and cached under this token.
  const report = body.token ? await publicAuditStore().getReport(body.token) : null;
  const lead: PublicAuditLeadEmail = {
    email,
    domainUrl: body.domainUrl ?? report?.domain_url ?? "",
    source: report ? "report-unlock" : "capacity-gate",
  };

  console.log(
    "[free-audit-lead]",
    JSON.stringify({ at: new Date().toISOString(), source: lead.source })
  );
  await notifyLead(lead);

  if (report) return NextResponse.json({ report });
  return NextResponse.json({ queued: true });
}
