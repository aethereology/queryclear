import { NextResponse } from "next/server";
import { Resend } from "resend";
import { promises as dns } from "dns";
import {
  renderAuditConfirmationEmail,
  renderAuditConfirmationText,
  renderLeadNotificationEmail,
} from "@/lib/email";
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
  interest?: string;
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
const WEBSITE_URL_ERROR =
  "Please add a valid website URL. Valid websites must start with https://.";

const leadFields = ["name", "email", "website", "business", "service", "city", "interest", "message"] as const;
const fieldLimits: Record<LeadField | HoneypotField, number> = {
  name: 120,
  email: 254,
  website: 2048,
  business: 160,
  service: 120,
  city: 120,
  interest: 120,
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
  interest: "Interested in",
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
    return { ok: false, status: 422, error: WEBSITE_URL_ERROR };
  }

  if (websiteUrl.protocol !== "https:") {
    return { ok: false, status: 422, error: WEBSITE_URL_ERROR };
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
      ...(values.interest ? { interest: values.interest } : {}),
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

async function validateWebsiteDomain(
  websiteUrl: URL,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await dns.resolve4(websiteUrl.hostname);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Please enter a website with a valid, existing domain.",
    };
  }
}

function teamHtml(lead: Lead) {
  return renderLeadNotificationEmail(lead, site);
}

function confirmationHtml(lead: Lead) {
  return renderAuditConfirmationEmail(lead, site);
}

function confirmationText(lead: Lead) {
  return renderAuditConfirmationText(lead, site);
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
            subject: `New AI Search Snapshot request — ${emailSubjectText(lead.business || lead.name)}`,
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
            subject: "We got your Snapshot request — next steps",
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

  const domainValidation = await validateWebsiteDomain(validation.websiteUrl);
  if (!domainValidation.ok) {
    return NextResponse.json({ error: domainValidation.error }, { status: 422 });
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
