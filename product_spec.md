# Product Spec — queryclear

## One-line

We make your website easier for search engines and AI answer engines to
understand, trust, and recommend.

## Who it's for (primary)

Local / SMB service business owners who are becoming invisible when someone asks
an AI ("best plumber near me", "who does X in [city]") and whose site is unclear
to AI systems. Fast, fear-shaped pain → fast yes.

## The offer (public four-tier ladder — repositioned 2026-06-11, see `Decisions.md`)

Names and prices below are canonical and must match `site.offers` in `lib/site.ts`.
"From" prices are floors, not quotes; scopes confirmed in writing.

### 1. Free AI Search Snapshot — *the lead magnet*
A quick plain-English review of the site's search clarity, technical foundation,
and biggest opportunities. The free offer is ALWAYS called the **Snapshot** —
"audit" refers exclusively to the paid product.
- **Price:** Free.

### 2. AI Search Audit — *the paid diagnostic / front door*
A concrete, fixed-scope review + report. Low friction, fast to close & deliver.
- **Deliverable:** a written AI Search Audit report (PDF/web) scoring
  crawlability, indexability, structured data, entity/service clarity, content
  readiness, and AI-citation readiness — with a prioritized fix roadmap.
- **Includes:** AI-visibility test results (we actually query the answer engines
  for the client's category — see `prompts.md`).
- **Price:** **$497 flat.**

### 3. Website Upgrade — *the main offer*
We implement the fixes on the client's existing site.
- **Deliverable:** metadata, JSON-LD schema, FAQ sections, sitemap, robots.txt,
  heading/structure cleanup, internal links, Search Console setup guidance,
  AI-readable business profile, `llms.txt` (optional supplemental file).
- **Price:** from $2,500.

### 4. Modern Search Website Build — *new site, top tier*
A new, AI-search-ready website built from scratch.
- **Deliverable:** everything in #3, plus a full site.
- **Price:** from $6,500.

## What we promise / what we don't

**We promise:** better technical readiness, clearer content, valid structured
data, crawlability, AI-readable summaries, conversion-focused structure,
honest measurement.

**We do NOT promise:** guaranteed rankings, guaranteed AI citations, fake speed.
No invented business details, reviews, addresses, phone numbers, ratings, certs.

## Standard deliverables checklist

- Clean semantic HTML, clear heading hierarchy
- Strong title tags + meta descriptions + Open Graph
- JSON-LD schema (see types below)
- FAQ sections (FAQPage schema)
- `llms.txt` (optional supplemental file — not required, not a ranking factor)
- `sitemap.xml` + `robots.txt`
- Internal links
- Accessible forms + clear CTAs (WCAG 2.1 AA)
- Fast, mobile-responsive pages
- AI-readable business summary
- AI visibility test prompts + results
- Search Console setup guidance

## Schema types we use (only when real data supports them)

`Organization`, `WebSite`, `WebPage`, `Service`, `FAQPage`, `BreadcrumbList`,
`LocalBusiness` (only if real local business details exist).

## Our own site = first case study

queryclear.com must itself be a flawless example of modern, AI-search-ready SEO:
perfect schema, sitemap, fast, accessible (plus llms.txt as an optional extra).
It's both proof and demo. Dogfood everything.

## Lead capture fields

Name · Email · Website URL · Business name · Main service · City/market · Message
