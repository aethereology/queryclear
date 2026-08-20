import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Receiver } from "@upstash/qstash";
import { secretOk } from "@/lib/secret";

const SESSION_TTL_SECONDS = 12 * 60 * 60;

function adminSecret() {
  return process.env.SOCIAL_ADMIN_SECRET ?? "";
}

function hmac(value: string, secret = adminSecret()) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAdminSession(now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + SESSION_TTL_SECONDS}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifyAdminSession(value: string | undefined, now = Date.now()) {
  if (!value || !adminSecret()) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = hmac(payload);
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(parts[0]) > Math.floor(now / 1000);
}

export function csrfForSession(session: string) {
  return hmac(`csrf:${session}`);
}

export function verifyCsrf(session: string, provided: string | null) {
  if (!provided) return false;
  return secretOk(provided, csrfForSession(session));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax", not "strict": the OAuth callback arrives as a cross-site redirect from
    // the platform, and a strict cookie is withheld for the rest of that redirect
    // chain — so the /admin/social page the callback lands on would render the login
    // form even though the connect succeeded. "lax" still withholds the cookie from
    // cross-site POSTs, and every state-changing admin action is separately guarded
    // by verifyCsrf, so CSRF protection is unchanged.
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function verifySocialJobRequest(request: Request, rawBody: string) {
  const signature = request.headers.get("upstash-signature");
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (signature && currentSigningKey && nextSigningKey) {
    const receiver = new Receiver({ currentSigningKey, nextSigningKey });
    try {
      return await receiver.verify({
        signature,
        body: rawBody,
        url: request.url,
      });
    } catch {
      return false;
    }
  }

  const expected = process.env.SOCIAL_JOB_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return Boolean(expected && scheme === "Bearer" && token && secretOk(token, expected));
}

function encryptionKey() {
  const raw = process.env.SOCIAL_ENCRYPTION_KEY;
  if (!raw) throw new Error("SOCIAL_ENCRYPTION_KEY is not configured.");
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("Invalid encrypted secret.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function verifyHmacBody(body: string, provided: string | null, secretName: string) {
  const secret = process.env[secretName];
  if (!secret || !provided) return false;
  return secretOk(provided, createHmac("sha256", secret).update(body).digest("hex"));
}
