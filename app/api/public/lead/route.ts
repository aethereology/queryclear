import { NextResponse } from "next/server";
import { Resend } from "resend";
import { publicAuditConfig, publicAuditStore } from "@/lib/public-audit";
import {
  renderPublicAuditLeadEmail,
  renderPublicAuditReportEmail,
  type MarketingAttribution,
  type PublicAuditLeadEmail,
} from "@/lib/email";
import type { AuditReportData } from "@/lib/agent-runtime";
import { site } from "@/lib/site";
import { createHash, randomUUID } from "node:crypto";
import {
  operationsStore,
  type DeliveryState,
  type OperationsStore,
} from "@/lib/operations-store";
import { readJsonRequest } from "@/lib/json-request";
import { normalizePublicAuditUrl } from "@/lib/public-audit-url";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TIMEOUT_MS = 8_000;
const ATTR_MAX = 240;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const MAX_REQUEST_BYTES = 8 * 1024;
const REPORT_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanAttr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, ATTR_MAX);
}

function sanitizeAttribution(value: unknown): MarketingAttribution | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const attribution: MarketingAttribution = {
    utmSource: cleanAttr(raw.utmSource),
    utmMedium: cleanAttr(raw.utmMedium),
    utmCampaign: cleanAttr(raw.utmCampaign),
    utmContent: cleanAttr(raw.utmContent),
    utmTerm: cleanAttr(raw.utmTerm),
    referrer: cleanReferrer(raw.referrer),
    landingPath: cleanLandingPath(raw.landingPath),
  };
  return Object.values(attribution).some(Boolean) ? attribution : undefined;
}

function cleanReferrer(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    return `${url.origin}${url.pathname}`.slice(0, ATTR_MAX);
  } catch {
    return undefined;
  }
}

function cleanLandingPath(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const canonical = new URL(site.url);
    const url = new URL(value, canonical);
    if (url.origin !== canonical.origin) return undefined;
    return url.pathname.slice(0, ATTR_MAX);
  } catch {
    return undefined;
  }
}

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

function assertEmailSent(response: { error?: unknown }) {
  if (response.error) throw response.error;
}

function clientIp(request: Request): string {
  const trusted =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  if (trusted) return trusted;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function normalizeDomainUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return normalizePublicAuditUrl(value);
  } catch {
    return null;
  }
}

function websiteHost(value: string): string {
  try {
    return new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`).hostname;
  } catch {
    return "unknown";
  }
}

// Notify the team that a free-audit lead came in. The durable lead/outbox is
// written before this best-effort delivery is attempted.
async function notifyLead(lead: PublicAuditLeadEmail, leadId: string): Promise<DeliveryState> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "not_configured";
  const resend = new Resend(key);
  const to = process.env.LEAD_TO ?? site.email;
  const from = process.env.LEAD_FROM ?? `queryclear <${site.email}>`;
  const result = await Promise.allSettled([
    withTimeout(
      resend.emails.send(
        {
          from,
          to,
          replyTo: lead.email,
          subject:
            lead.source === "capacity-gate"
              ? `Free-audit lead (over cap) — ${lead.domainUrl}`
              : `New free-audit lead — ${lead.domainUrl}`,
          html: renderPublicAuditLeadEmail(lead, site),
        },
        { idempotencyKey: `lead-${leadId}-team` },
      ).then((response) => {
        assertEmailSent(response);
        return response;
      }),
      EMAIL_TIMEOUT_MS
    ),
  ]);
  if (result[0].status === "rejected") {
    console.error("[free-audit-lead] delivery failed");
    return "failed";
  }
  return "sent";
}

// Send the prospect their audit + the paid offer CTAs. Best-effort: a failure
// here must never block returning the report to the browser.
async function emailProspectReport(
  report: AuditReportData,
  email: string,
  leadId: string,
): Promise<DeliveryState> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "not_configured";
  const resend = new Resend(key);
  const from = process.env.LEAD_FROM ?? `queryclear <${site.email}>`;
  const replyTo = process.env.LEAD_TO ?? site.email;
  const result = await Promise.allSettled([
    withTimeout(
      resend.emails.send(
        {
          from,
          to: email,
          replyTo,
          subject: `Your search-readiness preview — ${report.domain_url}`,
          html: renderPublicAuditReportEmail(report, { siteUrl: site.url }, site),
        },
        { idempotencyKey: `lead-${leadId}-prospect` },
      ).then((response) => {
        assertEmailSent(response);
        return response;
      }),
      EMAIL_TIMEOUT_MS
    ),
  ]);
  if (result[0].status === "rejected") {
    console.error("[free-audit-prospect] delivery failed");
    return "failed";
  }
  return "sent";
}

export async function POST(request: Request) {
  let store: OperationsStore;
  try {
    store = operationsStore();
    const rateLimit = await store.rateLimit(
      "public-lead",
      clientIp(request),
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))) },
        },
      );
    }
  } catch {
    console.error("[free-audit-lead] shared storage unavailable");
    return NextResponse.json(
      { error: "We couldn't safely save your request. Please email us instead." },
      { status: 503 },
    );
  }

  const parsedBody = await readJsonRequest(request, MAX_REQUEST_BYTES);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  if (!isRecord(parsedBody.value)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const body = parsedBody.value as {
    email?: string;
    token?: string;
    domainUrl?: string;
    attribution?: unknown;
  };
  const email = (body.email ?? "").trim();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  if (body.token && (typeof body.token !== "string" || !REPORT_TOKEN.test(body.token))) {
    return NextResponse.json({ error: "Invalid report token." }, { status: 400 });
  }

  // Unlock path: a report was generated and cached under this token.
  let report: AuditReportData | null = null;
  if (body.token) {
    try {
      const auditStore = publicAuditStore();
      report = await auditStore.getReport(body.token);
      if (!report) {
        return NextResponse.json(
          { error: "This report link has expired. Please run a new audit." },
          { status: 410 },
        );
      }
    } catch {
      console.error("[free-audit-lead] report lookup storage unavailable");
      return NextResponse.json(
        { error: "We couldn't safely unlock this report. Please try again." },
        { status: 503 },
      );
    }
  }
  const submittedDomain = normalizeDomainUrl(body.domainUrl);
  if (!report && !submittedDomain) {
    return NextResponse.json({ error: "Please enter a valid website." }, { status: 400 });
  }
  const lead: PublicAuditLeadEmail = {
    email,
    domainUrl: report?.domain_url ?? submittedDomain ?? "",
    source: report ? "report-unlock" : "capacity-gate",
    attribution: sanitizeAttribution(body.attribution),
  };
  const leadId = randomUUID();
  const receivedAt = new Date().toISOString();
  const storedLead = {
    id: leadId,
    kind: "public-audit" as const,
    receivedAt,
    websiteHost: websiteHost(lead.domainUrl),
    payload: {
      email: lead.email,
      domainUrl: lead.domainUrl,
      source: lead.source,
      attribution: lead.attribution,
      reportUnlocked: Boolean(report),
      ...(body.token
        ? {
            reportReference: createHash("sha256")
              .update(body.token)
              .digest("hex")
              .slice(0, 16),
          }
        : {}),
    },
    delivery: {
      team: "pending" as const,
      prospect: report ? ("pending" as const) : ("not_applicable" as const),
      updatedAt: receivedAt,
    },
  };
  try {
    if (body.token) {
      const result = await store.claimReportAndSaveLead(
        body.token,
        publicAuditConfig().reportTtlMs,
        storedLead,
      );
      if (result === "already_claimed") {
        return NextResponse.json(
          { error: "This report has already been unlocked." },
          { status: 409 },
        );
      }
    } else {
      await store.saveLead(storedLead);
    }
  } catch {
    console.error("[free-audit-lead] durable save failed");
    return NextResponse.json(
      { error: "We couldn't safely save your request. Please email us instead." },
      { status: 503 },
    );
  }

  // Social attribution is isolated and best-effort. It neither reads nor writes
  // outreach state, and a telemetry failure can never block the audit lead.
  let socialAttributionPromise: Promise<unknown> = Promise.resolve();
  if (
    lead.attribution?.utmMedium === "organic_social" &&
    lead.attribution.utmSource &&
    ["linkedin", "x", "instagram", "facebook", "reddit"].includes(lead.attribution.utmSource)
  ) {
    socialAttributionPromise = import("@/lib/social/store")
      .then(({ socialStore }) =>
        socialStore().recordConversion({
          id: randomUUID(),
          postId: lead.attribution?.utmContent,
          platform: lead.attribution?.utmSource as "linkedin" | "x" | "instagram" | "facebook" | "reddit",
          campaign: lead.attribution?.utmCampaign,
          kind: "free-audit-lead",
          source: lead.source,
          occurredAt: new Date().toISOString(),
        }),
      )
      .catch(() => undefined);
  }

  console.log(
    "[free-audit-lead]",
    JSON.stringify({
      at: new Date().toISOString(),
      source: lead.source,
      utmSource: lead.attribution?.utmSource,
      utmCampaign: lead.attribution?.utmCampaign,
    })
  );
  // Team notify always; prospect report email only when there's a report to send.
  const [teamDelivery, prospectDelivery] = await Promise.all([
    notifyLead(lead, leadId),
    report ? emailProspectReport(report, email, leadId) : Promise.resolve("not_applicable" as const),
    withTimeout(socialAttributionPromise, 1_000).catch(() => undefined),
  ]);

  try {
    await store.updateLeadDelivery(leadId, {
      team: teamDelivery,
      prospect: prospectDelivery,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // The durable record remains pending in the outbox for reconciliation.
    console.error("[free-audit-lead] delivery status update failed");
  }

  if (report) return NextResponse.json({ report });
  return NextResponse.json({ queued: true });
}
