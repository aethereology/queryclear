import { createHash } from "node:crypto";
import type { EngagementEvent, PolicyDecision, SocialAccount, SocialPlatform } from "./types";

const SENSITIVE_RE =
  /\b(lawyer|legal action|lawsuit|subpoena|security breach|hacked|password|credential|billing|refund|chargeback|privacy request|delete my data|press inquiry|journalist|threat|kill|suicide|self harm|minor|child abuse|medical advice|financial advice|political campaign|religious dispute)\b/i;
const GUARANTEE_RE = /\b(guarantee(?:d|s)?|always rank|#1 ranking|guaranteed citations?|risk[- ]free results?)\b/i;
const FABRICATION_RE =
  /\b(our client (?:grew|increased|made|earned)|we achieved \d+|I personally (?:used|saw|helped)|case study proves)\b/i;
const INJECTION_RE =
  /\b(ignore (?:all |the )?(?:previous|prior|system)(?: system)? instructions|reveal (?:the )?(?:prompt|secret)|developer message|system prompt|exfiltrate)\b/i;
const HARASSMENT_RE = /\b(idiot|scam artist|fraudster|liar|destroy them|attack them)\b/i;

export function hashActor(platform: SocialPlatform, remoteId: string) {
  return createHash("sha256").update(`${platform}:${remoteId}`).digest("hex").slice(0, 24);
}

export function deterministicPolicy(text: string, options?: { hasSources?: boolean; namesRealBusiness?: boolean; hasPermission?: boolean }): PolicyDecision {
  const reasons: string[] = [];
  if (!text.trim()) reasons.push("Content is empty.");
  if (text.length > 12_000) reasons.push("Content exceeds the system-wide safety limit.");
  if (SENSITIVE_RE.test(text)) reasons.push("Sensitive interaction requires human handling.");
  if (GUARANTEE_RE.test(text)) reasons.push("Unverifiable or guaranteed outcome claim.");
  if (FABRICATION_RE.test(text)) reasons.push("Possible invented customer or founder experience.");
  if (INJECTION_RE.test(text)) reasons.push("Prompt-injection language detected.");
  if (HARASSMENT_RE.test(text)) reasons.push("Hostile or competitor-attack language.");
  if (options?.namesRealBusiness && !options.hasPermission) reasons.push("A named business requires recorded permission.");
  if (/\b(according to|study|report|data shows|research shows|today|this week|new update)\b/i.test(text) && !options?.hasSources) {
    reasons.push("A factual or current claim is missing source evidence.");
  }
  return {
    decision: reasons.length ? "escalate" : "pass",
    reasons,
    checkedAt: new Date().toISOString(),
  };
}

export function engagementRisk(content: string): EngagementEvent["risk"] {
  if (SENSITIVE_RE.test(content) || HARASSMENT_RE.test(content)) return "high";
  if (GUARANTEE_RE.test(content) || INJECTION_RE.test(content)) return "medium";
  return "low";
}

export function validatePlatformPost(
  platform: SocialPlatform,
  text: string,
  options?: { mediaCount?: number; subreddit?: string; redditAllowlist?: string[] },
) {
  const reasons: string[] = [];
  const limits: Record<SocialPlatform, number> = {
    linkedin: 3_000,
    x: 280,
    instagram: 2_200,
    facebook: 63_206,
    reddit: 40_000,
  };
  if (text.length > limits[platform]) reasons.push(`${platform} text exceeds ${limits[platform]} characters.`);
  if (platform === "instagram" && !options?.mediaCount) reasons.push("Instagram publishing requires a media asset.");
  if (platform === "reddit") {
    const subreddit = options?.subreddit?.replace(/^r\//, "").toLowerCase();
    if (!subreddit || !options?.redditAllowlist?.includes(subreddit)) reasons.push("Subreddit is not allowlisted.");
  }
  return reasons;
}

export function warmDmEligible(input: {
  event: EngagementEvent;
  account: SocialAccount;
  sentToday: number;
  lastDmAt?: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (!input.account.capabilities.dm || input.account.paused) return false;
  if (!["follow", "mention", "comment", "reply"].includes(input.event.kind)) return false;
  if (input.event.risk !== "low" || input.sentToday >= 2) return false;
  if (input.lastDmAt && now.getTime() - Date.parse(input.lastDmAt) < 30 * 24 * 60 * 60 * 1000) return false;
  return true;
}

/**
 * Meta accepts a private reply only within 7 days of the comment that triggered it.
 * A stale comment must never produce a DM attempt: the call would fail, and a failed
 * DM still burns that recipient's 30-day cooldown.
 */
export const PRIVATE_REPLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function privateReplyWindowOpen(receivedAt: string, now = new Date()) {
  const received = Date.parse(receivedAt);
  if (!Number.isFinite(received)) return false;
  const age = now.getTime() - received;
  return age >= 0 && age < PRIVATE_REPLY_WINDOW_MS;
}

/**
 * The only platform-compliant warm-DM path we have: a private reply to a comment on
 * a Meta surface. X follow events need the enterprise-only Account Activity API and
 * Reddit PMs are the highest ban-risk action available, so both are `dm: false`.
 */
export function privateReplyCapable(account: SocialAccount, event: EngagementEvent, now = new Date()) {
  return (
    account.capabilities.dm &&
    !account.paused &&
    event.kind === "comment" &&
    (account.platform === "instagram" || account.platform === "facebook") &&
    privateReplyWindowOpen(event.receivedAt, now)
  );
}

export function trackedAuditUrl(platform: SocialPlatform, campaignSlug: string, postId: string, siteUrl: string) {
  const url = new URL("/free-audit", siteUrl);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "organic_social");
  url.searchParams.set("utm_campaign", campaignSlug);
  url.searchParams.set("utm_content", postId);
  return url.toString();
}

export function isWeekend(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(date);
  return weekday === "Sat" || weekday === "Sun";
}

export function budgetMode(spendUsd: number, capUsd: number): "normal" | "reduced" | "stopped" {
  if (capUsd <= 0 || spendUsd >= capUsd) return "stopped";
  if (spendUsd >= capUsd * 0.8) return "reduced";
  return "normal";
}
