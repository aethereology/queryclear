// Constant-time secret checks shared by every founder/cron-gated endpoint.
// sha256 first so timingSafeEqual never throws on a length mismatch and a
// wrong-length secret doesn't leak its length via a thrown error.

import { createHash, timingSafeEqual } from "node:crypto";

export function secretOk(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// Vercel Cron calls with `Authorization: Bearer <CRON_SECRET>`. Never throws —
// callers just respond 401 whether the secret is missing, malformed, or wrong.
export function cronAuthOk(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;
  return secretOk(token, expected);
}
