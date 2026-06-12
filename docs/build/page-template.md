# Page build recipe — queryclear

> Every page task card in `BUILD_QUEUE.md` references this. It encodes the
> conventions so cards stay short. Read `CLAUDE.md` §3 first.

## File layout for a new route `/foo`
- Create `app/foo/page.tsx` (a Server Component by default; only add `"use client"`
  if the page itself needs interactivity — usually it doesn't).
- Compose from existing primitives: `Header`, `Footer`, `Container`, `MonoLabel`,
  `Cta`, `Accordion`, `LeadForm`, and `components/motion.tsx` wrappers. Match the
  landing page's structure and spacing (`app/page.tsx` is the reference).

## Required in every page
1. **`metadata` export** (`import type { Metadata } from "next"`):
   - unique `title` (the layout adds the ` — queryclear` suffix automatically)
   - unique `description`
   - `alternates: { canonical: "/foo" }`
   - `openGraph` title/description (inherits siteName from layout)
2. **One `<h1>`**, logical `<h2>`/`<h3>` hierarchy. Semantic HTML.
3. **JSON-LD** via an inline `<script type="application/ld+json" ... />`:
   - `WebPage` always; `BreadcrumbList` for any page below the root.
   - `FAQPage` if the page has a real FAQ block.
   - `Service` for service/offer pages. Only fields backed by real data.
4. **Internal links**: link to `/ai-visibility-audit` (or the free-Snapshot CTA) and to
   `/ai-visibility-stack`; link to any sibling pages named in the card.
5. **A CTA** — primary is the free AI Search Snapshot ("audit" = the paid $497
   product). Use `site.primaryCta` from `lib/site.ts`.
6. **Add the route** to `app/sitemap.ts` AND to `app/llms.txt/route.ts`.

## Copy rules (see UI_direction.md)
- Plain, concrete, founder-led, anti-hype. No banned buzzwords.
- No guaranteed rankings/citations. No invented facts, reviews, or business details.
- Put new shared strings in `lib/site.ts`, not inline, when reused across pages.

## Done checklist (per page)
- [ ] `npm run build` clean, `npm run lint` clean, `npm test` green
- [ ] Unique title + meta description + canonical
- [ ] Valid JSON-LD (sanity-check shape; validate in Rich Results when deployed)
- [ ] One h1, sensible heading order, internal links + CTA present
- [ ] Added to `app/sitemap.ts` and `app/llms.txt/route.ts`
- [ ] Mobile OK at 360/768/1280; no console errors; a11y (labels, contrast, focus)
- [ ] Honesty gate passed (no fake/guarantee content)
- [ ] Card checked off in BUILD_QUEUE; `CLAUDE.md` §2 + `memory.md` updated
