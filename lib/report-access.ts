import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";
const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

function reportSecret(): string {
  const secret = process.env.REPORT_ACCESS_SECRET ?? "";
  if (secret.length < 32) {
    throw new Error("REPORT_ACCESS_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function signature(slug: string, expiresAt: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${TOKEN_VERSION}:${slug}:${expiresAt}`)
    .digest("base64url");
}

export function reportAccessCookieName(slug: string): string {
  const id = createHash("sha256").update(slug).digest("hex").slice(0, 24);
  return `qc_report_${id}`;
}

export function reportAccessTokenExpiresAt(token: string): number | null {
  const [version, rawExpiresAt, presented, extra] = token.split(".");
  if (extra || version !== TOKEN_VERSION || !/^\d{10,12}$/.test(rawExpiresAt ?? "") || !presented) {
    return null;
  }
  const expiresAt = Number(rawExpiresAt);
  return Number.isSafeInteger(expiresAt) ? expiresAt : null;
}

/** Creates a short-lived access token for a non-demo client report. */
export function createReportAccessToken(
  slug: string,
  expiresAt = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS,
): string {
  if (!/^[a-z0-9][a-z0-9-]{2,160}$/i.test(slug)) throw new Error("Invalid report slug.");
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error("Report-link expiration must be in the future.");
  }
  return `${TOKEN_VERSION}.${expiresAt}.${signature(slug, expiresAt, reportSecret())}`;
}

/** Fails closed when the token or production secret is missing/malformed. */
export function verifyReportAccessToken(
  slug: string,
  token: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!token || token.length > 240) return false;
  const [, , presented] = token.split(".");
  const expiresAt = reportAccessTokenExpiresAt(token);
  if (!expiresAt || expiresAt <= nowSeconds || !presented) return false;

  let expected: string;
  try {
    expected = signature(slug, expiresAt, reportSecret());
  } catch {
    return false;
  }
  const expectedBytes = Buffer.from(expected);
  const presentedBytes = Buffer.from(presented);
  return (
    expectedBytes.length === presentedBytes.length &&
    timingSafeEqual(expectedBytes, presentedBytes)
  );
}
