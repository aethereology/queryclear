---
name: swarm
description: Run queryclear's daily business swarm — ops-watchdog and outreach-drafter agents in parallel, then one consolidated morning briefing with the founder's send commands and any red flags. The one command to start a working day. Optionally follow with prospecting or page-building if the pipeline needs it.
---

Run the daily swarm: everything that keeps the business moving, in one pass.
All outward-facing actions (sending, deploying, spending) remain founder-gated —
the swarm's job is to get each of them to one keystroke from done.

1. Spawn IN PARALLEL (single message, two Agent calls; fallback for missing agent
   types: `general-purpose` with the corresponding `.claude/agents/<name>.md`
   prepended):
   - `ops-watchdog` — standard (not deep) health check.
   - `outreach-drafter` — due follow-ups + next batch (default limit 12) from the
     most recent CSV in `docs/marketing/outreach/leads/`.
2. When both return, write ONE consolidated morning briefing:
   - **Health**: ✅/❌ summary; any ❌ first with evidence.
   - **Outreach**: due touches, new previews + QA verdicts, masterlist totals,
     and the exact founder send commands.
   - **Pipeline runway**: uncontacted prospects remaining; if under ~2 days of
     sends, recommend `/prospect-city <next metro>` (St. Augustine → Orlando →
     Tampa → Miami).
   - **Overdue founder actions**: from the watchdog (DMARC, Maple Bear rows,
     Stripe webhook check).
3. Only if the user asked for a "full" swarm run, additionally offer/launch
   `/prospect-city` (spends Apify credits — confirm) or `/build-vertical`
   (big token spend) — never by default.
