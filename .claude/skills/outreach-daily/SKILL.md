---
name: outreach-daily
description: Audit queryclear's autonomous cold-outreach engine — spawn the outreach-drafter agent to review what the Vercel cron sent/skipped in the last 24h, what's due next, and what's held in QA quarantine. Use every outreach day ("prep outreach", "what's due today", "check outreach"). Read-only audit; sending is autonomous.
---

Audit queryclear's outreach engine. **Sending is autonomous** (Vercel cron —
`app/api/cron/outreach-send`, within a daily send cap and the automated QA gate in
`lib/outreach-qa.ts`); this skill's job is to review what it did, not to prepare a
batch for the founder to fire.

1. Spawn the `outreach-drafter` agent (Agent tool, subagent_type
   `outreach-drafter`; if that type isn't loaded in this session, use
   `general-purpose` and prepend the contents of
   `.claude/agents/outreach-drafter.md` to the prompt). Ask it to review the last
   24h of autonomous sends and the current queue/quarantine state.
2. Relay its report to the user:
   - follow-ups + new cold sends the cron fired (count + who), and any it skipped
     as duplicates or because the daily cap was hit,
   - **QA quarantine**: anything the automated gate held instead of sending, with
     the failure reason (fix the underlying data and re-ingest, or discard),
   - **warm leads**: anyone who replied — cadence already stopped automatically;
     this is the one thing that needs the founder's reply,
   - masterlist totals by status, and prospect-queue depth.
3. If the queue is nearly exhausted (fewer queued prospects than ~2 days of sends
   at the current cap), say so and suggest running `/prospect-city` for the next
   metro (St. Augustine → Orlando → Tampa → Miami per the batch doc), then
   `node --env-file=.env.local tools/ingest-prospects.mjs --file <csv>` to push
   the curated rows into the cloud queue.

This skill never sends and never marks contact statuses — those either happen
autonomously (the cron, the Graph warm-scan reply detector) or on the founder's
explicit instruction.
