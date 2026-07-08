# Outreach batch — Fort Lauderdale med spas (2026-07-07)

Prospect list: `leads/2026-07-07-medspa-fort-lauderdale.csv` (gitignored — PII).
**71 prospects**, all med-spa / aesthetics / medical-wellness businesses in Fort
Lauderdale, FL (plus one in adjacent Wilton Manors dropped — see below) with a
working website AND a real, business-specific contact email.

## Sourcing

- Apify `compass/crawler-google-places` run `feHcB1FX3yXqT4vDm` (2026-07-07),
  searches "med spa" + "medical spa", locationQuery "Fort Lauderdale, Florida".
  238 raw places, ~$0.85–0.95 credit.
- Raw dump was a trimmed field set (title, website, emails, phone, address,
  categories, totalScore/reviewsCount, permanentlyClosed/temporarilyClosed,
  socials) rather than the full Apify schema — sufficient for curation.
- Broad "medical spa" search string pulled in a lot of adjacent-but-unrelated
  categories this time (chiropractors, dentists, a vet, hotels, imaging
  centers, massage-only studios) — more aggressive vertical filtering was
  needed than in the Jacksonville batch.

## Curation (238 → 71)

Dropped 4 permanently/temporarily closed listings first (per Apify
`permanentlyClosed`/`temporarilyClosed` flags), then 122 places with no email
found at all, leaving 112 candidates with at least one email. Of those 112,
41 were cut:

**No real email (5):** `filler@godaddy.com` placeholders (Dolce Medical Spa Las
Olas, OsteoStrong Fort Lauderdale Coral Ridge, one of two emails on Advanced
Laser Clinic And MedSpa), a Google-Maps URL fragment misread as an email (Las
Olas Med Spa / topaesthetics.com), and one email that resolved to a *different*
organization's domain rather than the business's own (Dr. Stephen Cosentino, DO
— the email was `@empiremedicaltraining.com`, a training-institute domain, not
his own practice site).

**Poor fit (22):** wrong business type entirely — a diagnostic imaging center,
chiropractors (x2), a dentist, a veterinarian, a pet groomer, an acupuncture
clinic, a hyperbaric-oxygen clinic, a general medical center, a cardiology
practice, a mental-health service, a nail salon, a generic beauty/relaxation
salon, a medical-equipment supplier, a corporate HQ (Liquivida), a B2B
sales/licensing entity (VIOcosmedical PA — `viosales@`, not a patient-facing
location), two resort hotels and a guesthouse (spa is incidental to their
core lodging business), and Ocean Health Center (Google categorized it
"Medical spa" but the site itself is titled "Chiropractor | Wellness" —
verified by fetching the page).

**Wrong vertical / not aesthetics-focused (9):** pure massage therapists and
massage-only spas (Planet Massage Spa, Soltri Spa, The ASMR Experience,
Courtney Adams Massage, Better Body Spa, The NOW Massage Fort Lauderdale —
a massage franchise with a location-specific email but the wrong vertical for
a med-spa pitch), craniosacral therapy (Total Balance 4 U), structural
integration (Rolfmesi), and a chiropractic-adjacent wellness center (All
Natural Wellness Center). These are legitimate local businesses but a
med-spa-specific audit pitch (botox/filler/laser/injectable-intent AI
queries) won't land with them.

**National chains (4):** Juvly Aesthetics (multi-state chain, generic
`info@`/`HR@`), Massage Envy (generic `press@`/`corporatewellness@`), LaserAway
(generic `hello@laseraway.net`, not location-specific), Heavenly Spa By Westin
(hotel-chain spa).

**Duplicate (1):** "Dr. Stephen B. Channey, MD" and "MVC Health" are the same
business/domain/email (`mvchealth.com`) — kept the clearer business name (MVC
Health), dropped the physician-listing duplicate.

**Kept, notable:**
- Franchise locations with real location-local emails (not HQ): VIO Med Spa
  Fort Lauderdale (`fortlauderdale@viomedspa.com`), Prime IV Hydration &
  Wellness (`primeftl@primeivhydration.com`), Restore Hyper Wellness
  (`frontdeskfl026@restore.com` — location code in the address), Sana Skin
  Studio (multi-location domain with a real `ftl@sanaskinstudio.com` chosen
  over its ~20-alias membership list), NATURA Hair Removal & Skin Care
  (`naturalasolas@naturaspa.com` — "Las Olas" location).
- A few emails needed light cleanup, not a full drop: Aesthetic Ranch Medical
  Spa, Mirar Aesthetics & Wellness, and Raina Simone Aesthetics each had a
  `filler@godaddy.com` or social-media-URL-fragment junk entry alongside a
  real address — kept the real one. Skincare by Adriana G's scraped email had
  a stray `//` prefix (`//skincarebyadrianag@gmail.com`) that was clearly a
  scrape artifact around a valid Gmail address — stripped it rather than
  dropping a real prospect.
- **Borderline calls (flagged for founder awareness, kept anyway):** Majesty
  Day Spa and J. Cohen's Day Spa (day spas, not strictly "medical" spas, but
  squarely in the aesthetics/wellness continuum); Vitality by Pam
  (biohacking wellness studio); Hair By Dr. Max (hair-restoration clinic —
  medical/aesthetic adjacent); The BEST Program (an age-management/hormone/
  weight-loss clinic — site copy confirms "Anti-Aging," "Hormone," "Weight
  Loss," so a good fit despite the generic name).
- **Build-offer candidates** (rented booking-page "sites," not real owned
  websites — flag these for the Website Build pitch, not just an audit): Jream
  Natural Aesthetics and Skin Voyage Face Massage & Facial Studio (both on
  GlossGenius booking pages), Skincare by Adriana G (also GlossGenius), and
  Dew Medspa (a free Wix subdomain, `dewmedicalspa.wixsite.com/my-site`).
- Rebounce IV Health and Wellness had no address/city in the raw data at all
  (looks like a mobile/service-area IV business); city set to "Fort
  Lauderdale" from the listing title and confirmed by the site's own copy
  ("Mobile IV Therapy Near Me by RebounceIV").

## Verification

Spot-checked 6 kept sites with `curl -sIL` / title fetch — all resolve and
match the business name: RebounceIV ("Mobile IV Therapy Near Me by
RebounceIV"), Dew Medspa ("Dew Medspa | laser hair removal | Fort Lauderdale"),
Hair By Dr. Max ("Ft. Lauderdale Hair Restoration Clinic"), Vitality by Pam
("Health & Wellness Spa in Fort Lauderdale"), Jream Natural Aesthetics
(GlossGenius page, 200 OK), Florida Men's Health Center (200 OK). No duplicate
domains among the 71 kept rows; all 71 emails are structurally valid
(`name@domain.tld`) and non-generic-junk.

## How to run (founder)

Preview first (writes rendered emails to `previews/`, sends nothing):

    node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/2026-07-07-medspa-fort-lauderdale.csv --limit 10

Then send the reviewed batch:

    node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/2026-07-07-medspa-fort-lauderdale.csv --limit 10 --send

Requires `OUTREACH_SECRET` (+ `OUTREACH_BASE_URL=https://www.queryclear.com` to run
against prod). Server-side masterlist dedups, so reruns never double-send.
Suggested pace: 10–15/day against the 71, then follow-ups via `due`.

## Next batches

Miami FL and Boca Raton/West Palm Beach FL are the natural adjacent metros
(same South Florida aesthetics market). Also worth a narrower second Fort
Lauderdale pass with searches "botox" / "laser hair removal" / "aesthetics
clinic" to catch places not categorized as "medical spa" by Google (this pass
already showed the "medical spa" category tag is unreliable — Ocean Health
Center and OxyRegen were both mis-tagged) and to pick up some of the 122
places that had a website but no scraped email (worth a deeper contact-page
crawl before writing them off).
