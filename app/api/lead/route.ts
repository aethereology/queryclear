import { NextResponse } from "next/server";
import { Resend } from "resend";
import { promises as dns } from "dns";
import {
  renderAuditConfirmationEmail,
  renderAuditConfirmationText,
  renderLeadNotificationEmail,
} from "@/lib/email";
import { site } from "@/lib/site";
import {
  operationsStore,
  type DeliveryState,
  type OperationsStore,
} from "@/lib/operations-store";
import { readJsonRequest } from "@/lib/json-request";

// Lead capture endpoint.
// On a valid submission we (1) notify the team and (2) send the prospect a
// confirmation with next steps. The lead is durably persisted before either
// email is attempted; failed notifications remain in the operations outbox.
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
const DOMAIN_LOOKUP_TIMEOUT_MS = 3_000;
const MAX_REQUEST_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const WEBSITE_URL_ERROR =
  "Please add a valid public website URL starting with http:// or https://.";

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

  if (
    !["http:", "https:"].includes(websiteUrl.protocol) ||
    websiteUrl.username ||
    websiteUrl.password ||
    websiteUrl.port
  ) {
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
  const trustedIp =
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim();
  if (trustedIp) return trustedIp;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}

async function checkRateLimit(store: OperationsStore, req: Request): Promise<ValidationError | null> {
  const result = await store.rateLimit(
    "inquiry",
    getClientIp(req),
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS,
  );
  return result.allowed
    ? null
    : { ok: false, status: 429, error: "Please try again later." };
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
  const host = websiteUrl.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    return { ok: false, error: WEBSITE_URL_ERROR };
  }

  try {
    const addresses = await withTimeout(
      dns.lookup(host, { all: true, verbatim: true }),
      DOMAIN_LOOKUP_TIMEOUT_MS,
    );
    if (!addresses.length || addresses.some(({ address }) => isPrivateOrReservedAddress(address))) {
      return { ok: false, error: WEBSITE_URL_ERROR };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Please enter a website with a valid, existing domain.",
    };
  }
}

function isPrivateOrReservedAddress(address: string): boolean {
  let value = address.toLowerCase().split("%", 1)[0] ?? "";
  if (value.startsWith("::ffff:")) value = value.slice(7);
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) {
    const [a, b, c] = value.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }
  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    /^fe[89ab]/.test(value) ||
    value.startsWith("ff") ||
    value.startsWith("2001:db8:")
  );
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

async function sendEmails(
  lead: Lead,
  leadId: string,
): Promise<{ team: DeliveryState; prospect: DeliveryState }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { team: "not_configured", prospect: "not_configured" };
  const resend = new Resend(key);
  const to = process.env.LEAD_TO ?? site.email;
  const from = process.env.LEAD_FROM ?? `queryclear <${site.email}>`;

  const jobs = [
    {
      target: "team",
      promise: withTimeout(
        Promise.resolve().then(async () => {
          const response = await resend.emails.send(
            {
              from,
              to,
              replyTo: lead.email,
              subject: `New website inquiry — ${emailSubjectText(lead.business || lead.name)}`,
              html: teamHtml(lead),
            },
            { idempotencyKey: `lead-${leadId}-team` },
          );
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
          const response = await resend.emails.send(
            {
              from,
              to: lead.email,
              replyTo: to,
              subject: "We got your inquiry — next steps",
              html: confirmationHtml(lead),
              text: confirmationText(lead),
            },
            { idempotencyKey: `lead-${leadId}-prospect` },
          );
          assertEmailSent(response);
          return response;
        }),
        EMAIL_TIMEOUT_MS,
      ),
    },
  ] as const;

  const results = await Promise.allSettled(jobs.map((job) => job.promise));
  const delivery: DeliveryState[] = results.map((result, index) => {
    if (result.status === "rejected") {
      console.error(
        "[lead] delivery failed",
        JSON.stringify({
          target: jobs[index].target,
          reason: deliveryErrorReason(result.reason),
        }),
      );
      return "failed";
    }
    return "sent";
  });
  return { team: delivery[0], prospect: delivery[1] };
}

export async function POST(req: Request) {
  let store: OperationsStore;
  try {
    store = operationsStore();
  } catch {
    console.error("[lead] shared storage unavailable");
    return NextResponse.json(
      { error: "We couldn't safely save your request. Please email us instead." },
      { status: 503 },
    );
  }

  let rateLimitError: ValidationError | null;
  try {
    rateLimitError = await checkRateLimit(store, req);
  } catch {
    console.error("[lead] rate limit storage unavailable");
    return NextResponse.json(
      { error: "We couldn't safely save your request. Please email us instead." },
      { status: 503 },
    );
  }
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError.error }, { status: rateLimitError.status });
  }

  const parsedBody = await readJsonRequest(req, MAX_REQUEST_BYTES);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: parsedBody.status },
    );
  }

  const validation = validateLead(parsedBody.value);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const domainValidation = await validateWebsiteDomain(validation.websiteUrl);
  if (!domainValidation.ok) {
    return NextResponse.json({ error: domainValidation.error }, { status: 422 });
  }

  const leadId = crypto.randomUUID();
  const receivedAt = new Date().toISOString();
  try {
    await store.saveLead({
      id: leadId,
      kind: "inquiry",
      receivedAt,
      websiteHost: validation.websiteUrl.hostname,
      payload: { ...validation.lead, website: validation.websiteUrl.href },
      delivery: { team: "pending", prospect: "pending", updatedAt: receivedAt },
    });
  } catch {
    console.error("[lead] durable save failed");
    return NextResponse.json(
      { error: "We couldn't safely save your request. Please email us instead." },
      { status: 503 },
    );
  }

  console.log(
    "[lead]",
    JSON.stringify({
      at: new Date().toISOString(),
      host: validation.websiteUrl.hostname,
      result: "accepted",
    }),
  );

  let delivery: { team: DeliveryState; prospect: DeliveryState } = {
    team: "failed",
    prospect: "failed",
  };
  try {
    delivery = await sendEmails(
      { ...validation.lead, website: validation.websiteUrl.href },
      leadId,
    );
  } catch {
    console.error("[lead] notification setup failed");
  }
  try {
    await store.updateLeadDelivery(leadId, { ...delivery, updatedAt: new Date().toISOString() });
  } catch {
    // The original durable record remains pending in the outbox.
    console.error("[lead] delivery status update failed");
  }

  return NextResponse.json({ ok: true });
}
