# Seed Data — queryclear

> ⚠️ FICTIONAL DEMO ONLY. Everything here is invented for building/testing the
> sample audit. Do NOT present as a real business. When we audit a real client,
> we use ONLY their real, verified details (brand rule: no invented business info).

Purpose: a believable demo business to build the **sample GEO audit** against,
so we have a sales asset without misrepresenting anyone real.

---

## Demo business (fictional) — current sample audit

- **Name:** Goldleaf Aesthetics & Med Spa *(fictional)*
- **Category:** Medical aesthetics / med spa
- **Service area:** "Westhaven" metro *(fictional city)*
- **Main services:** Botox/Dysport, dermal fillers, laser hair removal, HydraFacial /
  medical-grade facials, microneedling, chemical peels
- **Providers (the Proof Density angle):** licensed RN injectors under a medical
  director — credentials matter for a medical aesthetics business
- **Site:** a typical small-business site — thin content, no schema, no `llms.txt`,
  treatments lumped on one page, no FAQ, providers/credentials not stated (the
  "before" state)

> Used in `app/audit/page.tsx` (the live sample audit, rebuilt 2026-06-05) and doubles
> as groundwork for the Phase 6 med-spa vertical.

## Why this profile

Represents the exact target customer: a local service business with a real offering
but a site that's invisible/unclear to AI answer engines. Medical aesthetics adds a
trust dimension (licensed providers / medical oversight) that makes the Proof Density
layer concrete. Lets us demonstrate the full audit: AI-visibility tests, the 7-layer
scorecard, schema gaps, content/entity clarity, crawlability, and a prioritized fix list.

## Demo AI-visibility test inputs

- `{SERVICE}` = "med spa", "Botox", "lip filler", "laser hair removal"
- `{CITY}` = "Westhaven"
- `{BUSINESS}` = "Goldleaf Aesthetics & Med Spa"
- `{CATEGORY}` = "medical aesthetics / med spa"

## Prior demo (retired)

Brightleaf Plumbing Co. ("Riverton" metro) was the previous sample-audit business and
is still used as a generic schema/llms.txt teaching example on the homepage,
`/schema-for-ai-search`, and `/llms-txt-for-businesses`.

## Demo "before" weaknesses (to surface in the sample audit)

- No `Organization` / `LocalBusiness` schema
- No `Service` or `FAQPage` schema
- No `llms.txt`, weak/absent sitemap
- Vague homepage; service pages don't clearly state what/where
- No AI-readable business summary
- Likely absent from AI answers for category + city queries

(When we build the sample audit, produce the realistic "before → recommended
fixes" report from this — clearly labeled as a demo.)
