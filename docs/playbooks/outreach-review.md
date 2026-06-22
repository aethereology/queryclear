# Outreach review (in-session agent QA)

The cold-outreach nurture system is **assisted, not autopilot**: nothing sends
without the founder's approval. This playbook is the checklist an in-session agent
follows when reviewing a due batch, so the founder reviews a flagged shortlist
instead of eyeballing every email.

> The agent **reviews and recommends only — it never sends.** `send-touch` /
> "Approve & send" is always a human action.

## How a review session runs

1. Founder (or the agent on request) runs the due queue:
   - CLI: `node --env-file=.env.local tools/outreach-audit.mjs due` (writes each
     rendered email to `docs/marketing/outreach/previews/due-*.html`).
   - or the `/outreach` console → **Due today** → Load due queue.
2. The agent reads each rendered email + its context (business, domain, status,
   step, auto-flags) and scores it against the checklist below.
3. The agent returns a **sorted shortlist**: ✅ clean (safe to approve), ⚠️ fix
   first, ⛔ hold/skip — each with a one-line reason.
4. The founder approves the clean ones (`due --send`, or per-row Approve in the
   console). Questionable ones get fixed or skipped.

## Checklist (per email)

**Honesty (hard gate — never ship a fail)**
- No claim that an engine was queried live ("I checked ChatGPT…") unless the
  underlying finding is `measured`. Estimated findings must use soft phrasing.
- No guaranteed-ranking / guaranteed-citation language. No invented facts about
  the business.

**Relevance / hook quality**
- Does the hook land? If the audit found almost nothing (weak/empty), the email is
  unconvincing — hold it rather than send a limp note.
- Is the finding actually about *this* business (right domain, sensible query)?

**Personalization**
- Business name present and correct (not the bare domain when a name exists).
- No leftover placeholder (`[ADD POSTAL ADDRESS]`, empty link, `undefined`).

**Deliverability / fit**
- Plain and personal — reads like a human wrote it, not a blast.
- One ask. Opt-out + postal address present.

**Should this person get it at all?**
- Status still active (`cold`/`opened`) — not someone who replied/unsubscribed.
- Auto-flags resolved: `no-report-link` or `report-expired` → the link is dead;
  fix (re-run a fresh audit) or skip before sending.
- Not a competitor / obviously wrong target.

## Auto-flags (computed by the `due` action)

- `no-report-link` — the contact has no stored report token; the follow-up's link
  falls back to `/free-audit`. Usually fine, but note it.
- `report-expired` — the 30-day report cache lapsed; the `/r/<token>` link will
  404. Re-audit (a fresh cold-send creates a new contact, so instead consider a
  manual note) or skip.

## Cadence reference

- **Cold arm** (status `cold`): touch 1 = audit, then `bump` (+4d), `tip` (+5d),
  `last-note` (+7d) → **stop**.
- **Nurture arm** (status `opened`/`replied`): value sequence, wider spacing, capped
  at 10 touches total.
- Terminal statuses (`replied` after you mark it, `unsubscribed`, `bounced`,
  `customer`) drop out of the queue automatically.
