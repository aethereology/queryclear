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
  GATE-PRICING → **"starting at $750"**

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

## 🔄 Now — founder + next
- **Founder TODO #1:** deploy T15 — `vercel --prod` (and `git push`) to put `/scorecard` live.
- **Founder TODO #2:** register webhook endpoint in Stripe Dashboard →
  `https://www.queryclear.com/api/stripe/webhook` (event `checkout.session.completed`)
  so order-notification emails fire. Confirm keys are test vs live before driving traffic.
- **Decide next build:** Phase 6 first deep vertical (med spa) → then template; or the
  audit delivery/report system (T16). Open recurring: formal Lighthouse/axe ≥90 pass.

## ⏭️ Next
- Phase 6: one deep vertical (med spa) then template — only after deploy + verify
- T16: paid audit report template (productize what we deliver by hand)

## 🗓️ Later
- T13 technical hardening (recurring): formal Lighthouse/axe ≥90 pass on all pages
- Re-home Aethelo work into its own repo (currently in .git.aethelo-backup)
- Real audit/report generator + AI-visibility prompt runner (prompts.md)
- T17 DIY kit contents — only if T14 ($97 pre-order) shows real demand
