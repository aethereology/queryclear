# UI Direction — queryclear

Direction set before building so the landing page goes fast and on-brand.

## Brand feel

Practical · modern · clear · founder-led · technical but understandable ·
revenue-focused · trustworthy · **not hype-driven**.

## Voice rules

**Use clear language:**
> "We make your website easier for search engines and AI answer engines to
> understand, trust, and recommend."

**Ban these buzzwords:** "unlock your potential", "innovative solutions",
"next-gen digital transformation", "revolutionary AI-powered growth", and any
vague hype. Concrete claims, plain words, real benefits.

## Visual direction (proposed — confirm in Decisions.md)

- **Aesthetic:** clean, high-contrast, lots of whitespace, fast-feeling. Think
  modern technical-product marketing, not agency-flashy.
- **Color:** queryclear gets its **own** identity, distinct from Aethelo's
  orange/teal (so the product reads as a product). Proposed: a single confident
  accent (e.g. a clear blue or green) + near-black text on near-white, one
  restrained accent for CTAs. *Final palette = open decision.*
- **Type:** one clean sans (Inter is fine) — readable, fast-loading.
- **Motion:** minimal, purposeful. No gratuitous animation.
- **Imagery:** diagrams / before-after / "what AI sees" beats stock photos.

## Landing page structure (from the brief)

1. **Hero** — headline + subheadline (modern SEO for the AI search era) +
   primary CTA "Get your free AI Search Snapshot" (= `site.primaryCta`) +
   secondary "See what we optimize"
2. **Problem** — businesses going invisible in AI answers; sites unclear to AI;
   generic SEO isn't enough
3. **Solution** — AI-search-optimized sites: structured content, schema, service
   pages, FAQs, crawlability (`llms.txt` only as an optional extra)
4. **What We Build** — new sites · existing-site optimization · AI Search Audits ·
   service-page rebuilds · local AI visibility
5. **How It Works** — Audit → Plan → Build/Optimize → Submit/Index → Monitor
6. **Deliverables** — the checklist (see product_spec.md)
7. **Offer ladder** — the public four tiers from `site.offers` (Snapshot free /
   Audit $497 / Upgrade from $2,500 / Build from $6,500) — live on / since 2026-06-11
8. **CTA** — "Get your free AI Search Snapshot"

## Conversion priorities

- Primary CTA above the fold and repeated at the bottom.
- The free Snapshot is the hook — make it the loudest action. ("Audit" = the
  paid $497 product; never call the free offer an audit.)
- Lead form short and accessible (fields in product_spec.md).

## Quality bar (non-negotiable — see test_plan.md)

- WCAG 2.1 AA minimum
- Fast: target Lighthouse perf ≥90, LCP <2.5s
- Mobile-first responsive
- Valid JSON-LD, OG tags, semantic headings — because we ARE the demo
