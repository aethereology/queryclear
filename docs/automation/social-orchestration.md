# Autonomous social orchestration

This subsystem is intentionally isolated from email outreach. Its routes live
under `/api/social`, its dashboard is `/admin/social`, and every Redis key is
prefixed `social:`.

## Activation

1. Create the environment variables below in Vercel. Keep the global pause on.
2. Connect each account from `/admin/social`, or provide its access token as an
   environment variable.
3. Run `npm run social:schedules` once to create/update the QStash schedules.
4. Use **Check APIs** in the dashboard.
5. Publish one safe canary through each platform's official API. Only resume an
   account after its returned permalink and metrics are verified.

The system never substitutes browser automation for a missing scope. An
account remains `blocked` or `limited` until its platform app has the required
official permissions.

**Before the first activation, verify `SOCIAL_DRAFT_MODEL` and
`SOCIAL_REVIEW_MODEL` resolve.** The defaults below are unverified; if either ID
404s, every research/adapt/review call fails and nothing publishes. One live
`responses.create` per model settles it, and both are env-overridable, so a
correction is a Vercel env change rather than a code change.

## Safety mechanics

Read these before changing cadence, budget, or capability config.

- **Cadence caps are atomic.** `SocialStore.reserveActionSlot` increments a
  per-account, per-kind counter *before* the platform call — publish buckets by ISO
  week, replies and DMs by day — and `releaseActionSlot` hands the slot back on every
  path that does not complete an external write. Same reserve-then-rollback shape as
  `reserveSend` in `lib/outreach-store.ts`. Never re-derive a cap by counting rows
  from `listActions`: two actions for one account inside a single batch would both
  see room.
- **All model spend reserves at one choke point.** Every call in
  `lib/social/openai.ts` goes through the private `spend()` helper and raises
  `SocialBudgetError` when the monthly cap is reached. A new model call added
  without `await spend(...)` bypasses the cap — the engagement path once did exactly
  that, which left a `$90` cap governing about `$0.35/day`. The cap covers **model
  spend only**; platform API subscriptions are invisible to it.
- **Warm DMs are Meta private replies, nothing else.** The only compliant
  unsolicited-DM path is `POST /{comment-id}/private_replies`: one per comment,
  within 7 days, addressed to the **comment** (so no IGSID lookup is needed).
  `me/messages` is valid solely inside the 24-hour window a *user-initiated*
  message opens, which a comment or follow does not open. X and Reddit are
  `dm: false` — X follow events need the enterprise-only Account Activity API, and
  automated Reddit PMs are the highest ban-risk action available. Per-recipient
  30-day cooldown is claimed atomically via `claimDmRecipient` and is deliberately
  never released, so a failed DM still burns the cooldown.
- **A refused read degrades one capability, it does not pause the account.** A
  401/403 from `engagements` or `metrics` disables that capability via
  `disableCapability`, which persists in `social:account:<id>:disabled-caps` because
  `syncConfiguredAccounts` rebuilds `capabilities` from config on every run and would
  otherwise resurrect it. Status stays `ready` — anything else makes `runPublish`
  quarantine the account's posts. Only a **publish** 400/403 pauses the whole
  account. Use **Check APIs** / reconnect to clear the flag.
- **X runs publish-only, at $0.** Publishing fits the free tier at 5 posts/week per
  account; mention reads do not, so the first 403 turns `readEngagements` off and
  posting continues. X mentions must be answered by hand.
- **Reddit is blocked without an allowlist.** An empty `REDDIT_ALLOWLIST` marks the
  account `blocked` at config time rather than failing every post at publish time.

## Required core environment

> **Never paste real values into this file.** It lives under `docs/`, which is NOT
> gitignored, so a value here is one `git add -A` away from being committed and
> pushed. Put real values in `.env.local` (gitignored) for local work and in
> `vercel env add <NAME> production` for deploys. Names only below.

```text
OPENAI_API_KEY=
SOCIAL_DRAFT_MODEL=gpt-5.6-luna
SOCIAL_REVIEW_MODEL=gpt-5.6-terra
SOCIAL_TTS_MODEL=gpt-4o-mini-tts
SOCIAL_ADMIN_SECRET=
SOCIAL_JOB_SECRET=
SOCIAL_ENCRYPTION_KEY=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_SITE_URL=https://www.queryclear.com
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## Platform environment

```text
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_FOUNDER_URN=urn:li:person:<member-id>
LINKEDIN_ORGANIZATION_URN=urn:li:organization:<numeric-id>
LINKEDIN_API_VERSION=202605

# Optional: a SECOND LinkedIn application, for the brand account only.
LINKEDIN_BRAND_CLIENT_ID=
LINKEDIN_BRAND_CLIENT_SECRET=

X_CLIENT_ID=
X_CLIENT_SECRET=
X_FOUNDER_ACCESS_TOKEN=
X_FOUNDER_USER_ID=
X_BRAND_ACCESS_TOKEN=
X_BRAND_USER_ID=
X_WEBHOOK_SECRET=

META_APP_ID=
META_APP_SECRET=
META_PAGE_ACCESS_TOKEN=
META_PAGE_ID=
INSTAGRAM_ACCOUNT_ID=
META_WEBHOOK_VERIFY_TOKEN=
META_GRAPH_VERSION=v23.0

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_ACCESS_TOKEN=
REDDIT_USERNAME=
REDDIT_USER_AGENT=web:queryclear-social:v1.0 (by /u/truenorth549)
REDDIT_ALLOWLIST=
```

### LinkedIn needs two applications

`w_organization_social` comes only from **Community Management API**, and LinkedIn
requires that product to be the **only** product on its application. It therefore
cannot share the founder account's app, which carries "Share on LinkedIn" and "Sign In
with LinkedIn using OpenID Connect".

| app | products | serves |
|---|---|---|
| founder app | Share on LinkedIn + Sign In with OpenID Connect | `linkedin-founder` |
| brand app | Community Management API **only** | `linkedin-brand` |

- Set `LINKEDIN_BRAND_CLIENT_ID` / `_SECRET` to the second app. When unset, both
  identities fall back to the shared pair, so a single-app setup keeps working.
- **Register the same redirect URI on both apps.** Redirect URIs are not globally
  unique, and the callback recovers the identity from the OAuth state rather than the
  URL — there is no second route.
- Community Management API is an **approval**, not a setting. Expect a review, and
  plan for it never arriving; `linkedin-brand` stays `blocked` and out of campaign
  scheduling until it does, which costs nothing.
- Do not add any other product to the brand app — that voids the exclusivity rule and
  the request will be refused.

Two other verified LinkedIn constraints worth knowing before changing this code:

- **Only `openid` yields the member id**, and only via the **id_token** returned by the
  token exchange. `/v2/userinfo` returns 403 `userinfo.GET.NO_VERSION` even when the
  token carries `openid`; `/v2/me`, `/rest/me`, `/v2/people/~`,
  `/v2/clientAwareMemberHandles` and `r_profile_basicinfo` are all 403/404.
- **One live token per app and member.** Generating a token in the developer portal
  revokes the OAuth-stored one, and vice versa. Never set
  `LINKEDIN_ACCESS_TOKEN` for an account that has been connected from `/admin/social`.

## Video rendering

Add `BLOB_READ_WRITE_TOKEN` and `SOCIAL_RENDER_CALLBACK_SECRET` as GitHub
Actions secrets. Then configure:

```text
SOCIAL_RENDER_GITHUB_REPO=owner/repository
SOCIAL_RENDER_GITHUB_TOKEN=
SOCIAL_RENDER_CALLBACK_SECRET=
```

The GitHub token only needs permission to dispatch workflows in this
repository. Tuesday and Thursday campaigns can generate a non-cloned AI voice,
captions, and a 9:16 video. Optional media automatically stops at 80% of the
monthly budget.

## Webhooks

- Meta verification: `/api/social/webhooks/facebook` or
  `/api/social/webhooks/instagram`
- X Account Activity: `/api/social/webhooks/x`
- Render callback: `/api/social/render/callback`

LinkedIn and Reddit use bounded polling when webhook access is not available.
