---
name: prospect-city
description: Build a curated prospect list for a new city/vertical — spawn the prospector agent (Apify Google Maps sweep, ~$0.50 credits) then the prospect-curator agent (raw dump → clean CSV + batch doc). Args - city, optionally vertical (default med spa) and budget. Use when the outreach pipeline needs fresh leads.
---

Build a new prospect batch end-to-end. Args: a city (required — e.g.
"St. Augustine FL"), optionally a vertical (default: med spa) and a credit budget
(default: $1 cap).

This spends real Apify credits (~$0.45/city). If the user did not name the city or
clearly ask for prospecting in this conversation, confirm before launching.

1. Spawn the `prospector` agent with the city, vertical, search terms, and budget
   cap. (If the agent type isn't loaded this session, use `general-purpose` with
   the contents of `.claude/agents/prospector.md` prepended. Note: Apify MCP tools
   must be reachable in this session — they are claude.ai-connected and may be
   absent in headless runs.)
2. When it returns the raw JSON path, spawn the `prospect-curator` agent on that
   file (same fallback rule, `.claude/agents/prospect-curator.md`). These two steps
   are sequential — the curator needs the prospector's output file.
3. Report to the user: run cost, raw → curated counts with drop reasons, the CSV
   path and batch-doc path, standout prospects (e.g. booking-page sites = Build
   candidates), and the follow-on step: run `/outreach-daily` against the new CSV.
4. Remind the user the leads directory is gitignored PII that exists only on this
   machine — worth backing up.
