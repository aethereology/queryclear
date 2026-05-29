import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";

// Lead capture endpoint.
// On a valid submission we (1) notify the team and (2) send the prospect a
// confirmation with next steps. Each email sends independently; a delivery
// failure never blocks the other or loses the lead (always logged server-side).
// Env: RESEND_API_KEY, LEAD_TO (default site.email), LEAD_FROM.

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

function teamHtml(lead: Lead) {
  const rows = Object.entries(lead)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#5b5a4d">${k}</td><td>${String(v)}</td></tr>`,
    )
    .join("");
  return `<h2>New audit request</h2><table>${rows}</table>`;
}

function confirmationHtml(lead: Lead) {
  const name = lead.name?.trim().split(" ")[0] || "there";
  const business = lead.business?.trim();
  const site_ = lead.website?.trim();
  return `
  <div style="background:#f7f4ee;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#17180f">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #17180914;border-radius:14px;overflow:hidden">
      <div style="background:#12352a;padding:20px 28px;color:#f7f4ee;font-size:20px;font-weight:600">
        queryclear<span style="color:#b6f03c">.</span>
      </div>
      <div style="padding:28px">
        <p style="margin:0 0 16px;font-size:16px">Hi ${name},</p>
        <p style="margin:0 0 16px;line-height:1.6">
          Thanks for requesting a free AI search audit${business ? ` for <strong>${business}</strong>` : ""}.
          We've got your details and we're on it.
        </p>
        <p style="margin:0 0 8px;font-weight:600">Here's what happens next:</p>
        <ol style="margin:0 0 20px;padding-left:20px;line-height:1.7">
          <li>We review how AI answer engines — ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews — currently see ${site_ ? `<strong>${site_}</strong>` : "your site"}.</li>
          <li>We run real visibility tests for your category and check your site's structure, schema, and clarity.</li>
          <li>We send you a scored report with a prioritized, plain-English fix list — no jargon, no obligation.</li>
        </ol>
        <p style="margin:0 0 20px;line-height:1.6">
          Most audits go out within a couple of business days. Want a preview of what you'll get?
          <a href="${site.url}/audit" style="color:#12352a;font-weight:600">See a sample audit →</a>
        </p>
        <p style="margin:0 0 4px;line-height:1.6">Questions? Just reply to this email — a real person will answer.</p>
        <p style="margin:20px 0 0">— The queryclear team</p>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #17180914;color:#5b5a4d;font-size:12px;line-height:1.5">
        queryclear makes websites easier for search engines and AI answer engines to understand, trust, and recommend.
        We don't guarantee rankings or AI citations.
      </div>
    </div>
  </div>`;
}

function confirmationText(lead: Lead) {
  const name = lead.name?.trim().split(" ")[0] || "there";
  const business = lead.business?.trim();
  return [
    `Hi ${name},`,
    "",
    `Thanks for requesting a free AI search audit${business ? ` for ${business}` : ""}. We've got your details and we're on it.`,
    "",
    "Here's what happens next:",
    "1. We review how AI answer engines (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) currently see your site.",
    "2. We run real visibility tests for your category and check your site's structure, schema, and clarity.",
    "3. We send you a scored report with a prioritized, plain-English fix list — no jargon, no obligation.",
    "",
    `Most audits go out within a couple of business days. See a sample audit: ${site.url}/audit`,
    "",
    "Questions? Just reply to this email — a real person will answer.",
    "",
    "— The queryclear team",
  ].join("\n");
}

async function sendEmails(lead: Lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // delivery not configured — lead is still logged
  const resend = new Resend(key);
  const to = process.env.LEAD_TO ?? site.email;
  const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";

  // 1) Notify the team.
  try {
    await resend.emails.send({
      from,
      to,
      replyTo: isEmail(lead.email) ? lead.email : undefined,
      subject: `New AI search audit request — ${lead.business ?? lead.name ?? "lead"}`,
      html: teamHtml(lead),
    });
  } catch (err) {
    console.error("[lead] team notification failed:", err);
  }

  // 2) Confirm to the prospect.
  if (isEmail(lead.email)) {
    try {
      await resend.emails.send({
        from,
        to: lead.email,
        replyTo: to,
        subject: "Your free AI search audit — here's what happens next",
        html: confirmationHtml(lead),
        text: confirmationText(lead),
      });
    } catch (err) {
      console.error("[lead] confirmation email failed:", err);
    }
  }
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

  await sendEmails(body);

  return NextResponse.json({ ok: true });
}
