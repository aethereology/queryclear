# Deploy runbook — Free AI Search Audit (`/free-audit`)

The free audit ships as **two Vercel projects** (both Hobby):

1. **queryclear** (this repo) — the marketing site + `/free-audit` page, the public
   API routes, guardrails (Upstash Redis), and lead email (Resend).
2. **agent-runtime** (NEW project, root = `services/agent-runtime/` in the
   queryclearagent repo) — the stateless Python audit at `POST /api/audit`.

The browser only talks to queryclear; queryclear calls agent-runtime server-to-server.

> ⚠️ **Do not push queryclear to production until the env below is set** — without
> `AGENT_RUNTIME_URL` + the Upstash env, `/free-audit` can't reach the backend and
> the cost cap won't hold.

## Step A — deploy the Python audit project first

1. New Vercel project → import the queryclearagent repo → **Root Directory =
   `services/agent-runtime`**, Framework preset = **Other**.
2. Set env on this project:
   - `OPENAI_API_KEY` = your key (switches the runtime from demo to real OpenAI)
   - `QUERYCLEAR_DEV_ORG_ID` = `org_public_queryclear`  ← **must match** the web's `PUBLIC_AUDIT_ORG_ID`
   - `QUERYCLEAR_TOKEN_BUDGET` = `5000000`
   - (do NOT set `DATABASE_URL` or `WORDPRESS_*` — keeps it stateless)
3. Deploy. Note the URL, e.g. `https://agent-runtime-xxx.vercel.app`.
4. Smoke test (samples=1 ≈ 8-12s, under the 60s Hobby cap):
   ```
   curl -X POST https://<agent-runtime>.vercel.app/api/audit \
     -H 'content-type: application/json' \
     -d '{"org_id":"org_public_queryclear","domain_url":"https://example.com","samples":1}'
   ```
   Expect JSON with `findings`, `queries`, `recommendations`, `detected_voice`.
   (Wrong `org_id` → 500 `BudgetExceeded` — that's the R1 failure mode to watch.)

## Step B — wire + deploy the marketing site (this project)

Set env on the **queryclear** Vercel project:
- `AGENT_RUNTIME_URL` = the URL from Step A3
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
  run returns the "high demand" email-capture state.

No DNS change needed — `/free-audit` is a new route on the existing queryclear.com.

## Local dev note

`/api/audit` is the Vercel function path. For a full local run of the cross-service
call, run the Python side with `vercel dev` in `services/agent-runtime` (serves
`/api/audit`). The plain `uvicorn ...serve:build_app` server exposes `/audit` (no
`/api` prefix) — fine for direct testing, but the web client calls `/api/audit`.

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
