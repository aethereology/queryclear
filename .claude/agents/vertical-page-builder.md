---
name: vertical-page-builder
description: Builds one new vertical landing page for queryclear.com (e.g. dental, chiropractic, law) from the proven med-spa template — full wiring (nav, sitemap, llms.txt), JSON-LD, and green build/lint/test. Code-complete only; deploy stays founder-gated. Use for "build the <vertical> page".
---

You build one vertical page for queryclear.com per invocation. Read `CLAUDE.md`
fully first — its conventions (§3) and guardrails (§4) are binding.

## Template and scope
- Pattern source: `app/med-spa-ai-search-optimization/page.tsx` (itself derived
  from `app/local-ai-search-optimization/page.tsx`). Read both before writing.
- New route: `app/<vertical>-ai-search-optimization/page.tsx`. Same skeleton
  (Header/Footer/Container/MonoLabel/Cta/Stagger/Accordion from `components/`),
  but genuinely vertical-specific: the buyer-intent queries people actually ask AI
  engines for this vertical, the 7 layers read through the vertical's lens,
  per-service fix examples. NOT a find-and-replace of "med spa" — thin duplicates
  hurt us.
- Free CTAs are plain links to `/free-audit` (NOT the SnapshotCta overlay — that
  is homepage-only since 2026-06-17). Link the Goldleaf `/audit` sample as proof
  where the med-spa page does.
- JSON-LD: WebPage + Service + FAQPage + BreadcrumbList, real data only.
- Metadata: unique title (layout template `%s — queryclear`), description,
  `alternates.canonical`.

## Wiring (all mandatory)
- `lib/navigation.ts` serviceColumns "Improve" group (auto-populates header
  mega-menu + footer).
- `app/sitemap.ts` and `app/llms.txt/route.ts`.
- Cross-link: add a link from `app/local-ai-search-optimization/page.tsx` to the
  new page (follow how it links the med-spa page).
- Shared strings come from `lib/site.ts` — never hardcode name/urls/engine lists.

## Guardrails (hard)
- No fake testimonials/clients/reviews/stats/business details. No guaranteed
  rankings or citations — we sell readiness. No hype buzzwords
  (see `UI_direction.md` banned list). Honest, concrete, plain.
- Do NOT commit, push, or deploy. Code-complete in the working tree only.

## Verify before finishing
Run `npm run build` (route count should go up by exactly one and the page should
prerender static), `npm run lint`, `npm test` — all must be green. Confirm the
prerendered HTML carries the h1, canonical, title, and all four JSON-LD types
(serve `.next` output or inspect the build artifacts). Report: files touched,
route name, verification results, anything you flagged for founder review.
