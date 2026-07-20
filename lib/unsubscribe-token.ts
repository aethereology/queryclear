// Stateless one-click-unsubscribe tokens: base64url(email) + "." + an HMAC over
// the email, keyed by OUTREACH_SECRET (already required — no new secret to
// provision). Verifiable with no Redis round-trip, which matters here: mail
// clients hit this URL automatically and expect a fast, reliable response.

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.OUTREACH_SECRET ?? "";
}

function sign(email: string): string {
  return createHmac("sha256", secret()).update(email).digest("hex").slice(0, 32);
}

export function makeUnsubscribeToken(email: string): string {
  const e = email.trim().toLowerCase();
  return `${Buffer.from(e, "utf8").toString("base64url")}.${sign(e)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  let email: string;
  try {
    email = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = Buffer.from(sign(email));
  const given = Buffer.from(sig);
  if (given.length !== expected.length) return null;
  return timingSafeEqual(given, expected) ? email : null;
}
