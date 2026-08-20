import { decryptSecret, encryptSecret } from "../security";
import { socialStore } from "../store";
import type { SocialAccount } from "../types";
import { refreshOAuthToken } from "../oauth";

export class SocialApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
    readonly responseBody?: string,
  ) {
    super(message);
  }
}

export async function socialFetch<T>(url: string, init: RequestInit, label: string): Promise<T> {
  const response = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(25_000) });
  const raw = await response.text();
  if (!response.ok) {
    throw new SocialApiError(
      `${label} failed with ${response.status}.`,
      response.status,
      response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500,
      raw.slice(0, 2_000),
    );
  }
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

/** Whether a hand-set environment token exists for this account. */
export function envTokenPresent(account: SocialAccount) {
  return Boolean(envToken(account));
}

function envToken(account: SocialAccount) {
  switch (account.id) {
    case "linkedin-founder":
    case "linkedin-brand":
      return process.env.LINKEDIN_ACCESS_TOKEN;
    case "x-founder":
      return process.env.X_FOUNDER_ACCESS_TOKEN;
    case "x-brand":
      return process.env.X_BRAND_ACCESS_TOKEN;
    case "instagram-brand":
    case "facebook-brand":
      return process.env.META_PAGE_ACCESS_TOKEN;
    case "reddit-founder":
      return process.env.REDDIT_ACCESS_TOKEN;
    default:
      return undefined;
  }
}

/**
 * The credential for an account, with the OAuth-stored token authoritative.
 *
 * A stored token is NEVER silently replaced by the environment value. The previous
 * version wrapped the whole lookup in `try { … } catch {}` and fell through to
 * `envToken` on any failure, which meant a decryption error, an expired
 * SOCIAL_ENCRYPTION_KEY, or a failed refresh all quietly used a different, usually
 * stale credential — and every downstream diagnosis then described the wrong token.
 * Failures here are loud on purpose; the environment value is a fallback only when no
 * token has been stored at all.
 */
export async function accessToken(account: SocialAccount) {
  let encrypted: string | null = null;
  try {
    encrypted = await socialStore().encryptedToken(account.id);
  } catch (error) {
    throw new SocialApiError(
      `Could not read the stored token for ${account.label}: ${error instanceof Error ? error.message : "storage error"}.`,
      503,
      true,
    );
  }

  if (encrypted) {
    let decrypted: string;
    try {
      decrypted = decryptSecret(encrypted);
    } catch (error) {
      throw new SocialApiError(
        `The stored token for ${account.label} could not be decrypted (${
          error instanceof Error ? error.message : "unknown"
        }). SOCIAL_ENCRYPTION_KEY has most likely changed since the account was connected — reconnect it.`,
        401,
        false,
      );
    }
    let bundle: { accessToken?: string; refreshToken?: string };
    try {
      bundle = JSON.parse(decrypted) as { accessToken?: string; refreshToken?: string };
    } catch {
      return decrypted; // Legacy single-value storage.
    }
    const expiring = account.tokenExpiresAt && Date.parse(account.tokenExpiresAt) <= Date.now() + 5 * 60 * 1000;
    if (bundle.accessToken && (!expiring || !bundle.refreshToken)) return bundle.accessToken;
    if (bundle.refreshToken) {
      // Identity matters: brand may be served by its own LinkedIn application, and a
      // refresh token is only valid against the app that issued it.
      const refreshed = await refreshOAuthToken(account.platform, bundle.refreshToken, account.identity);
      const nextBundle = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? bundle.refreshToken,
      };
      const store = socialStore();
      await store.saveEncryptedToken(account.id, encryptSecret(JSON.stringify(nextBundle)));
      await store.saveAccount({
        ...account,
        tokenExpiresAt: refreshed.expiresIn
          ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
          : account.tokenExpiresAt,
      });
      return refreshed.accessToken;
    }
    throw new SocialApiError(`The stored token for ${account.label} is empty. Reconnect the account.`, 401, false);
  }

  const token = envToken(account);
  if (!token) throw new SocialApiError(`${account.label} has no access token.`, 401, false);
  return token;
}

export function bearer(token: string, extra?: HeadersInit): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...extra };
}

export function formBearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" };
}

export function unsupported(operation: string, account: SocialAccount): never {
  throw new SocialApiError(`${operation} is not available for ${account.label} with its current official API permissions.`, 403, false);
}
