import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";

// Lead capture endpoint.
// Sends an email via Resend when RESEND_API_KEY is set; always logs server-side
// so a lead is never silently lost, even before/if email delivery is configured.
// Env: RESEND_API_KEY, LEAD_TO (default site.email), LEAD_FROM (default resend.dev test sender).

type Lead = {
  name?: string;
  email?: string;
  website?: string;
  business?: string;
  service?: string;
  city?: string;
  message?: string;
};

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function deliver(lead: Lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // delivery not configured yet — lead is still logged below
  const resend = new Resend(key);
  const to = process.env.LEAD_TO ?? site.email;
  const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";
  const rows = Object.entries(lead)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5b5a4d">${k}</td><td>${String(v)}</td></tr>`)
    .join("");
  await resend.emails.send({
    from,
    to,
    replyTo: isEmail(lead.email) ? lead.email : undefined,
    subject: `New AI search audit request — ${lead.business ?? lead.name ?? "lead"}`,
    html: `<h2>New audit request</h2><table>${rows}</table>`,
  });
}

export async function POST(req: Request) {
  let body: Lead;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Please add your name." }, { status: 422 });
  }
  if (!isEmail(body.email)) {
    return NextResponse.json({ error: "Please add a valid email." }, { status: 422 });
  }
  if (!body.website?.trim()) {
    return NextResponse.json({ error: "Please add your website URL." }, { status: 422 });
  }

  // Always record the lead, regardless of delivery state.
  console.log("[lead]", JSON.stringify({ ...body, at: new Date().toISOString() }));

  try {
    await deliver(body);
  } catch (err) {
    // Never fail the visitor because email delivery hiccupped — the lead is logged.
    console.error("[lead] delivery failed:", err);
  }

  return NextResponse.json({ ok: true });
}
