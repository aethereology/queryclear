# Seed Data — queryclear

> ⚠️ FICTIONAL DEMO ONLY. Everything here is invented for building/testing the
> sample audit. Do NOT present as a real business. When we audit a real client,
> we use ONLY their real, verified details (brand rule: no invented business info).

Purpose: a believable demo business to build the **sample GEO audit** against,
so we have a sales asset without misrepresenting anyone real.

---

## Demo business (fictional)

- **Name:** Brightleaf Plumbing Co. *(fictional)*
- **Category:** Residential & light-commercial plumbing
- **Service area:** "Riverton" metro *(fictional city)*
- **Main services:** drain cleaning, water heater install/repair, leak detection,
  emergency plumbing
- **Site:** a typical small-business site — thin content, no schema, no `llms.txt`,
  generic homepage, weak service pages, no FAQ (the "before" state)

## Why this profile

Represents the exact target customer: a local service business with a real
offering but a site that's invisible/unclear to AI answer engines. Lets us
demonstrate the full audit: AI-visibility tests, schema gaps, content/entity
clarity issues, crawlability, and a prioritized fix list.

## Demo AI-visibility test inputs

- `{SERVICE}` = "emergency plumber", "water heater repair", "drain cleaning"
- `{CITY}` = "Riverton"
- `{BUSINESS}` = "Brightleaf Plumbing Co."
- `{CATEGORY}` = "plumbing company"

## Demo "before" weaknesses (to surface in the sample audit)

- No `Organization` / `LocalBusiness` schema
- No `Service` or `FAQPage` schema
- No `llms.txt`, weak/absent sitemap
- Vague homepage; service pages don't clearly state what/where
- No AI-readable business summary
- Likely absent from AI answers for category + city queries

(When we build the sample audit, produce the realistic "before → recommended
fixes" report from this — clearly labeled as a demo.)
