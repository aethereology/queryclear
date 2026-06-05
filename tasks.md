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

## 🔄 Now
- **Deploy** all pages to Vercel (founder: needs `vercel` CLI install or git push;
  team `sparkcreativesinc`). Code is green and ready.
- T13 remaining (need founder accounts): Google Search Console + Bing Webmaster
  verification; submit updated sitemap; formal Lighthouse/axe ≥90 pass.

## ⏭️ Next
- Phase 6: one deep vertical (med spa) then template — only after deploy + verify
- Phase 5 (gated/deferred): $97 offer test page (T14)

## 🗓️ Later
- T8–T12 category pages · T13 technical hardening · T14 $97 offer test (gated)
- Re-home Aethelo work into its own repo (currently in .git.aethelo-backup)
- Real audit/report generator + AI-visibility prompt runner (prompts.md)
