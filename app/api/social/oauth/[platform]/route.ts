import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { SOCIAL_PLATFORMS, type SocialIdentity, type SocialPlatform } from "@/lib/social/types";
import { exchangeOAuthCode, memberIdFromIdToken, oauthStart } from "@/lib/social/oauth";
import { preflightAndRepair } from "@/lib/social/preflight";
import { encryptSecret, verifyAdminSession } from "@/lib/social/security";
import { socialStore } from "@/lib/social/store";

export const dynamic = "force-dynamic";

function isPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

function accountId(platform: SocialPlatform, identity: SocialIdentity) {
  if (platform === "instagram" || platform === "facebook") return `${platform}-brand`;
  if (platform === "reddit") return "reddit-founder";
  return `${platform}-${identity}`;
}

export async function GET(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform: rawPlatform } = await context.params;
  if (!isPlatform(rawPlatform)) return NextResponse.json({ error: "Unsupported platform." }, { status: 404 });
  const platform = rawPlatform;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const identity: SocialIdentity = url.searchParams.get("identity") === "brand" ? "brand" : "founder";
  const store = socialStore();

  // A denied or misconfigured authorization comes back as ?error=... with NO code.
  // Without this branch that callback looks identical to a fresh start request, so
  // the platform's actual reason (e.g. unauthorized_scope_error) was replaced by a
  // 401 or a redirect straight back to the platform.
  const oauthError = url.searchParams.get("error");
  if (oauthError && !code) {
    const description = url.searchParams.get("error_description") ?? oauthError;
    if (state) await store.consumeOAuthState(state);
    // Persist the reason onto the account so the dashboard row keeps explaining itself.
    // A one-off banner disappears on the next navigation, which is why the same failed
    // connect gets retried.
    const failedId = accountId(platform, identity);
    const failedAccount = await store.getAccount(failedId);
    if (failedAccount) await store.saveAccount({ ...failedAccount, lastError: `${oauthError}: ${description}` });
    await store.audit("oauth.failed", failedId, { platform, error: oauthError, description }, "platform");
    return NextResponse.redirect(
      new URL(`/admin/social?oauth_error=${encodeURIComponent(`${oauthError}: ${description}`)}`, request.url),
    );
  }

  try {
    if (!code) {
      const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)social_admin=([^;]+)/)?.[1];
      if (!verifyAdminSession(cookie ? decodeURIComponent(cookie) : undefined)) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      const nonce = randomBytes(24).toString("base64url");
      const start = await oauthStart(platform, identity, nonce);
      await store.putOAuthState(nonce, { platform, identity, verifier: start.verifier });
      return NextResponse.redirect(start.authorizationUrl);
    }
    if (!state) return NextResponse.json({ error: "OAuth state is missing." }, { status: 400 });
    const saved = await store.consumeOAuthState(state);
    if (!saved || saved.platform !== platform) return NextResponse.json({ error: "OAuth state is invalid or expired." }, { status: 400 });
    const savedIdentity: SocialIdentity = saved.identity === "brand" ? "brand" : "founder";
    // savedIdentity picks the right LinkedIn application: brand may have its own.
    const token = await exchangeOAuthCode(
      platform,
      code,
      typeof saved.verifier === "string" ? saved.verifier : undefined,
      savedIdentity,
    );
    const id = accountId(platform, savedIdentity);
    await store.saveEncryptedToken(
      id,
      encryptSecret(JSON.stringify({ accessToken: token.accessToken, refreshToken: token.refreshToken })),
    );
    // The id_token (present whenever openid was granted) carries the platform's opaque
    // member id in its `sub` claim. Recording it here is what stops the publishing
    // identity from being a value a human has to paste correctly — LinkedIn's
    // /v2/userinfo endpoint 403s even with the openid scope, so this is the only
    // dependable source.
    if (token.idToken && platform === "linkedin" && savedIdentity === "founder") {
      const memberId = memberIdFromIdToken(token.idToken);
      if (memberId) {
        await store.setResolvedRemoteId(id, `urn:li:person:${memberId}`);
        await store.audit("account.author-urn.resolved", id, { source: "id_token" }, "platform");
      }
    }

    // A stored token can flip a config-blocked account to ready, and the resolved
    // remote id must be picked up, so resync before preflight.
    await store.syncConfiguredAccounts();
    const account = await store.getAccount(id);
    if (account) {
      await store.saveAccount({
        ...account,
        status: account.paused ? "paused" : "ready",
        tokenExpiresAt: token.expiresIn ? new Date(Date.now() + token.expiresIn * 1000).toISOString() : undefined,
        lastError: undefined,
      });
    }
    await store.audit("oauth.connected", id, { platform, identity: savedIdentity }, "admin");

    // Resolve the publishing identity from the platform and verify readiness NOW, so a
    // wrong author URN or a missing scope surfaces here instead of as a 403 on the
    // first scheduled post (which would pause the account).
    const connected = await store.getAccount(id);
    let ready = false;
    if (connected) {
      try {
        ready = (await preflightAndRepair(connected)).canPublish;
      } catch {
        // Preflight is diagnostic; never fail the connect because of it.
      }
    }
    return NextResponse.redirect(new URL(`/admin/social?connected=${ready ? "1" : "check"}`, request.url));
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/admin/social?oauth_error=${encodeURIComponent(error instanceof Error ? error.message : "OAuth failed.")}`, request.url),
    );
  }
}
