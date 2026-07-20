// Deterministic port of the `prospect-curator` agent's rules (see
// .claude/agents/prospect-curator.md and the 120→54 Jacksonville pass in
// docs/marketing/outreach/2026-07-06-medspa-jacksonville-batch.md) — the same
// judgment calls a human/agent made reviewing a raw Apify dump, now applied
// unattended by the prospect-ingest cron. Conservative by design: anything
// ambiguous drops rather than risks a bad send.

import type { PlaceItem } from "./apify";
import type { ProspectInput } from "./prospect-queue";

export interface CurateResult {
  kept: ProspectInput[];
  dropped: { title?: string; reason: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Booking-platform / website-builder domains the scraper sometimes misreads
// as a business's own contact email — these are the platform's support
// address, not the business's.
const JUNK_EMAIL_DOMAINS = [
  "godaddy.com",
  "godaddysites.com",
  "vagaro.com",
  "setmore.com",
  "square.site",
  "wixsite.com",
  "squarespace.com",
];

// Role mailboxes that are never the right first contact for a cold sales email.
const ROLE_LOCALPARTS = ["careers", "jobs", "hr", "recruiting", "recruitment"];

// National chains / institutions that are consistently the wrong target
// regardless of vertical — HQ mailboxes, not a local decision-maker.
const CHAIN_DENYLIST = [
  "ulta",
  "gnc",
  // health systems / hospitals
  "health system",
  "baptist health",
  "uf health",
  "hospital",
  // schools / training institutes, not commercial businesses
  "institute",
  "school of",
  "academy",
  "college of",
];

function normalizeDomain(website: string): string {
  return website
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function emailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function pickEmail(item: PlaceItem): string | null {
  const candidate = item.email ?? item.emails?.[0];
  if (!candidate || !EMAIL_RE.test(candidate)) return null;
  return candidate.trim().toLowerCase();
}

function isChainOrInstitution(item: PlaceItem): boolean {
  const text = `${item.title ?? ""} ${item.categoryName ?? ""}`.toLowerCase();
  return CHAIN_DENYLIST.some((needle) => text.includes(needle));
}

// Per-item filter — drop/keep with a reason. Domain dedup happens separately
// across the whole batch (see curateBatch), since it needs cross-item state.
function filterOne(
  item: PlaceItem,
  vertical: string,
): { keep: true; prospect: ProspectInput } | { keep: false; reason: string } {
  if (item.permanentlyClosed || item.temporarilyClosed) {
    return { keep: false, reason: "closed" };
  }
  if (!item.website) {
    return { keep: false, reason: "no-website" };
  }
  const email = pickEmail(item);
  if (!email) {
    return { keep: false, reason: "no-email" };
  }
  if (JUNK_EMAIL_DOMAINS.includes(emailDomain(email))) {
    return { keep: false, reason: "junk-email-domain" };
  }
  const localpart = email.split("@")[0];
  if (ROLE_LOCALPARTS.includes(localpart)) {
    return { keep: false, reason: "careers-mailbox" };
  }
  if (isChainOrInstitution(item)) {
    return { keep: false, reason: "poor-fit-chain-or-institution" };
  }

  return {
    keep: true,
    prospect: {
      email,
      domainUrl: item.website,
      businessName: item.title,
      vertical,
      source: "apify",
    },
  };
}

// Dedupe by domain across the batch: keep the first (most-specific) email per
// domain. Franchise *locations* naturally survive this — each location has its
// own website/domain, so they're never seen as duplicates of each other.
function dedupeByDomain(prospects: ProspectInput[]): ProspectInput[] {
  const seen = new Set<string>();
  const out: ProspectInput[] = [];
  for (const p of prospects) {
    const domain = normalizeDomain(p.domainUrl);
    if (seen.has(domain)) continue;
    seen.add(domain);
    out.push(p);
  }
  return out;
}

export function curateBatch(items: PlaceItem[], vertical: string): CurateResult {
  const kept: ProspectInput[] = [];
  const dropped: { title?: string; reason: string }[] = [];

  for (const item of items) {
    const result = filterOne(item, vertical);
    if (result.keep) kept.push(result.prospect);
    else dropped.push({ title: item.title, reason: result.reason });
  }

  return { kept: dedupeByDomain(kept), dropped };
}
