// Shared Resend sender for outreach mail. Extracted from app/api/outreach/route.ts
// so the founder-facing route AND the autonomous cron routes send through one
// path — one place for the timeout, the List-Unsubscribe headers, and (later)
// any provider change.

import { Resend } from "resend";
import { site } from "./site";

const EMAIL_TIMEOUT_MS = 8_000;

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

  await withTimeout(
    resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
      ...(Object.keys(headers).length ? { headers } : {}),
    }),
    EMAIL_TIMEOUT_MS,
  );
  return true;
}
