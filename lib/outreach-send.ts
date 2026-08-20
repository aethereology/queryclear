// Shared Resend sender for outreach mail. Extracted from app/api/outreach/route.ts
// so the founder-facing route AND the autonomous cron routes send through one
// path — one place for the timeout, the List-Unsubscribe headers, and (later)
// any provider change.

import { Resend } from "resend";
import { site } from "./site";

const EMAIL_TIMEOUT_MS = 8_000;

// ONE definition of the daily send ceiling, shared by the autonomous cron and the
// founder-facing route, so a hand-fired send and a cron send draw down the same
// budget. Conservative default: an unset env var must not mean "unlimited".
export const DEFAULT_DAILY_SEND_CAP = 10;

// Kill switch for the autonomous sender. Deliberately a STRING test, not a
// numeric one: every other knob here goes through a `n > 0` fallback, so
// OUTREACH_DAILY_SEND_CAP=0 does NOT pause — it silently reverts to the
// default 10/day. There was no way to stop the cron without a deploy; this is
// it. Set OUTREACH_PAUSED=true to hold all autonomous sending while keeping
// reply detection (warm-scan), the digest, and sourcing running.
//
// Scope: the cron only. The founder-facing /api/outreach route stays live so a
// deliberate one-off send is still possible while the campaign is paused.
export function sendingPaused(): boolean {
  const v = (process.env.OUTREACH_PAUSED ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function dailySendCap(): number {
  const n = Number(process.env.OUTREACH_DAILY_SEND_CAP);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_SEND_CAP;
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

export interface SendOutreachEmailOptions {
  // One-click unsubscribe (RFC 8058). Set for every autonomous send so a
  // prospect's mail client can offer a one-click opt-out without relying on
  // them reading and replying "unsubscribe".
  unsubscribeUrl?: string;
  // Resend accepts a future ISO timestamp and queues the message provider-side.
  // Used for engagement-triggered notes so they do not arrive an uncanny few
  // seconds after someone views a report.
  scheduledAt?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  opts: SendOutreachEmailOptions = {},
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const resend = new Resend(key);
  const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";
  const replyTo = process.env.LEAD_TO ?? site.email;

  const headers: Record<string, string> = {};
  if (opts.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const result = await withTimeout(
    resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
      ...(opts.scheduledAt ? { scheduledAt: opts.scheduledAt } : {}),
      ...(Object.keys(headers).length ? { headers } : {}),
    }),
    EMAIL_TIMEOUT_MS,
  );
  return !result.error;
}
