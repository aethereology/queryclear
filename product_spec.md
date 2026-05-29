# Product Spec — queryclear

## One-line

We make your website easier for search engines and AI answer engines to
understand, trust, and recommend.

## Who it's for (primary)

Local / SMB service business owners who are becoming invisible when someone asks
an AI ("best plumber near me", "who does X in [city]") and whose site is unclear
to AI systems. Fast, fear-shaped pain → fast yes.

## The offer (3 services)

### 1. AI Search Optimization Audit  — *the front door*
A concrete, fixed-scope review + report. Low friction, fast to close & deliver.
- **Deliverable:** a written GEO audit (PDF/web) scoring crawlability,
  indexability, structured data, entity/service clarity, content readiness,
  and AI-citation readiness — with a prioritized fix list.
- **Includes:** AI-visibility test results (we actually query the answer engines
  for the client's category — see `prompts.md`).
- **Price band:** ~$750–$1,500.

### 2. GEO Website Upgrade — *the build/optimization*
We implement the fixes on the client's existing site.
- **Deliverable:** metadata, JSON-LD schema, FAQ sections, `llms.txt`, sitemap,
  robots.txt, heading/structure cleanup, internal links, Search Console setup
  guidance, AI-readable business profile.
- **Price band:** ~$2,500–$5,000.

### 3. AI Search Website Build — *new site*
A new, AI-search-ready website built from scratch.
- **Deliverable:** everything in #2, plus a full site.
- **Price band:** project-based (scoped per client).

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
- `llms.txt`
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

queryclear.com must itself be a flawless GEO example: perfect schema, `llms.txt`,
sitemap, fast, accessible. It's both proof and demo. Dogfood everything.

## Lead capture fields

Name · Email · Website URL · Business name · Main service · City/market · Message
