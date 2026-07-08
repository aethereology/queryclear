# Outreach batch - Georgia med spas (2026-07-07)

Prospect list: `leads/2026-07-07-medspa-georgia.csv` (gitignored - PII).
Raw discovery: `leads/raw-2026-07-07-medspa-georgia.json`.

## Sourcing

- Firecrawl search + scrape against Georgia metros: Atlanta, Sandy Springs, Alpharetta,
  Roswell, Marietta, Decatur, Savannah, Augusta, Athens, Macon, and Columbus.
- After Firecrawl credits ran out, direct site fetches were used to enrich no-email rows
  from the already discovered candidate set.

## Output

- 17 outreach-ready rows with a website and a usable public contact email.
- Coverage is strongest in Roswell, Savannah, Sandy Springs, and the north-Atlanta
  suburbs; thinner in Augusta, Athens, Columbus, and Macon.

## Curation notes

- Dropped aggregator / directory rows from the outreach CSV (for example Booksy).
- Dropped placeholder or junk emails and one agency-style SEO inbox.
- Kept some non-domain-match emails when they appear to be the business's real public
  contact mailbox (for example a Gmail address published on-site).

## How to run

Preview first:

    node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/2026-07-07-medspa-georgia.csv --limit 10

Then send after QA:

    node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/2026-07-07-medspa-georgia.csv --limit 10 --send
