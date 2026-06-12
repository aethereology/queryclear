# Tasks — queryclear

Short living board. Strategy lives in `roadmap.md`; the executable cards live in
`docs/build/BUILD_QUEUE.md`. Keep "Now" to 1–3 items.

## ✅ Done
- Foundation: clean repo, strategy, docs, stack locked (2026-05-29)
- Phase 1 MVP BUILT + LAUNCHED: landing page, sample audit (/audit), accessible
  lead form → /api/lead → Resend (verified), GEO infra (llms.txt/sitemap/robots/
  JSON-LD). LIVE at https://www.queryclear.com on Vercel. (2026-05-29)
- Roadmap clarified + made Claude-Code-executable: added `CLAUDE.md`, rewrote
  `roadmap.md`, added `docs/build/BUILD_QUEUE.md` + `page-template.md` (2026-06-03)

## ✅ Decision gates — all closed 2026-06-03 (see Decisions.md)
- GATE-CANONICAL → **www** · GATE-MODEL → **audit-first ($97 kit deferred)** ·
  GATE-PRICING → ~~"starting at $750"~~ **superseded 2026-06-11 → $497 flat +
  public offer ladder** (see Decisions.md)

## ✅ Phase 1 complete (2026-06-03)
- T0 canonical→www · T1 /about · T2 /contact · T3 /privacy+/terms · T4 footer/nav
- Verify: `npm run build && npm run lint` on Windows before deploy (sandbox can't
  run next build; lead-route tests pass 9/9)

## ✅ Phase 2 complete (2026-06-03)
- T5 /ai-visibility-stack · T6 /audit promoted · T7 /ai-visibility-audit

## ✅ Phase 3 complete (2026-06-03)
- T8 local · T9 geo-audit · T10 ai-search-ready-website · T11 schema · T12 llms-txt
- 12 routes total now live in code; footer has Services/Resources/Company groups

## ✅ Verified on Windows (2026-06-04)
- `npm run build` ✅ 21 routes compile + TS passes · `npm run lint` ✅ clean ·
  `npm test` ✅ 9/9. Prior sandbox `next build` blocker cleared.
- T13: custom 404 (`app/not-found.tsx`) + OG image (`app/opengraph-image.tsx`)
  built & visually verified; 404 returns real HTTP 404.

## ✅ Shipped to production (2026-06-05)
- All 12 routes + custom 404 + OG image LIVE at www.queryclear.com (commit 1d732f2,
  `vercel --prod`). Routes verified 200; unknown route → 404.
- GSC + Bing Webmaster verified; sitemap submitted (founder).

## ✅ T14 /stack-kit LIVE (2026-06-05)
- $97 Stripe refundable pre-order for "The Local AI Visibility Stack." Built, tested
  (18/18), deployed; prod /api/checkout returns real Stripe session. STRIPE_* env in
  Vercel prod. Spec: `docs/superpowers/specs/2026-06-05-stack-kit-offer-test-design.md`.

## ✅ T15 free scorecard tool BUILT + verified in code (2026-06-05)
- `/scorecard` — client-side self-assessment, 19 Qs across the 7 layers → instant
  0–100 readiness score + per-layer bars + weakest-layer guidance. Open result, no
  email gate; optional inline lead form attaches the self-score to `/api/lead`.
- New: `lib/scorecard.ts`, `components/Scorecard.tsx`, `app/scorecard/page.tsx`,
  `tests/scorecard.test.mjs`. build ✅ 26 routes · lint ✅ · test ✅ 33/33. Drove
  the full flow in a browser. **Founder-gated:** commit/push + `vercel --prod` to ship.

## ✅ T16 paid audit report template BUILT + verified in code (2026-06-06)
- Productized the paid audit (then $750, now $497). `/audit` refactored onto a data-driven `<AuditReport>`
  template (output unchanged); new **private** `/reports/[slug]` route delivers a
  client's report as a noindexed link + Save-as-PDF. Typed model `lib/audit-report.ts`
  (incl. `scoreFromLayers` — Goldleaf layer scores → 33), data in `lib/reports/`
  (goldleaf-demo public sample + one fictional example in the registry). robots
  disallows `/reports/`; excluded from sitemap + llms.txt; print CSS in globals.css.
  SOP: `docs/playbooks/running-an-audit.md`.
- build ✅ 27 routes · lint ✅ · test ✅ 45/45 (12 new). Verified `/reports/[slug]`
  via `next start`: 200 + noindex; unknown slug → 404; `/audit` unchanged.
  **Founder-gated:** commit/push + `vercel --prod` to ship.

## ✅ Repositioning DEPLOYED (2026-06-11)
- "Modern SEO for the AI search era" reframe live in prod (commit b312cb8,
  `vercel --prod`). Smoke-checked: $497 + Snapshot on /, no stale Aethelo/$750,
  /thank-you noindex + out of sitemap, /audit prerenders 33. T15/T16 shipped
  earlier (2026-06-10) with first client report (Maple Bear).

## 🔄 Now — founder + next
- ✅ Stripe webhook REGISTERED in Dashboard (founder, 2026-06-11). Verified:
  prod env has all STRIPE_* vars; unsigned POST → 400 (sig check active).
  **Remaining check:** send a test `checkout.session.completed` from the
  Dashboard — if 400, the endpoint's signing secret is newer than the
  6-day-old `STRIPE_WEBHOOK_SECRET` in Vercel → update env + redeploy.
  Also confirm keys are test vs live before driving traffic.
- **Founder TODO:** manual ChatGPT/Gemini/Copilot visibility runs for the
  Maple Bear report → update `lib/reports/maplebear-stjohns-4caf31.ts` + redeploy.
- **Next build (decide):** Phase 6 first deep vertical (med spa) → then template.
  Open recurring: formal Lighthouse/axe ≥90 pass · DMARC → p=quarantine ~2026-06-24.

## ⏭️ Next
- Phase 6: one deep vertical (med spa) then template — only after deploy + verify
- First real paid-audit delivery: run the SOP, add `lib/reports/<slug>.ts`, ship

## 🗓️ Later
- T13 technical hardening (recurring): formal Lighthouse/axe ≥90 pass on all pages
- Re-home Aethelo work into its own repo (currently in .git.aethelo-backup)
- Real audit/report generator + AI-visibility prompt runner (prompts.md)
- T17 DIY kit contents — only if T14 ($97 pre-order) shows real demand
