# The queryclear swarm — agent automation manual

> Created 2026-07-06. The business's recurring work is packaged as Claude Code
> **agents** (`.claude/agents/*.md`) orchestrated by **skills** (`.claude/skills/`,
> invoked as slash commands). Definitions are markdown in this repo, so the swarm
> versions with the code and works in any future session.

## The one-command day

```
/swarm
```

Runs `ops-watchdog` + `outreach-drafter` in parallel and produces one morning
briefing: prod health, due follow-ups, today's QA'd outreach batch, the founder's
send commands, pipeline runway, and overdue actions.

## The pipelines

| Command | Agent(s) | What it does | Cost / cadence |
|---|---|---|---|
| `/swarm` | ops-watchdog + outreach-drafter | Morning briefing: health + today's outreach, one message | tokens only; daily |
| `/outreach-daily` | outreach-drafter | Preview due follow-ups + next 10–15 new prospects, QA every email, hand back send commands | tokens only; every send day |
| `/prospect-city <city>` | prospector → prospect-curator | Apify Maps sweep → curated CSV + batch doc in `docs/marketing/outreach/` | **~$0.45–1 Apify credits**; when runway < ~2 days |
| `/build-vertical <vertical>` | vertical-page-builder | New vertical page from the med-spa template, wired + build/lint/test green | large token spend; when a vertical is chosen |
| `/ops-check [deep]` | ops-watchdog | Prod smoke + tests + outreach stats + overdue nags; `deep` adds `npm run build` | tokens only; any time |

## What stays founder-gated (by design — the swarm never does these)

1. **Sending outreach** — every `--send` (batch and `due`). The agents produce
   previews in `docs/marketing/outreach/previews/` and print the exact command.
2. **Deploying** — commit/push + `vercel --prod --scope sparkcreativesinc`. This
   Mac's Vercel CLI has no team access anyway.
3. **Spending beyond stated caps** — Apify runs are budget-capped in the agent
   brief; Stripe/infra changes are out of scope entirely.
4. **Marking contact statuses** (`--mark`) — only on explicit instruction, since
   it changes what the nurture cadence will send.

## Standing guardrails baked into every agent

No fake testimonials/clients/details; no guaranteed-ranking or guaranteed-citation
language; no hype buzzwords; leads directory (`docs/marketing/outreach/leads/`) and
previews are gitignored PII that exist only on this machine.

## Extending the swarm

- New vertical batch recipe (city or vertical): edit `prospector.md` search terms.
- New health checks: add to `ops-watchdog.md`'s checklists.
- Recurring scheduling: the `/schedule` skill can cron these, BUT scheduled cloud
  agents run in remote environments without this Mac's `.env.local`, leads CSVs,
  or Apify/M365 connections — so today the swarm is human-triggered
  (`/swarm` each morning). Revisit if secrets move to a shared vault.
- Agent definitions are only loaded at session start: after editing
  `.claude/agents/*.md`, new sessions pick them up; within an old session, fall
  back to `general-purpose` with the agent file's contents prepended to the prompt
  (each skill documents this).
