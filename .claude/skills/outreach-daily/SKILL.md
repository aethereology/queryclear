---
name: outreach-daily
description: Prep today's cold-outreach batch — spawn the outreach-drafter agent to preview due follow-ups + the next 10–15 new prospects, QA every rendered email, and hand the founder the exact send commands. Use every outreach day ("prep outreach", "what's due today"). Preview-only; sending stays founder-gated.
---

Run queryclear's daily outreach prep. Everything here is preview-only: the founder
personally fires every `--send`.

1. Identify the active lead CSV: the most recent file in
   `docs/marketing/outreach/leads/*.csv` unless the user named one.
2. Spawn the `outreach-drafter` agent (Agent tool, subagent_type
   `outreach-drafter`; if that type isn't loaded in this session, use
   `general-purpose` and prepend the contents of
   `.claude/agents/outreach-drafter.md` to the prompt). Tell it which CSV and what
   limit (default 12; founder pace is 10–15/day).
3. Relay its report to the user:
   - due follow-ups queued (count + who),
   - new prospects previewed vs. skipped as duplicates,
   - per-email QA verdicts and anything excluded,
   - masterlist totals by status,
   - the exact send commands, clearly labeled as the founder's step, plus a
     pointer to the preview files
     (`docs/marketing/outreach/previews/due-index.html` and the batch previews).
4. If the CSV is nearly exhausted (fewer uncontacted rows than ~2 days of sends),
   say so and suggest running `/prospect-city` for the next metro
   (St. Augustine → Orlando → Tampa → Miami per the batch doc).

Never pass `--send` yourself, and never mark contact statuses without an explicit
user instruction.
