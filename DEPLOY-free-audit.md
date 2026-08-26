# Deploy runbook — Free AI Search-Readiness Preview (`/free-audit`)

The free audit ships as **two Vercel projects** (both Hobby):

1. **queryclear** (this repo) — the marketing site + `/free-audit` page, the public
   API routes, guardrails (Upstash Redis), and lead email (Resend).
2. **agent-runtime** (NEW project, root = `services/agent-runtime/` in the
   queryclearagent repo) — the stateless Python audit at `POST /api/audit`.

The browser only talks to queryclear; queryclear calls agent-runtime server-to-server.

> ⚠️ **Do not push either project to production until the env below is set on both.**
> The web client and runtime now fail closed without the same
> `AGENT_RUNTIME_SHARED_SECRET`; the preview also requires shared Redis so its
> distributed rate limit, spend cap, and report TTL hold across instances.

## Step A — configure and verify the Python audit preview

1. New Vercel project → import the queryclearagent repo → **Root Directory =
   `services/agent-runtime`**, Framework preset = **Other**.
2. Set env on this project:
   - `OPENAI_API_KEY` = your key (switches the runtime from demo to real OpenAI)
   - `QUERYCLEAR_DEV_ORG_ID` = `org_public_queryclear`  ← **must match** the web's `PUBLIC_AUDIT_ORG_ID`
   - `QUERYCLEAR_PUBLIC_DOMAIN_ID` = `domain_public_queryclear`
   - `QUERYCLEAR_TOKEN_BUDGET` = `5000000`
   - `AGENT_RUNTIME_SHARED_SECRET` = a new random value of at least 32 bytes
   - (do NOT set `DATABASE_URL` or `WORDPRESS_*` — keeps it stateless)
3. Deploy. Note the URL, e.g. `https://agent-runtime-xxx.vercel.app`.
4. Smoke test (samples=1 ≈ 8-12s, under the 60s Hobby cap):
   ```
   curl -X POST https://<agent-runtime>.vercel.app/api/audit \
     -H 'content-type: application/json' \
     -H 'x-queryclear-runtime-key: <same shared secret>' \
     -d '{"domain_url":"https://example.com"}'
   ```
   Expect JSON with `findings`, `queries`, `recommendations`, `detected_voice`,
   and `methodology`. A missing/wrong shared secret must return `401`; a request
   body cannot override the runtime tenant or increase `samples` above one.

## Step B — wire + deploy the marketing site (this project)

Set env on the **queryclear** Vercel project:
- `AGENT_RUNTIME_URL` = the URL from Step A3
- `AGENT_RUNTIME_SHARED_SECRET` = the exact value set on the runtime
- `AGENT_RUNTIME_TIMEOUT_MS` = `45000`
- `PUBLIC_AUDIT_ORG_ID` = `org_public_queryclear`  ← **must equal** Python's `QUERYCLEAR_DEV_ORG_ID`
- `PUBLIC_AUDIT_DOMAIN_ID` = `domain_public_queryclear`
- `PUBLIC_AUDIT_DAILY_CAP_USD` = `5`
- `PUBLIC_AUDIT_COST_USD` = `0.01`
- `PUBLIC_AUDIT_IP_LIMIT` = `5`
- `PUBLIC_AUDIT_IP_WINDOW_MS` = `3600000`
- `PUBLIC_AUDIT_REPORT_TTL_MS` = `86400000`
- Already present: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash — the guardrails use these),
  `RESEND_API_KEY`, `LEAD_TO`, `LEAD_FROM` (lead emails).

Then deploy (preview first), and verify on the preview URL (multi-instance, so Redis
is exercised for real):
- Run an audit on a real site → summary → email → full report.
- Confirm a lead email arrives at `LEAD_TO`.
- Rate-limit: temporarily lower `PUBLIC_AUDIT_IP_LIMIT` to 2 → 3rd run → 429.
- Cap → capacity-gate: temporarily set `PUBLIC_AUDIT_DAILY_CAP_USD` to `0.005` → first
  run returns the automated-limit email-capture state.
- Private-network target → `http://169.254.169.254/` must return `400` without a
  runtime/model call. Also test localhost, RFC1918, credentialed URLs, unusual ports,
  and a redirect to a private address.
- Methodology → modeled rows say `brand absent/present in sample`; they must never say
  `not cited`, `invisible`, or imply ChatGPT/Claude/Google was queried.
- Retention → even if `PUBLIC_AUDIT_REPORT_TTL_MS` is configured above 24 hours, the
  application caps the transient report at 24 hours.

For a no-downtime production cutover, set the shared secret on both projects first,
deploy the marketing project (the old runtime ignores the extra header), then deploy
the runtime that begins enforcing it. Never expose the runtime URL as an unauthenticated
public audit API.

After cutover, remove only stale `pa:report:*` and `pa:viewed:*` keys from the public
audit Redis namespace (or wait for their maximum 24-hour TTL). Do not flush the database
or remove spend/rate-limit/operations keys. This prevents a pre-change cached report from
retaining older result wording.

No DNS change needed — `/free-audit` is a new route on the existing queryclear.com.

## Local dev note

`/api/audit` is the Vercel function path. For a full local run of the cross-service
call, run the Python side with `vercel dev` in `services/agent-runtime` (serves
`/api/audit`) and set the same `AGENT_RUNTIME_SHARED_SECRET` in both local projects.
The plain `uvicorn ...serve:build_app` server exposes `/audit` (no `/api` prefix) —
fine for internal operator testing, but the public web client calls `/api/audit`.

## Done — shipped 2026-06-17 (commits f4e7e36 + c300757)

The manual "AI Search Snapshot" is retired; the free offer is now this instant
`/free-audit` tool. What shipped:
- Free CTAs sitewide are now plain links to `/free-audit` (Header, Footer, homepage
  hero, all service/guide pages). `site.primaryCta` points to `/free-audit`;
  `site.offers[0]` is "Free AI Search Audit". The `SnapshotCta` overlay (component
  name unchanged) now serves only the homepage Website Upgrade/Build inquiry.
- The lead form + its confirmation/notification emails were reframed to a "website
  inquiry" (no longer a Snapshot request); the dishonest "we'll email you in a couple
  business days" framing was dropped (the free audit is instant).
- On unlock, the prospect is emailed their audit (headline summary + prioritized fix
  list + the three clickable paid-offer CTAs) via `renderPublicAuditReportEmail`; the
  team is still notified. The unlocked report ends with the three paid-offer CTAs.
- `tests/snapshot-overlay.test.mjs` was rewritten to the new contract and
  `tests/public-audit-email.test.mjs` was added; suite is now 56/56.
