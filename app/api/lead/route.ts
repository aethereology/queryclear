import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";

// Lead capture endpoint.
// On a valid submission we (1) notify the team and (2) send the prospect a
// confirmation with next steps. Each email sends independently; a delivery
// failure never blocks the other or loses the lead (always logged server-side).
// Env: RESEND_API_KEY, LEAD_TO (default site.email), LEAD_FROM.

type Lead = {
  name: string;
  email: string;
  website: string;
  business: string;
  service?: string;
  city?: string;
  message?: string;
};

type LeadField = keyof Lead;
type HoneypotField = "company";

type ValidationError = { ok: false; status: 400 | 422 | 429; error: string };
type ValidationResult =
  | { ok: true; lead: Lead; websiteUrl: URL }
  | ValidationError;

const HONEYPOT_FIELD: HoneypotField = "company";
const EMAIL_TIMEOUT_MS = 8_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const leadFields = ["name", "email", "website", "business", "service", "city", "message"] as const;
const fieldLimits: Record<LeadField | HoneypotField, number> = {
  name: 120,
  email: 254,
  website: 2048,
  business: 160,
  service: 120,
  city: 120,
  message: 2000,
  company: 200,
};
const fieldLabels: Record<LeadField, string> = {
  name: "Name",
  email: "Email",
  website: "Website",
  business: "Business",
  service: "Main service",
  city: "City / market",
  message: "Message",
};
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLeadField(field: string): field is LeadField {
  return (leadFields as readonly string[]).includes(field);
}

function isAllowedField(field: string): field is LeadField | HoneypotField {
  return isLeadField(field) || field === HONEYPOT_FIELD;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function genericValidationError(): ValidationResult {
  return { ok: false, status: 422, error: "Please check your details and try again." };
}

function validateLead(body: unknown): ValidationResult {
  if (!isRecord(body)) {
    return { ok: false, status: 400, error: "Invalid request." };
  }

  const values: Partial<Record<LeadField | HoneypotField, string>> = {};

  for (const [field, value] of Object.entries(body)) {
    if (typeof value !== "string") {
      return genericValidationError();
    }

    if (!isAllowedField(field)) {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed.length > fieldLimits[field]) {
      return genericValidationError();
    }
    values[field] = trimmed;
  }

  if (values[HONEYPOT_FIELD]) {
    return genericValidationError();
  }

  const name = values.name;
  const email = values.email;
  const website = values.website;
  const business = values.business;

  if (!name) {
    return { ok: false, status: 422, error: `Please add your ${fieldLabels.name.toLowerCase()}.` };
  }
  if (!email) {
    return { ok: false, status: 422, error: `Please add your ${fieldLabels.email.toLowerCase()}.` };
  }
  if (!website) {
    return { ok: false, status: 422, error: `Please add your ${fieldLabels.website.toLowerCase()}.` };
  }
  if (!business) {
    return {
      ok: false,
      status: 422,
      error: `Please add your ${fieldLabels.business.toLowerCase()}.`,
    };
  }

  if (!isEmail(email)) {
    return { ok: false, status: 422, error: "Please add a valid email." };
  }

  let websiteUrl: URL;
  try {
    websiteUrl = new URL(website);
  } catch {
    return { ok: false, status: 422, error: "Please add a valid website URL." };
  }

  if (websiteUrl.protocol !== "http:" && websiteUrl.protocol !== "https:") {
    return { ok: false, status: 422, error: "Please add a valid website URL." };
  }

  return {
    ok: true,
    websiteUrl,
    lead: {
      name,
      email,
      website,
      business,
      ...(values.service ? { service: values.service } : {}),
      ...(values.city ? { city: values.city } : {}),
      ...(values.message ? { message: values.message } : {}),
    },
  };
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function checkRateLimit(req: Request): ValidationError | null {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return { ok: false, status: 429, error: "Please try again later." };
  }

  bucket.count += 1;
  return null;
}

function emailSubjectText(value: string) {
  return value.replace(/[\r\n]+/g, " ").slice(0, 140);
}

function deliveryErrorReason(reason: unknown) {
  if (reason instanceof Error) return reason.name || "Error";
  if (isRecord(reason) && typeof reason.name === "string") return reason.name;
  return typeof reason;
}

function assertEmailSent(response: { error: unknown }) {
  if (response.error) {
    throw response.error;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Email delivery timed out.")), ms);
  });

  try {
    return await Promise.race([promise, timedOut]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function teamHtml(lead: Lead) {
  const rows = leadFields
    .filter((field) => lead[field])
    .map(
      (field) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#5b5a4d">${escapeHtml(fieldLabels[field])}</td><td>${escapeHtml(lead[field] ?? "")}</td></tr>`,
    )
    .join("");
  return `<h2>New audit request</h2><table>${rows}</table>`;
}

function confirmationHtml(lead: Lead) {
  const name = escapeHtml(lead.name.split(" ")[0] || "there");
  const business = escapeHtml(lead.business);
  const website = escapeHtml(lead.website);
  const auditUrl = escapeHtml(`${site.url}/audit`);
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
          <li>We review how AI answer engines — ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews — currently see <strong>${website}</strong>.</li>
          <li>We run real visibility tests for your category and check your site's structure, schema, and clarity.</li>
          <li>We send you a scored report with a prioritized, plain-English fix list — no jargon, no obligation.</li>
        </ol>
        <p style="margin:0 0 20px;line-height:1.6">
          Most audits go out within a couple of business days. Want a preview of what you'll get?
          <a href="${auditUrl}" style="color:#12352a;font-weight:600">See a sample audit →</a>
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
  const name = lead.name.split(" ")[0] || "there";
  const business = lead.business;
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

  const jobs = [
    {
      target: "team",
      promise: withTimeout(
        Promise.resolve().then(async () => {
          const response = await resend.emails.send({
            from,
            to,
            replyTo: lead.email,
            subject: `New AI search audit request — ${emailSubjectText(lead.business || lead.name)}`,
            html: teamHtml(lead),
          });
          assertEmailSent(response);
          return response;
        }),
        EMAIL_TIMEOUT_MS,
      ),
    },
    {
      target: "confirmation",
      promise: withTimeout(
        Promise.resolve().then(async () => {
          const response = await resend.emails.send({
            from,
            to: lead.email,
            replyTo: to,
            subject: "Your free AI search audit — here's what happens next",
            html: confirmationHtml(lead),
            text: confirmationText(lead),
          });
          assertEmailSent(response);
          return response;
        }),
        EMAIL_TIMEOUT_MS,
      ),
    },
  ] as const;

  const results = await Promise.allSettled(jobs.map((job) => job.promise));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        "[lead] delivery failed",
        JSON.stringify({
          target: jobs[index].target,
          reason: deliveryErrorReason(result.reason),
        }),
      );
    }
  });
}

export async function POST(req: Request) {
  const rateLimitError = checkRateLimit(req);
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError.error }, { status: rateLimitError.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const validation = validateLead(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  // Always record an accepted lead with privacy-safe metadata, regardless of delivery state.
  console.log(
    "[lead]",
    JSON.stringify({
      at: new Date().toISOString(),
      host: validation.websiteUrl.hostname,
      result: "accepted",
    }),
  );

  await sendEmails(validation.lead);

  return NextResponse.json({ ok: true });
}
