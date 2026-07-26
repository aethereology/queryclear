// Cold-outreach audit builder. The ONE place a cold-outreach email is produced:
// run the read-only audit, cache the full report under an unguessable token, and
// render the plain conversation-first email that links to the pre-unlocked report
// page (/r/<token>) — where the offers live. The /api/outreach route is the only
// caller; the CLI reaches it through that route over HTTP.

import { randomUUID } from "node:crypto";
import { runAudit, type AuditReportData } from "./agent-runtime";
import { renderOutreachAuditEmail, renderOutreachFollowupEmail } from "./email";
import { publicAuditStore } from "./public-audit";
import type { Contact } from "./outreach-store";
import type { CadenceStep } from "./outreach-cadence";
import { site } from "./site";

// Clearly-marked placeholder until the founder sets OUTREACH_POSTAL_ADDRESS, so
// nothing ever ships with an invented address (a guardrail, see CLAUDE.md §4).
// Exported so lib/outreach-qa.ts can hard-fail any autonomous send that still
// carries it.
export const POSTAL_FALLBACK = "SparkCreatives Inc., [ADD POSTAL ADDRESS — set OUTREACH_POSTAL_ADDRESS]";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface OutreachEmail {
  subject: string;
  html: string;
  report: AuditReportData;
  token: string;
  reportUrl: string;
}

// Cost-metering ids for the runtime. Default to the public-audit ids (which have a
// token budget on the agent-runtime); override with OUTREACH_ORG_ID / OUTREACH_DOMAIN_ID
// to track outreach spend separately.
function meteringIds() {
  return {
    orgId:
      process.env.OUTREACH_ORG_ID ??
      process.env.PUBLIC_AUDIT_ORG_ID ??
      "org_dev_queryclear",
    domainId:
      process.env.OUTREACH_DOMAIN_ID ??
      process.env.PUBLIC_AUDIT_DOMAIN_ID ??
      "domain_dev_queryclear",
  };
}

// Prospects may click days after the send, so the report link lives longer than the
// 24h /free-audit cache. Override with OUTREACH_REPORT_TTL_MS.
//
// This MUST exceed the longest gap between two consecutive cadence steps (today
// 120 days, NURTURE_FOLLOWUPS' last step in lib/outreach-cadence.ts) — every
// follow-up reuses touch 1's report link, and ensureReportLink() slides the TTL
// forward on each send, so the link survives the full ~465-day cadence as long
// as one TTL window covers one gap. The old 30-day default silently expired
// mid-cadence and quarantined every nurture touch past day 30.
export function outreachReportTtlMs(): number {
  const n = Number(process.env.OUTREACH_REPORT_TTL_MS);
  return Number.isFinite(n) && n > 0 ? n : 180 * DAY_MS;
}

export interface ReportLink {
  /** Token to use for this send — the existing one, or a freshly minted one. */
  token?: string;
  reportUrl: string;
  /** False when we could neither refresh nor re-mint; QA quarantines on this. */
  ok: boolean;
}

// Resolve the report link a follow-up should point at, keeping it alive:
//   1. token still cached  → slide its TTL forward, reuse it
//   2. token gone/expired  → re-run the audit and mint a fresh one
//   3. can't do either     → fall back to /free-audit and report ok:false
// Re-auditing costs an agent-runtime call, but only on the lapsed path — and a
// dead link in a nurture email is worse than the audit spend. The caller
// persists a newly-minted token (store.setReportToken) so later touches reuse it.
export async function ensureReportLink(contact: Contact): Promise<ReportLink> {
  const store = publicAuditStore();
  const existing = contact.touches[0]?.reportToken;

  if (existing) {
    const cached = await store.getReport(existing);
    if (cached) {
      await store.putReport(existing, cached, outreachReportTtlMs()); // slide TTL
      return { token: existing, reportUrl: `${site.url}/r/${existing}`, ok: true };
    }
  }

  const domainUrl = contact.domain?.trim();
  if (!domainUrl) return { reportUrl: `${site.url}/free-audit`, ok: false };

  try {
    const { orgId, domainId } = meteringIds();
    const report = await runAudit({
      orgId,
      domainId,
      domainUrl,
      brand: contact.business,
      samples: 1,
    });
    const token = randomUUID();
    await store.putReport(token, report, outreachReportTtlMs());
    return { token, reportUrl: `${site.url}/r/${token}`, ok: true };
  } catch {
    return { reportUrl: `${site.url}/free-audit`, ok: false };
  }
}

export async function buildOutreachEmail(input: {
  domainUrl: string;
  businessName?: string;
}): Promise<OutreachEmail> {
  const { orgId, domainId } = meteringIds();
  const report = await runAudit({
    orgId,
    domainId,
    domainUrl: input.domainUrl,
    brand: input.businessName,
    samples: 1,
  });

  const token = randomUUID();
  await publicAuditStore().putReport(token, report, outreachReportTtlMs());
  const reportUrl = `${site.url}/r/${token}`;

  const html = renderOutreachAuditEmail(
    report,
    {
      siteUrl: site.url,
      postalAddress: process.env.OUTREACH_POSTAL_ADDRESS ?? POSTAL_FALLBACK,
      reportUrl,
      businessName: input.businessName,
    },
    site,
  );

  const subject = `is ChatGPT recommending ${input.businessName?.trim() || report.domain_url}?`;
  return { subject, html, report, token, reportUrl };
}

// Build a nurture follow-up for an existing contact. Reuses the report link from
// touch 1 (falls back to /free-audit if the token's gone). Subject by kind.
// Send paths should resolve `reportUrl` via ensureReportLink() first so the link
// is refreshed/re-minted; omitting it keeps the old read-only behaviour, which is
// what the `due` preview action wants (it must not mint anything).
export function buildFollowupEmail(
  contact: Contact,
  step: CadenceStep & { n: number },
  reportUrl?: string,
): { subject: string; html: string } {
  const biz = (contact.business && contact.business.trim()) || contact.domain || "your business";
  const token = contact.touches[0]?.reportToken;
  reportUrl ??= token ? `${site.url}/r/${token}` : `${site.url}/free-audit`;

  const html = renderOutreachFollowupEmail(step.type, {
    businessName: contact.business,
    domain: contact.domain ?? "",
    reportUrl,
    postalAddress: process.env.OUTREACH_POSTAL_ADDRESS ?? POSTAL_FALLBACK,
    siteName: site.name,
  });

  const subjectByKind: Record<string, string> = {
    bump: `following up — ${biz} + AI search`,
    tip: `a quick AI-search tip for ${biz}`,
    "last-note": `last note about ${biz}`,
    "nurture-case": `${biz} + AI search`,
    "nurture-checkin": `checking in — ${biz}`,
    "nurture-tip": `${biz} + AI search`,
  };
  return { subject: subjectByKind[step.type] ?? `${biz} + AI search`, html };
}
