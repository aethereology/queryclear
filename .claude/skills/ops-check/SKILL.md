---
name: ops-check
description: Run the queryclear ops watchdog — prod smoke test (routes, stale strings, sitemap/llms.txt, noindex), local test suite + lint, outreach pipeline stats, and the overdue founder-actions list. Read-only. Use for "ops check", "is prod healthy", or as the daily/weekly digest. Pass "deep" to include npm run build.
---

Run the read-only health check.

1. Spawn the `ops-watchdog` agent (fallback if the type isn't loaded:
   `general-purpose` with `.claude/agents/ops-watchdog.md` prepended). Pass along
   "deep" if the user asked for a deep check (adds `npm run build`).
2. Relay the digest: ✅/❌ per area with evidence, outreach stats, overdue founder
   actions (DMARC p=quarantine, Maple Bear visibility rows, Stripe webhook
   registration — until closed).
3. If anything is ❌, lead with it and propose the specific fix — but do NOT apply
   fixes from this skill; that's a separate, explicit task.
