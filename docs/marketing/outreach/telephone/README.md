# Telephone outreach — the call list

Built 2026-08-10 from the **live** contact ledger in Upstash Redis (`oc:contact:*`),
not from the CSVs in `../leads/` (those are stale and partly un-ingested).

For 142 of the 146, the call is a **follow-up to a real email they actually received** —
not a cold call. That is the whole advantage, and the script is built on it. The other 4
never got the email at all (it bounced), which is its own, equally good reason to call.

---

## Files

| File | What it is |
|---|---|
| `call-list.csv` | **146 businesses with a phone number**, ranked in dial order |
| `call-script.md` | What to say — openers, discovery, objections, closes, voicemail |
| `call-log.csv` | Blank. Fill a row per call; it's the input for improving the script |
| `no-phone-number.csv` | 13 contacts we could not find a verified number for |
| `do-not-call.csv` | 1 contact you must never call (asked to be unsubscribed) |

## The book of business

- **160** contacts in the live ledger. 159 contactable, 1 excluded.
- **146** have a phone number → `call-list.csv`.
- **144 of 146** have a **live report link** you can open mid-call (verified 200).
- Everyone has had **2–4 emails**. Nobody has ever replied.

**Three tiers, and the difference matters:**

| Tier | Count | Meaning |
|---|---|---|
| **A — opened report** | 20 | They clicked through and read their audit. Warmest signal in the business. Call these first. |
| **B — emailed, no open** | 122 | Received 2–4 emails, never opened the report. |
| **C — email bounced** | 4 | Their email address is dead, so **they never received a word from us.** The phone is the only channel that reaches them, and they've never been pitched. Genuinely fresh — worth calling early. |

Tier C are *not* do-not-calls. A bounce means a bad email address, not a business that
declined. The only person you must never call is the single unsubscribed contact in
`do-not-call.csv` (TREO Construction, Miami) — they asked to be left alone, and that
applies to every channel.

**By vertical:** med spa / aesthetics 92 · dental 37 · home builder / contractor 17

**By market:** Fort Lauderdale 48 · Jacksonville 47 · Miami 11 · Tampa 10 · Orlando 9 ·
St. Augustine 6 · Atlanta metro 9 · Savannah 2 · Columbus 1 · Macon 1

## Columns worth understanding

- `technical_finding` — up to two **measured** problems on their site (87 rows have at
  least one). Every one carries provenance `measured` in the audit, so you can state it
  as fact: missing page title, no structured data, missing meta description, thin content,
  no heading, truncated title. Ranked so the most concrete one comes first. This is your
  strongest opener — say it plainly.
  **`No llms.txt` is deliberately excluded** even though it was the single most common
  finding (50 rows): our own site calls llms.txt an optional supplemental file that Google
  doesn't use, so opening a call with it would contradict our public positioning.
- `their_question_1/2/3` — the customer questions the audit mapped for their business
  (141 rows have all three). These are **estimated** — inferred from their services,
  *not* verified against ChatGPT. Read `call-script.md` § "What you may not say" before
  using them. This matters.
- `report_url` — their actual report. Open it before you dial and have it on screen.
- `google_rating` / `google_reviews` — present for 124 of them. A 4.9 with 300 reviews is
  a business that has already invested in being found. Useful read on the call.

## Known quirks in the data — read before dialing

- **`dermani MEDSPA` appears 5 times** (Alpharetta, Marietta, Athens, Roswell, Sandy
  Springs) and all five share one corporate number, **(770) 884-4934**. It's a franchise.
  Call it **once** and treat it as one conversation about five locations — that's a bigger
  deal than any single row, and dialing the same number five times is how you get hung up on.
- **Some rows are chains, not owner-operated.** `Coast Dental` is the clearest example — its
  number routes to corporate, not the Jacksonville office. Chains have no local decision
  maker on the phone; deprioritise them or ask for the marketing contact by name.
- **138 distinct numbers across 146 rows** — the difference is the dermani cluster plus a
  couple of shared lines. No malformed numbers.
- **87 rows have a measured `technical_finding`; 59 don't.** Without one, open on their
  question instead of a defect — see the script.
- **2 rows have no live report link** (their cached report lapsed). Don't promise to walk
  through a report you can't open; use the general opener instead.

## Rules

1. **Never call anything in `do-not-call.csv`.** The unsubscribed contact asked to be
   left alone — that applies to every channel, not just email.
2. **After any real conversation, stop the emails.** Otherwise the cron keeps sending
   cold-looking follow-ups to someone you just spoke with:
   ```
   OUTREACH_BASE_URL=https://www.queryclear.com node --env-file=.env.local tools/outreach-audit.mjs --mark <email> warm
   ```
   `warm` is terminal — the cadence stops on the next run. Use `unsubscribed` if they ask
   you not to contact them again. (Verified working against prod.)
3. **Log every call** in `call-log.csv`. After ~30 calls the objection column tells you
   which part of the script to rewrite.
4. These are business numbers from public listings, called for a business purpose. If
   someone asks to be removed, remove them immediately and mark them `unsubscribed`.

## Two things you should know before you dial

**Lead sourcing has been dead since 2026-07-27.** The prospect queue is at **0**. All four
Apify sourcing runs that day aborted with *"You've reached the maximum usage for your
current billing cycle"* — the account hit its monthly Apify ceiling, so the `APIFY_DAILY_CAP_USD=4`
daily cap never came into play. No new prospects have entered the pipeline in two weeks.
Those four aborted runs did leave **503 scraped businesses** sitting in Apify datasets that
were never ingested — that's a free refill waiting, separate from this call list.

**This list is finite.** 146 calls is roughly two weeks of dialing. Fixing sourcing is what
makes the phone a repeatable channel instead of a one-off push.

## How this was built

Live Redis ledger → joined to phone numbers from (a) Apify datasets of all 10 past runs,
including the aborted ones, (b) the local raw JSON dumps, (c) the two lead CSVs carrying a
phone column → the 46 still missing were filled via Google Places Text Search, accepting a
result **only** when its website domain matched the contact's domain (34 filled, 12 no
verified match, ~$1.50 in Places calls). Then each contact's cached audit report
(`pa:report:<token>`) was pulled for their real findings and questions.

No contact record was modified. Everything above is read-only.
