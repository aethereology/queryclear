# Outreach review — the automated QA gate (was: in-session agent QA)

**Sending is now autonomous.** A Vercel cron (`app/api/cron/outreach-send`) sends
cold emails and follow-ups on a schedule, within a daily send cap
(`OUTREACH_DAILY_SEND_CAP`). Nobody reads these emails before they go out anymore —
so the checklist below, which used to be an in-session agent's manual review, is
now **implemented in code** as the automated pre-send QA gate
(`lib/outreach-qa.ts`). Anything that fails a check here is **quarantined**
(`lib/prospect-queue.ts` → `pq:quarantine`) and never sent; it surfaces in the
nightly founder digest (`app/api/cron/digest`) and via
`tools/ingest-prospects.mjs --status`.

> The gate is code, not a human: `qaSend()` runs on every rendered email before
> `sendEmail()` is ever called. A failure holds the send — it does not degrade to
> "send anyway." Founder/agent review now happens on the **quarantine list**
> (post-hoc, a handful of items) rather than every outgoing email (pre-hoc, all
> of them) — that's what makes autonomy safe.

## How review works now

1. The automated gate runs on every send, cold or follow-up, inside the cron —
   see `qaSend()` / `qaRenderedCopy()` in `lib/outreach-qa.ts` for the exact checks
   (mirrors the checklist below).
2. Anything that fails is quarantined with its reasons, never sent. The nightly
   digest email surfaces the count + a sample; `outreach-drafter`
   (`.claude/agents/outreach-drafter.md`) or the founder can pull the full list via
   `tools/ingest-prospects.mjs --status`.
3. For each quarantined item: is it a **data problem** (missing
   `OUTREACH_POSTAL_ADDRESS`, a stale report token, a typo'd email) — fix it and
   re-ingest — or a **bad prospect** (dead domain, wrong target) — discard it?
   Never bypass the gate to force a send; fix the underlying issue so it passes
   honestly.
4. A separate reply-detection cron (`app/api/cron/warm-scan`, via Microsoft Graph)
   flips a contact to the terminal `warm` status the moment they reply, stopping
   the cadence immediately and alerting the founder — that is the one thing that
   still needs a human, and it's a reply to act on, not a send to approve.

## Checklist (per email) — the spec the code in `lib/outreach-qa.ts` implements

Keep this list and the code in sync: if you add a check to one, add it to the
other. Items marked **[coded]** are enforced automatically today; the rest are
still human/agent judgment calls made when triaging the quarantine list.

**Honesty (hard gate — never ship a fail) [coded]**
- No claim that an engine was queried live ("I checked ChatGPT…") unless the
  underlying finding is `measured`. Estimated findings must use soft phrasing.
- No guaranteed-ranking / guaranteed-citation language. No invented facts about
  the business.

**Relevance / hook quality (not coded — judgment; spot-check occasionally)**
- Does the hook land? If the audit found almost nothing (weak/empty), the email is
  unconvincing. (A hard audit failure IS coded: `lib/outreach-qa.ts` quarantines
  on `content: audit failed`; a *weak but successful* audit is not yet detected.)
- Is the finding actually about *this* business (right domain, sensible query)?

**Personalization**
- No leftover placeholder (`{{`, `undefined`, `null`) **[coded]**.
- Business name present and correct, not the bare domain when a name exists
  (not coded — semantic judgment).

**Deliverability / fit**
- Opt-out + real postal address present **[coded]** — `qaSend()` fails on the
  `POSTAL_FALLBACK` sentinel and on a missing unsubscribe line.
- Recipient domain has a valid MX record **[coded]** — a dead domain quarantines
  rather than bouncing.
- Plain and personal, one ask (not coded — style; the templates in `lib/email.ts`
  are written this way by design).

**Should this person get it at all?**
- Status still active (`cold`/`opened`) **[coded]** — enforced by
  `ACTIVE_STATUSES`/`nextStep()` before the cron ever builds the email; `warm`,
  `replied`, `unsubscribed`, `bounced`, `customer` are all terminal.
- Report link healthy **[coded]** — `reportLinkOk` fails the gate on a missing or
  expired token (was the `no-report-link` / `report-expired` auto-flag below).
- Not a competitor / obviously wrong target (not coded — a curation-time judgment;
  see the `prospect-curator` agent's rules for cloud-sourced prospects).

## Auto-flags → now QA-gate failure reasons

The `due` action's old `no-report-link` / `report-expired` flags are now
`qaSend()` failures (`content: report link missing or expired`) that quarantine
the send instead of just annotating a preview:
- No stored report token, or the 30-day report cache lapsed → the `/r/<token>`
  link would 404 → held, not sent. Re-audit or discard the contact rather than
  letting a dead link go out.

## Cadence reference

- **Cold arm** (status `cold`): touch 1 = audit, then `bump` (+4d), `tip` (+5d),
  `last-note` (+7d) → **stop**.
- **Nurture arm** (status `opened`/`replied`): value sequence, wider spacing, capped
  at 10 touches total.
- **`warm`** (new): set automatically by the Graph warm-scan cron the instant a
  contact replies (opt-out-worded replies get `unsubscribed` instead). Terminal —
  drops out of the queue on the very next cron tick, same as the statuses below.
- Terminal statuses (`warm`, `replied`, `unsubscribed`, `bounced`, `customer`)
  drop out of the queue automatically.
