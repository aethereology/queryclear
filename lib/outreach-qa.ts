// Automated pre-send QA gate for autonomous outreach — codifies
// docs/playbooks/outreach-review.md as code. Nobody reads these emails before
// they go out anymore, so anything that fails here must be QUARANTINED
// (lib/prospect-queue.ts) rather than sent. Every check traces to a line in
// that playbook; keep the two in sync.

import { promises as dns } from "node:dns";
import { POSTAL_FALLBACK } from "./outreach";

// Honesty guardrail (CLAUDE.md §4): no guaranteed-ranking/citation language,
// ever — autonomous or not.
const BANNED_PATTERNS: RegExp[] = [
  /guarantee/i,
  /\b#1\b/,
  /top[-\s]?ranking/i,
  /will\s+rank/i,
  /instantly\s+rank/i,
  /promise\s+(you|results)/i,
  /100%\s*(results|success|guaranteed)/i,
];

// Template bugs (an unfilled field, a stray mustache) must never ship silently.
const PLACEHOLDER_PATTERNS: RegExp[] = [/\{\{/, /\bundefined\b/, /\bnull\b/];

export interface QaResult {
  pass: boolean;
  reasons: string[];
}

function honestyReasons(text: string): string[] {
  return BANNED_PATTERNS.filter((re) => re.test(text)).map((re) => `honesty: matched ${re}`);
}

function placeholderReasons(text: string): string[] {
  return PLACEHOLDER_PATTERNS.filter((re) => re.test(text)).map((re) => `placeholder: matched ${re}`);
}

// Pure, synchronous checks over the rendered copy — no I/O, so this is the
// piece unit tests exercise directly.
export function qaRenderedCopy(input: { subject: string; html: string }): QaResult {
  const reasons: string[] = [];
  if (!/unsubscribe/i.test(input.html)) reasons.push("compliance: no unsubscribe line found");
  if (input.html.includes(POSTAL_FALLBACK)) {
    reasons.push("compliance: postal address is unset (OUTREACH_POSTAL_ADDRESS)");
  }
  reasons.push(...honestyReasons(`${input.subject}\n${input.html}`));
  reasons.push(...placeholderReasons(`${input.subject}\n${input.html}`));
  return { pass: reasons.length === 0, reasons };
}

export async function mxOk(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

export interface QaSendInput {
  subject: string;
  html: string;
  toEmail: string;
  // The nurture cadence reuses touch-1's report link; if it's missing/expired
  // the caller resolves that (a report-cache lookup) and passes the result in.
  // Undefined skips the check (used for a cold send, which always mints a
  // fresh token in the same call).
  reportLinkOk?: boolean;
}

// The full gate: rendered-copy checks plus the I/O checks (MX, report link)
// that only the cron route can resolve. Any failure → quarantine, never send.
export async function qaSend(input: QaSendInput): Promise<QaResult> {
  const base = qaRenderedCopy(input);
  const reasons = [...base.reasons];

  if (!(await mxOk(input.toEmail))) {
    reasons.push(`deliverability: no MX record for ${input.toEmail.split("@")[1] ?? input.toEmail}`);
  }
  if (input.reportLinkOk === false) {
    reasons.push("content: report link missing or expired");
  }

  return { pass: reasons.length === 0, reasons };
}
