# Outreach batch — Jacksonville med spas (2026-07-06)

Prospect list: `leads/2026-07-06-medspa-jacksonville.csv` (gitignored — PII).
**54 prospects**, all med-spa / aesthetics / wellness businesses in Jacksonville, FL
with a working website AND a published contact email.

## Sourcing

- Apify `compass/crawler-google-places` run `TT92zB6BcWy1qQYHG` (2026-07-06),
  searches "med spa" + "medical spa", locationQuery "Jacksonville, Florida",
  places-with-website filter + contact enrichment. 120 raw places, ~$0.45 credit.
- Search was exhausted (0 new places in the final 35 result pages), so this is
  close to full coverage of Google-Maps-visible med spas in the Jacksonville metro.

## Curation (120 → 54)

Dropped:
- No email found on their site (~45 places — could be recovered later with a
  deeper contact-page crawl or manual lookup; several looked like good fits,
  e.g. Hydro Med Spa, Be Still Wellness, Meridian Med Spa, Villa Sainte).
- Junk/artifact emails: `filler@godaddy.com`, Vagaro/booking-platform support
  addresses, Google-Maps URL fragments the scraper misread as emails.
- Poor fit: national chains (Ulta, OVME HQ, Sundays Sun Spa), health systems
  (Baptist, UF Health), schools (Parisian Spa Institute, Alpha School of
  Massage), a nail salon, careers-only mailboxes (Park Ave Dermatology).
- Kept: VIO Med Spa's two Jacksonville locations (franchise-local emails, not HQ);
  one prospect on a Setmore booking page (good Build-offer candidate).

## How to run (founder)

Preview first (writes rendered emails to `previews/`, sends nothing):

    node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/2026-07-06-medspa-jacksonville.csv --limit 10

Then send the reviewed batch:

    node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/2026-07-06-medspa-jacksonville.csv --limit 10 --send

Requires `OUTREACH_SECRET` (+ `OUTREACH_BASE_URL=https://www.queryclear.com` to run
against prod). Server-side masterlist dedups, so reruns never double-send.
Suggested pace: 10–15/day against the 54, then follow-ups via `due`.

## Next batches (same recipe, swap locationQuery)

St. Augustine FL → Orlando FL → Tampa FL → Miami FL. Also worth a second
Jacksonville pass with searches "botox" / "laser hair removal" / "aesthetics"
to catch places not categorized as med spas.
