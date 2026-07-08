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

## ✅ Phase 6 first vertical (med spa) BUILT in code (2026-06-15)
- New `/med-spa-ai-search-optimization` — deep, med-spa-specific vertical (not a
  thin dupe): treatment-intent invisibility, the 7 layers in a med-spa lens, per-
  treatment fixes, Goldleaf `/audit` proof link, med-spa FAQ. WebPage+Service+
  FAQPage+BreadcrumbList; Snapshot CTA top+bottom; no new deps/medical schema.
  Wired into nav (serviceColumns→mega-menu+footer), sitemap, llms.txt; local page
  cross-links it. build ✅ 30 routes · lint ✅ · test ✅ 52/52. **Founder-gated:**
  commit/push + `vercel --prod --scope sparkcreativesinc` to ship.

## ✅ Free AI Search Audit SHIPPED to production (2026-06-17, commits f4e7e36 + c300757)
- Manual "AI Search Snapshot" RETIRED → replaced by the automated, instant, read-only
  **free AI Search Audit at `/free-audit`** (agent-runtime Python audit on Vercel;
  Upstash Redis per-IP rate-limit + daily spend cap; email gate unlocks the full report).
- Free CTAs sitewide are now plain links to `/free-audit`; `site.primaryCta` →
  `/free-audit`, `site.offers[0]` = "Free AI Search Audit". `SnapshotCta` overlay now
  serves only the homepage Upgrade/Build inquiry; lead form reframed to a website inquiry.
- On unlock the prospect is emailed their audit (summary + prioritized fixes + the three
  paid-offer CTAs) via `renderPublicAuditReportEmail`; team still notified. Unlocked
  report ends with the three paid offers. Tests now 56/56 (snapshot-overlay rewritten +
  new `tests/public-audit-email.test.mjs`).

## ✅ Local funnel redesign — code-complete + verified (2026-06-23, NOT yet deployed)
- Reshaped the local ladder for recurrence: **Free audit → $497 Discovery Sprint
  (credited toward upgrade) → Upgrade (from $2,500, now includes the Stack kit free) →
  AI Search Care Plan ($997/mo).** See Decisions.md 2026-06-23.
- (1) $497 `/ai-visibility-audit` reframed as a **Paid Discovery Sprint** — live
  walkthrough + $497 credited toward the upgrade (copy + success page + order email;
  same one-time checkout). (2) **NEW `/care-plan` — first subscription product** ($997/mo,
  `subscription`-mode Stripe; `carePlan` config; `care-plan` checkout branch;
  `renderCarePlanOrderEmail` + webhook dispatch; new pages + JSON-LD; nav/sitemap/llms/
  LeadForm/homepage wiring). (3) **$97 kit retired as a public SKU** → noindex + unlinked,
  reframed as a free Upgrade bonus (closes the T14 demand test).
- **Deliberately breaks the 2026-06-18 sell-only freeze** — founder authorized the full
  build for the MRR. Verified Windows 2026-06-23: build 38 routes, lint clean, **83/83** tests.
- **Founder-gated to ship:** confirm Stripe webhook endpoint covers the new subscription
  product (same endpoint, no new env vars); Stripe test-mode subscription smoke; set final
  Care Plan price/name if ≠ $997 / "AI Search Care Plan"; commit/push + `vercel --prod
  --scope sparkcreativesinc`; smoke-check `/care-plan` + sitemap + `/stack-kit` noindex.

## 🔄 Now — founder + next
- ✅ Stripe webhook REGISTERED and confirmed **enabled** in the Dashboard
  (re-verified via Stripe CLI 2026-07-07: endpoint `we_1Tf1eXRd3fLxij3FiHKdF6yv`
  → `https://www.queryclear.com/api/stripe/webhook`, live mode, status enabled,
  listening for `checkout.session.completed` + full event set). Closed.
- ✅ DMARC tightened `p=none` → `p=quarantine` (2026-07-07, via Cloudflare API).
  Closed.
- ✅ Maple Bear report **retired** (2026-07-07) — the business closed down.
  Removed `lib/reports/maplebear-stjohns-4caf31.ts` and its registry entry in
  `lib/reports/index.ts`; verified build (38 routes)/lint/test (83/83) all still
  green. No more pending engine-run follow-up for this client.
- **Ship the med-spa vertical:** commit/push + `vercel --prod --scope
  sparkcreativesinc` (founder-gated), then smoke-check the live route + sitemap.
  Open recurring: formal Lighthouse/axe ≥90 pass.

## ⏭️ Next
- Phase 6: template the other verticals (aesthetician, spa, salon, dentist, home
  service) — only after the med-spa page deploys and shows it converts
- First real paid-audit delivery: run the SOP, add `lib/reports/<slug>.ts`, ship

## 🗓️ Later
- T13 technical hardening (recurring): formal Lighthouse/axe ≥90 pass on all pages
- Re-home Aethelo work into its own repo (currently in .git.aethelo-backup)
- Real audit/report generator + AI-visibility prompt runner (prompts.md)
- T17 DIY kit contents — only if T14 ($97 pre-order) shows real demand
