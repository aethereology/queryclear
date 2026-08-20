import type { MetricSnapshot, PreflightCheck, PublishRequest, SocialAccount, SocialAdapter, SocialIdentity } from "../types";
import { accessToken, bearer, SocialApiError, socialFetch, unsupported } from "./base";
import { callbackUrl, linkedinCredentials, probeLinkedInAuthorize, type AuthorizeProbe } from "../oauth";
import { socialStore } from "../store";

const API = "https://api.linkedin.com/rest";
const VERSION = process.env.LINKEDIN_API_VERSION ?? "202605";

/**
 * Publishing scope per identity. A member post needs the "Share on LinkedIn"
 * product; an organization post needs Community Management API approval.
 */
const PUBLISH_SCOPE: Record<SocialIdentity, string> = {
  founder: "w_member_social",
  brand: "w_organization_social",
};

/** The product an operator must add to obtain each scope. */
const SCOPE_PRODUCT: Record<string, string> = {
  w_member_social: "Share on LinkedIn",
  w_organization_social: "Community Management API (requires LinkedIn review)",
  openid: "Sign In with LinkedIn using OpenID Connect",
  profile: "Sign In with LinkedIn using OpenID Connect",
};

function headers(token: string) {
  return bearer(token, {
    "LinkedIn-Version": VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  });
}

/** True when this account's author URN was supplied by the platform, not by config. */
async function isPlatformResolved(account: SocialAccount) {
  const resolved = await socialStore().resolvedRemoteId(account.id);
  return Boolean(resolved && resolved === account.remoteId);
}

type Introspection = { active?: boolean; status?: string; scope?: string; expires_at?: number; created_at?: number };

/**
 * Introspects a token, retrying once when LinkedIn reports it inactive.
 *
 * A token introspected seconds after it is issued can come back `revoked` with no
 * scopes — LinkedIn's introspection service lags token issuance. Preflight runs
 * immediately after the OAuth callback, so without this retry a perfectly good
 * connection reports "revoked / Granted: none" at the exact moment it succeeded.
 */
async function introspect(clientId: string, clientSecret: string, token: string): Promise<Introspection> {
  const call = () =>
    socialFetch<Introspection>(
      "https://www.linkedin.com/oauth/v2/introspectToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token }),
      },
      "LinkedIn token introspection",
    );
  const first = await call();
  if (first.active && first.status === "active") return first;
  await new Promise((resolve) => setTimeout(resolve, 2_000));
  return call();
}

export const linkedinAdapter: SocialAdapter = {
  platform: "linkedin",

  /**
   * Introspects the token rather than merely confirming one exists. A token can be
   * active and still lack the publishing scope — reporting "ok" in that case sends
   * the account straight into a 403 on its first post, which pauses it. The canary
   * step is only meaningful if this check can actually fail.
   */
  async health(account) {
    if (!account.remoteId) return { ok: false, reason: "Missing LinkedIn author URN." };
    let token: string;
    try {
      token = await accessToken(account);
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Missing credentials." };
    }
    // Per-identity: brand may be served by its own LinkedIn application, and a token can
    // only be introspected by the app that issued it.
    const { clientId, clientSecret, dedicatedApp } = linkedinCredentials(account.identity);
    if (!clientId || !clientSecret) {
      const prefix = dedicatedApp ? "LINKEDIN_BRAND_" : "LINKEDIN_";
      return { ok: false, reason: `Set ${prefix}CLIENT_ID and ${prefix}CLIENT_SECRET so the token can be verified.` };
    }
    try {
      const result = await introspect(clientId, clientSecret, token);
      if (!result.active || result.status !== "active") {
        return { ok: false, reason: "LinkedIn token is not active. Reconnect the account." };
      }
      const granted = (result.scope ?? "")
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);
      const required = PUBLISH_SCOPE[account.identity];
      if (!granted.includes(required)) {
        return {
          ok: false,
          reason: `LinkedIn token is missing ${required}. Add the product that grants it to the LinkedIn app, then reconnect. Granted: ${granted.join(", ") || "none"}.`,
        };
      }
      if (result.expires_at) {
        const expiresAt = new Date(result.expires_at * 1000);
        const daysLeft = (expiresAt.getTime() - Date.now()) / 86_400_000;
        if (daysLeft < 7) {
          return { ok: false, reason: `LinkedIn token expires ${expiresAt.toISOString().slice(0, 10)}. Reconnect the account.` };
        }
        return { ok: true, reason: `Token valid until ${expiresAt.toISOString().slice(0, 10)} (${Math.floor(daysLeft)} days).` };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "LinkedIn health check failed." };
    }
  },

  /**
   * Reads the opaque member id from the token. `urn:li:person:` needs this id, NOT the
   * vanity string in a profile URL — a hand-built URN authorizes fine and then 403s on
   * the first publish.
   *
   * This is a FALLBACK. The dependable source is the id_token's `sub` claim, captured
   * during the OAuth callback (see memberIdFromIdToken) — verified empirically, LinkedIn
   * returns 403 "userinfo.GET.NO_VERSION" from /v2/userinfo even when the token carries
   * the openid scope, and /v2/me, /rest/me, /v2/people/~ and r_profile_basicinfo are all
   * 403/404 too. Kept because it costs nothing if LinkedIn ever permits it.
   */
  async resolveAuthorUrn(account: SocialAccount) {
    if (account.identity === "brand") {
      const urn = process.env.LINKEDIN_ORGANIZATION_URN;
      if (!urn) unsupported("Resolving the organization URN", account);
      return urn;
    }
    const token = await accessToken(account);
    const result = await socialFetch<{ sub?: string }>(
      "https://api.linkedin.com/v2/userinfo",
      { headers: { Authorization: `Bearer ${token}` } },
      "LinkedIn author lookup",
    );
    if (!result.sub) throw new SocialApiError("LinkedIn returned no member id.", 502, true);
    return `urn:li:person:${result.sub}`;
  },

  async preflight(account: SocialAccount) {
    const checks: PreflightCheck[] = [];
    const required = PUBLISH_SCOPE[account.identity];

    // Ask LinkedIn directly instead of asking the operator to verify by hand. Brand may
    // be served by its own LinkedIn application, so credentials are per-identity.
    const { clientId: clientIdForProbe, dedicatedApp } = linkedinCredentials(account.identity);
    let probe: AuthorizeProbe | undefined;
    if (clientIdForProbe) {
      try {
        probe = await probeLinkedInAuthorize(clientIdForProbe, required);
      } catch {
        // Network failure: fall through to the unverified warning below.
      }
    }

    checks.push({
      id: "callback",
      label: "Redirect URI registered with LinkedIn",
      status: probe ? (probe.redirectRegistered ? "pass" : "fail") : "warn",
      detail: probe
        ? probe.redirectRegistered
          ? "LinkedIn accepts this exact callback URL."
          : "LinkedIn rejects this callback URL, so connecting cannot succeed. It must match byte-for-byte — no trailing slash, and www vs apex matters."
        : "Could not reach LinkedIn to verify. Confirm this string is listed under Auth → Authorized redirect URLs.",
      action: probe?.redirectRegistered
        ? undefined
        : "Add this URL verbatim under Auth → Authorized redirect URLs. It is derived from NEXT_PUBLIC_SITE_URL, so it changes between local and production.",
      value: callbackUrl("linkedin"),
      docsUrl: "https://www.linkedin.com/developers/apps",
    });

    let token: string | undefined;
    try {
      token = await accessToken(account);
      checks.push({ id: "credentials", label: "Access token available", status: "pass" });
    } catch (error) {
      checks.push({
        id: "credentials",
        label: "Access token available",
        status: "fail",
        detail: error instanceof Error ? error.message : "No token.",
        action: "Connect the account from this page.",
      });
      return checks;
    }

    const { clientId, clientSecret } = linkedinCredentials(account.identity);
    const envPrefix = dedicatedApp ? "LINKEDIN_BRAND_" : "LINKEDIN_";
    if (!clientId || !clientSecret) {
      checks.push({
        id: "token",
        label: "Token verified with LinkedIn",
        status: "fail",
        detail: `${envPrefix}CLIENT_ID / ${envPrefix}CLIENT_SECRET are not set, so the token cannot be introspected.`,
        action: "Set both environment variables.",
      });
      return checks;
    }

    let granted: string[] = [];
    try {
      const introspection = await introspect(clientId, clientSecret, token);
      granted = (introspection.scope ?? "").split(",").map((scope) => scope.trim()).filter(Boolean);
      const active = Boolean(introspection.active) && introspection.status === "active";
      const expiresAt = introspection.expires_at ? new Date(introspection.expires_at * 1000) : undefined;
      const daysLeft = expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000) : undefined;
      const expiry = expiresAt
        ? `Expires ${expiresAt.toISOString().slice(0, 10)} (${daysLeft} days). LinkedIn member tokens last 60 days and cannot be refreshed without approval.`
        : undefined;
      checks.push({
        id: "token",
        label: "Token active",
        // An inactive token still reports an expiry date, so say WHY it failed rather
        // than printing a healthy-looking date next to a red mark.
        status: !active ? "fail" : daysLeft !== undefined && daysLeft < 7 ? "warn" : "pass",
        detail: active
          ? expiry
          : `LinkedIn reports this token as ${introspection.status ?? "inactive"}. LinkedIn permits ONE live token per app and member, so this is superseded — either by a later reconnect, or by a token generated by hand in the developer portal. ${expiry ?? ""}`.trim(),
        action: !active
          ? "Reconnect the account to obtain a live token."
          : daysLeft !== undefined && daysLeft < 7
            ? "Reconnect the account before it expires."
            : undefined,
      });
    } catch (error) {
      checks.push({
        id: "token",
        label: "Token active",
        status: "fail",
        detail: error instanceof Error ? error.message : "Introspection failed.",
        action: "Reconnect the account.",
      });
      return checks;
    }

    const hasPublishScope = granted.includes(required);
    // Distinguish "the app cannot grant this scope" (add a product / await review) from
    // "the app can, but this token predates it" (just reconnect). Conflating the two is
    // what turns setup into guesswork.
    const appCanGrant = probe?.scopeGranted;
    checks.push({
      id: "scope",
      label: `Publishing scope (${required})`,
      status: hasPublishScope ? "pass" : "fail",
      detail: hasPublishScope
        ? `Granted: ${granted.join(", ") || "none"}.`
        : appCanGrant === true
          ? `The LinkedIn app can grant ${required}, but this token does not have it. Granted: ${granted.join(", ") || "none"}.`
          : appCanGrant === false
            ? `The LinkedIn app itself cannot grant ${required} — it needs the "${SCOPE_PRODUCT[required] ?? required}" product. Granted: ${granted.join(", ") || "none"}.`
            : `Granted: ${granted.join(", ") || "none"}.`,
      action: hasPublishScope
        ? undefined
        : appCanGrant === true
          ? "Reconnect the account; the app already has the required product."
          : required === "w_organization_social"
            ? "Community Management API must be the ONLY product on a LinkedIn app, so it cannot be added to the app that serves the founder account — LinkedIn requires a separate developer application for it, plus review approval. Until then this account cannot publish."
            : `Add the "${SCOPE_PRODUCT[required] ?? required}" product under Products, then reconnect.`,
      docsUrl: "https://www.linkedin.com/developers/apps",
    });

    // The author URN is the classic silent failure: wrong id authorizes fine, then
    // 403s on first publish. Verify it against the token rather than trusting config.
    if (account.identity === "brand") {
      checks.push({
        id: "author",
        label: "Author URN",
        status: account.remoteId ? "pass" : "fail",
        detail: account.remoteId ?? "LINKEDIN_ORGANIZATION_URN is not set.",
        action: account.remoteId ? undefined : "Set LINKEDIN_ORGANIZATION_URN.",
      });
    } else if (await isPlatformResolved(account)) {
      // The URN came from the id_token's `sub` at connect time — the platform's own
      // statement of identity. Nothing further to verify, and re-checking it through
      // /v2/userinfo would fail: that endpoint 403s even with the openid scope.
      checks.push({
        id: "author",
        label: "Author URN resolved by LinkedIn",
        status: "pass",
        detail: `${account.remoteId} — taken from the id_token issued with this connection.`,
      });
    } else if (!granted.includes("openid")) {
      // Only /v2/userinfo exposes the member id, and only with openid. Verified: /v2/me,
      // /rest/me and r_profile_basicinfo all return 403. So say precisely which product
      // unlocks automatic resolution, and flag the URN as unverified rather than
      // pretending it is fine — a wrong one 403s on the first publish and pauses.
      const looksHandBuilt = !account.remoteId || /[A-Za-z]{4,}/.test(account.remoteId.split(":").pop() ?? "");
      checks.push({
        id: "author",
        label: "Author URN (unverified)",
        status: looksHandBuilt ? "fail" : "warn",
        detail: `Using ${account.remoteId ?? "(unset)"}. This cannot be checked without the openid scope, and ${
          looksHandBuilt
            ? "it contains word-like text, which suggests it came from a profile URL rather than LinkedIn's opaque member id."
            : "it has the right shape."
        }`,
        action: `Add the "${SCOPE_PRODUCT.openid}" product under Products, then reconnect — the member id is then resolved automatically and this check becomes exact. A wrong URN fails the first publish with a 403.`,
        docsUrl: "https://www.linkedin.com/developers/apps",
      });
    } else {
      try {
        const resolved = await linkedinAdapter.resolveAuthorUrn!(account);
        const matches = account.remoteId === resolved;
        checks.push({
          id: "author",
          label: "Author URN verified",
          status: matches ? "pass" : "fail",
          detail: matches ? resolved : `LinkedIn reports ${resolved}, this account is set to ${account.remoteId ?? "(unset)"}.`,
          action: matches ? undefined : "Run preflight again to store the resolved URN, or reconnect the account.",
          value: matches ? undefined : resolved,
        });
      } catch (error) {
        checks.push({
          id: "author",
          label: "Author URN verified",
          status: "fail",
          detail: error instanceof Error ? error.message : "Lookup failed.",
          action: "Reconnect the account.",
        });
      }
    }
    return checks;
  },

  async publish(request: PublishRequest) {
    const token = await accessToken(request.account);
    if (!request.account.remoteId) unsupported("Publishing", request.account);
    const body: Record<string, unknown> = {
      author: request.account.remoteId,
      commentary: request.text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    if (request.mediaUrls[0]) {
      body.content = {
        article: {
          source: request.mediaUrls[0],
          title: request.title ?? "queryclear",
          description: request.text.slice(0, 200),
        },
      };
    }
    const response = await fetch(`${API}/posts`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      throw new SocialApiError(
        `LinkedIn publish failed with ${response.status}.`,
        response.status,
        response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500,
        raw.slice(0, 2_000),
      );
    }
    const remoteId = response.headers.get("x-restli-id") ?? (raw ? JSON.parse(raw).id : undefined);
    if (!remoteId) throw new Error("LinkedIn did not return a post ID.");
    return { remoteId, permalink: `https://www.linkedin.com/feed/update/${encodeURIComponent(remoteId)}` };
  },

  async delete(account, remoteId) {
    const token = await accessToken(account);
    await socialFetch(`${API}/posts/${encodeURIComponent(remoteId)}`, { method: "DELETE", headers: headers(token) }, "LinkedIn delete");
  },

  async reply(account, targetRemoteId, text) {
    const token = await accessToken(account);
    if (!account.remoteId) unsupported("Replying", account);
    const result = await socialFetch<{ id?: string }>(
      `${API}/socialActions/${encodeURIComponent(targetRemoteId)}/comments`,
      {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ actor: account.remoteId, message: { text } }),
      },
      "LinkedIn reply",
    );
    if (!result.id) throw new Error("LinkedIn did not return a comment ID.");
    return { remoteId: result.id };
  },

  async dm(account) {
    return unsupported("Direct messaging", account);
  },

  async engagements(account, since) {
    if (!account.remoteId) return [];
    const token = await accessToken(account);
    const result = await socialFetch<{ elements?: Array<Record<string, unknown>> }>(
      `${API}/socialActions/${encodeURIComponent(account.remoteId)}/comments?start=0&count=50`,
      { headers: headers(token) },
      "LinkedIn engagements",
    );
    return (result.elements ?? [])
      .map((item) => {
        const created = String(item.createdAt ?? item.lastModifiedAt ?? "");
        return {
          platformEventId: String(item.id ?? ""),
          actorRemoteId: String((item.actor as string | undefined) ?? "unknown"),
          kind: "comment" as const,
          content: String((item.message as { text?: string } | undefined)?.text ?? ""),
          threadId: String(item.object ?? ""),
          receivedAt: created ? new Date(Number(created)).toISOString() : new Date().toISOString(),
        };
      })
      .filter((item) => item.platformEventId && item.receivedAt >= since);
  },

  async metrics(account, remoteId) {
    const token = await accessToken(account);
    const result = await socialFetch<{ totalShareStatistics?: Record<string, number> }>(
      `${API}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(account.remoteId ?? "")}&shares=List(${encodeURIComponent(remoteId)})`,
      { headers: headers(token) },
      "LinkedIn metrics",
    );
    const stats = result.totalShareStatistics ?? {};
    return {
      impressions: Number(stats.impressionCount ?? 0),
      likes: Number(stats.likeCount ?? 0),
      comments: Number(stats.commentCount ?? 0),
      shares: Number(stats.shareCount ?? 0),
      clicks: Number(stats.clickCount ?? 0),
      freeAuditLeads: 0,
      raw: result,
    } satisfies Omit<MetricSnapshot, "id" | "accountId" | "postId" | "capturedAt">;
  },
};
