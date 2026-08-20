import { createHash, randomBytes } from "node:crypto";
import type { SocialIdentity, SocialPlatform } from "./types";

export type OAuthStart = {
  authorizationUrl: string;
  verifier?: string;
};

/**
 * The single source of the redirect URI. Platforms compare it byte-for-byte on BOTH
 * the authorize call and the token exchange, and it must be registered verbatim in the
 * platform app — so preflight surfaces this exact string rather than making the
 * operator infer it.
 */
export function callbackUrl(platform: SocialPlatform) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.queryclear.com";
  return `${origin}/api/social/oauth/${platform}`;
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

/**
 * LinkedIn client credentials for an identity.
 *
 * The two identities may need SEPARATE LinkedIn applications: Community Management API
 * (the only source of w_organization_social) must be the ONLY product on its app, so it
 * cannot sit alongside the founder account's "Share on LinkedIn" and OpenID Connect
 * products. When `LINKEDIN_BRAND_CLIENT_ID`/`_SECRET` are set, brand uses that app;
 * otherwise both identities fall back to the shared pair so a single-app setup keeps
 * working unchanged.
 *
 * Both apps register the SAME redirect URI — redirect URIs are not globally unique, and
 * the callback recovers the identity from the OAuth state rather than the URL, so no
 * second route is needed.
 */
export function linkedinCredentials(identity: SocialIdentity) {
  const dedicated = identity === "brand" && Boolean(process.env.LINKEDIN_BRAND_CLIENT_ID);
  return {
    clientId: (dedicated ? process.env.LINKEDIN_BRAND_CLIENT_ID : process.env.LINKEDIN_CLIENT_ID) ?? undefined,
    clientSecret:
      (dedicated ? process.env.LINKEDIN_BRAND_CLIENT_SECRET : process.env.LINKEDIN_CLIENT_SECRET) ?? undefined,
    /** True when this identity is served by its own LinkedIn application. */
    dedicatedApp: dedicated,
  };
}

function linkedinEnvPrefix(identity: SocialIdentity) {
  return linkedinCredentials(identity).dedicatedApp ? "LINKEDIN_BRAND_" : "LINKEDIN_";
}

/** Authorization only needs the public client id — never demand the secret this early. */
function requiredLinkedinClientId(identity: SocialIdentity) {
  const { clientId } = linkedinCredentials(identity);
  if (!clientId) throw new Error(`${linkedinEnvPrefix(identity)}CLIENT_ID is not configured.`);
  return clientId;
}

/** The token exchange and refresh are confidential-client calls and need both. */
function requiredLinkedinCredentials(identity: SocialIdentity) {
  const { clientId, clientSecret } = linkedinCredentials(identity);
  const prefix = linkedinEnvPrefix(identity);
  if (!clientId) throw new Error(`${prefix}CLIENT_ID is not configured.`);
  if (!clientSecret) throw new Error(`${prefix}CLIENT_SECRET is not configured.`);
  return { clientId, clientSecret };
}

export type AuthorizeProbe = { redirectRegistered: boolean; scopeGranted: boolean };

/**
 * Asks LinkedIn's authorize endpoint whether the app accepts a redirect URI and a scope,
 * with no user interaction — it answers with an error page before consent.
 *
 * Both "redirect_uri does not match the registered value" and "unauthorized_scope_error"
 * are otherwise discoverable only by clicking Connect and reading LinkedIn's error page.
 */
export async function probeLinkedInAuthorize(clientId: string, scope: string): Promise<AuthorizeProbe> {
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl("linkedin"));
  url.searchParams.set("state", "preflight");
  url.searchParams.set("scope", scope);
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
  const raw = await response.text();
  // LinkedIn reports a redirect_uri mismatch in preference to a scope problem, so a
  // redirect failure leaves the scope genuinely undetermined.
  const redirectRegistered = !/does not match the registered value/i.test(raw);
  // Treat ANY error code as "not grantable" rather than enumerating them. LinkedIn has
  // at least two — unauthorized_scope_error and openid_insufficient_scope_error — and
  // matching one by name silently passed the other through, which then failed the real
  // authorize call. Absence of `error=` is the only reliable success signal.
  const rejected = /[?&]error=[a-z_]+/i.test(raw) || /_scope_error/i.test(raw);
  return { redirectRegistered, scopeGranted: redirectRegistered && !rejected };
}

/**
 * Candidate founder scope SETS, best first. The last entry always works.
 *
 * Scopes are probed as sets, not individually, because some only validate together:
 * `openid` on its own returns openid_insufficient_scope_error — OpenID Connect requires
 * `profile` alongside it. Probing one scope at a time reported openid as grantable and
 * then failed the real authorize call.
 *
 * The first set is preferred because `openid` is what makes the author URN resolvable
 * from /v2/userinfo, so adding the OpenID product upgrades the connection with no code
 * change.
 */
const LINKEDIN_FOUNDER_SCOPE_SETS = [
  // openid+profile is the ONLY way to obtain the opaque member id (via /v2/userinfo or
  // the id_token's `sub`). Verified empirically: with r_profile_basicinfo instead, every
  // candidate endpoint — /v2/me, /rest/me, /v2/userinfo, /v2/people/~,
  // /v2/clientAwareMemberHandles, /rest/{profile,memberProfiles,memberBasicProfiles} —
  // returns 403 or 404. r_profile_basicinfo is therefore NOT requested: it grants a
  // permission we cannot use.
  "w_member_social openid profile",
  "w_member_social",
] as const;

async function linkedinScopes(identity: SocialIdentity): Promise<string> {
  if (identity === "brand") return "w_organization_social";
  const { clientId } = linkedinCredentials(identity);
  const fallback = LINKEDIN_FOUNDER_SCOPE_SETS[LINKEDIN_FOUNDER_SCOPE_SETS.length - 1];
  if (!clientId) return fallback;
  for (const candidate of LINKEDIN_FOUNDER_SCOPE_SETS) {
    // Sequential on purpose: stop at the first set LinkedIn accepts instead of probing
    // sets we will not use.
    try {
      if ((await probeLinkedInAuthorize(clientId, candidate)).scopeGranted) return candidate;
    } catch {
      return fallback; // Never let a probe outage block connecting.
    }
  }
  return fallback;
}

export async function oauthStart(
  platform: SocialPlatform,
  identity: SocialIdentity,
  state: string,
): Promise<OAuthStart> {
  if (platform === "linkedin") {
    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", requiredLinkedinClientId(identity));
    url.searchParams.set("redirect_uri", callbackUrl(platform));
    url.searchParams.set("state", state);
    // The publishing scope is mandatory; everything else is added only if the app can
    // grant it (see linkedinScopes). This is why adding a LinkedIn product needs no code
    // change — the next connect picks it up.
    url.searchParams.set("scope", await linkedinScopes(identity));
    return { authorizationUrl: url.toString() };
  }
  if (platform === "x") {
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const url = new URL("https://x.com/i/oauth2/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", required("X_CLIENT_ID"));
    url.searchParams.set("redirect_uri", callbackUrl(platform));
    url.searchParams.set("scope", "tweet.read tweet.write users.read offline.access dm.read dm.write");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return { authorizationUrl: url.toString(), verifier };
  }
  if (platform === "facebook" || platform === "instagram") {
    const url = new URL("https://www.facebook.com/v23.0/dialog/oauth");
    url.searchParams.set("client_id", required("META_APP_ID"));
    url.searchParams.set("redirect_uri", callbackUrl(platform));
    url.searchParams.set("state", state);
    url.searchParams.set(
      "scope",
      "pages_manage_posts,pages_read_engagement,pages_messaging,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_messages",
    );
    return { authorizationUrl: url.toString() };
  }
  if (platform === "reddit") {
    const url = new URL("https://www.reddit.com/api/v1/authorize");
    url.searchParams.set("client_id", required("REDDIT_CLIENT_ID"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("redirect_uri", callbackUrl(platform));
    url.searchParams.set("duration", "permanent");
    url.searchParams.set("scope", "identity submit read history privatemessages");
    return { authorizationUrl: url.toString() };
  }
  throw new Error(`OAuth is not available for ${identity} ${platform}.`);
}

/**
 * Extracts the OIDC subject (the platform's opaque member id) from an id_token.
 *
 * This is the reliable way to learn the publishing identity: the id_token arrives in the
 * token-exchange response itself, so it needs no extra API call and no extra permission.
 * LinkedIn's /v2/userinfo returns 403 "userinfo.GET.NO_VERSION" even when the token
 * carries the openid scope, which makes it unusable here.
 *
 * The signature is deliberately not verified: this JWT was received directly from the
 * provider's token endpoint over TLS in a server-to-server call authenticated with our
 * client secret. There is no untrusted party in that path. Never treat an id_token from
 * a browser or redirect as trusted without verifying it.
 */
export function memberIdFromIdToken(idToken: string): string | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown };
    return typeof claims.sub === "string" && claims.sub ? claims.sub : null;
  } catch {
    return null;
  }
}

export async function exchangeOAuthCode(
  platform: SocialPlatform,
  code: string,
  verifier?: string,
  // The exchange must use the SAME application that issued the authorization code, so
  // the identity has to be carried through from the OAuth state.
  identity: SocialIdentity = "founder",
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number; idToken?: string }> {
  let url: string;
  let body: URLSearchParams;
  let headers: HeadersInit = { "Content-Type": "application/x-www-form-urlencoded" };

  if (platform === "linkedin") {
    const { clientId, clientSecret } = requiredLinkedinCredentials(identity);
    url = "https://www.linkedin.com/oauth/v2/accessToken";
    body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl(platform),
    });
  } else if (platform === "x") {
    url = "https://api.x.com/2/oauth2/token";
    body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: required("X_CLIENT_ID"),
      redirect_uri: callbackUrl(platform),
      code_verifier: verifier ?? "",
    });
    const secret = process.env.X_CLIENT_SECRET;
    if (secret) headers = { ...headers, Authorization: `Basic ${Buffer.from(`${required("X_CLIENT_ID")}:${secret}`).toString("base64")}` };
  } else if (platform === "facebook" || platform === "instagram") {
    url = "https://graph.facebook.com/v23.0/oauth/access_token";
    body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: required("META_APP_ID"),
      client_secret: required("META_APP_SECRET"),
      redirect_uri: callbackUrl(platform),
    });
  } else if (platform === "reddit") {
    url = "https://www.reddit.com/api/v1/access_token";
    body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(platform),
    });
    headers = {
      ...headers,
      Authorization: `Basic ${Buffer.from(`${required("REDDIT_CLIENT_ID")}:${required("REDDIT_CLIENT_SECRET")}`).toString("base64")}`,
      "User-Agent": process.env.REDDIT_USER_AGENT ?? "web:queryclear-social:v1.0",
    };
  } else {
    throw new Error("Unsupported OAuth platform.");
  }

  const response = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(25_000) });
  const result = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) throw new Error(result.error_description ?? `${platform} token exchange failed.`);
  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresIn: result.expires_in,
    // Present whenever the openid scope was granted; carries the member id.
    idToken: result.id_token,
  };
}

export async function refreshOAuthToken(
  platform: SocialPlatform,
  refreshToken: string,
  // A refresh token is bound to the application that issued it.
  identity: SocialIdentity = "founder",
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  let url: string;
  let body: URLSearchParams;
  let headers: HeadersInit = { "Content-Type": "application/x-www-form-urlencoded" };
  if (platform === "linkedin") {
    const { clientId, clientSecret } = requiredLinkedinCredentials(identity);
    url = "https://www.linkedin.com/oauth/v2/accessToken";
    body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
  } else if (platform === "x") {
    url = "https://api.x.com/2/oauth2/token";
    body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: required("X_CLIENT_ID"),
    });
    const secret = process.env.X_CLIENT_SECRET;
    if (secret) headers = { ...headers, Authorization: `Basic ${Buffer.from(`${required("X_CLIENT_ID")}:${secret}`).toString("base64")}` };
  } else if (platform === "reddit") {
    url = "https://www.reddit.com/api/v1/access_token";
    body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
    headers = {
      ...headers,
      Authorization: `Basic ${Buffer.from(`${required("REDDIT_CLIENT_ID")}:${required("REDDIT_CLIENT_SECRET")}`).toString("base64")}`,
      "User-Agent": process.env.REDDIT_USER_AGENT ?? "web:queryclear-social:v1.0",
    };
  } else {
    throw new Error(`${platform} does not expose a refresh-token flow in this adapter.`);
  }
  const response = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(25_000) });
  const result = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) throw new Error(result.error_description ?? `${platform} token refresh failed.`);
  return { accessToken: result.access_token, refreshToken: result.refresh_token, expiresIn: result.expires_in };
}
