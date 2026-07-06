---
name: build-vertical
description: Build one or more new vertical landing pages for queryclear.com (dental, chiropractic, law, ...) from the proven med-spa template, each via a vertical-page-builder agent — code-complete with build/lint/test green. Deploy stays founder-gated. Args - the vertical name(s).
---

Build the requested vertical page(s). Args: one or more verticals (e.g. "dental",
"chiropractic, personal injury law"). If none given, ask — don't guess which
market to target.

1. For a single vertical: spawn one `vertical-page-builder` agent (fallback if the
   type isn't loaded: `general-purpose` with `.claude/agents/vertical-page-builder.md`
   prepended) with the vertical name and any user notes on the target buyer.
2. For multiple verticals: spawn the builders in parallel, but warn each agent that
   others are concurrently editing the shared wiring files (`lib/navigation.ts`,
   `app/sitemap.ts`, `app/llms.txt/route.ts`) — or safer, run them sequentially if
   only 2–3 pages. After all finish, re-run `npm run build && npm run lint && npm test`
   yourself to catch wiring collisions, and resolve any.
3. Verify the acceptance bar from `docs/build/page-template.md` and `test_plan.md`
   is met (each agent should report this; spot-check one page yourself).
4. Report: routes created, files touched, verification results (route count, test
   count), and the founder's remaining steps — review copy, then commit/push and
   `vercel --prod --scope sparkcreativesinc` (deploy is founder-gated; this Mac's
   Vercel CLI lacks team access).
5. Do NOT commit or deploy. Remind the user that CLAUDE.md §2 ground truth and
   memory.md need updating once the pages ship.
