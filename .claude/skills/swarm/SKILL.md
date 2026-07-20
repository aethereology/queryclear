---
name: swarm
description: Run queryclear's daily business swarm — ops-watchdog and outreach-drafter agents in parallel, then one consolidated morning briefing on the autonomous outreach engine's last 24h, any warm leads awaiting a reply, and any red flags. The one command to start a working day. Optionally follow with prospecting or page-building if the queue needs it.
---

Run the daily swarm: everything that keeps the business moving, in one pass.

**Sending is autonomous** (Vercel cron — `app/api/cron/outreach-send`, `warm-scan`,
`digest`; see `docs/automation/SWARM.md`), within a daily send cap and an automated
honesty/compliance QA gate (`lib/outreach-qa.ts`). The swarm no longer hands the
founder send commands — its job now is to **audit** what the autonomous engine did,
surface anything QA quarantined, and hand the founder any **warm lead** (a reply)
that needs a human reply. Deploying and spending beyond the coded caps remain
founder-gated.

1. Spawn IN PARALLEL (single message, two Agent calls; fallback for missing agent
   types: `general-purpose` with the corresponding `.claude/agents/<name>.md`
   prepended):
   - `ops-watchdog` — standard (not deep) health check, including the autonomous
     engine's telemetry (cron routes alive + gated, queue depth, quarantine count).
   - `outreach-drafter` — audits the last 24h of autonomous sends: what went out,
     what's due next, and — most importantly — what's sitting in QA quarantine
     (never sent) and why.
2. When both return, write ONE consolidated morning briefing:
   - **Health**: ✅/❌ summary; any ❌ first with evidence.
   - **Outreach (autonomous)**: sent in the last 24h, due next, quarantined items
     + reasons (fix the data and re-ingest, or discard the prospect).
   - **Warm leads**: anyone who replied (auto-flagged `warm`, cadence already
     stopped) — these are the founder's action items; nothing else is.
   - **Pipeline runway**: prospect-queue depth (`queue-status` action); if under
     ~2 days of sends at the current cap, recommend `/prospect-city <next metro>`
     (St. Augustine → Orlando → Tampa → Miami) then
     `node --env-file=.env.local tools/ingest-prospects.mjs --file <csv>` to push
     the curated CSV into the cloud queue the cron reads from.
   - **Overdue founder actions**: from the watchdog (DMARC, Maple Bear rows,
     Stripe webhook check, Graph/Resend-webhook setup if still pending).
3. Only if the user asked for a "full" swarm run, additionally offer/launch
   `/prospect-city` (spends Apify credits — confirm) or `/build-vertical`
   (big token spend) — never by default.
