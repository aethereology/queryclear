# The queryclear swarm — agent automation manual

> Created 2026-07-06. Updated 2026-07-20 for the autonomous-outreach cutover (see
> CLAUDE.md §2 and `Decisions.md`). The business's recurring work is packaged as
> Claude Code **agents** (`.claude/agents/*.md`) orchestrated by **skills**
> (`.claude/skills/`, invoked as slash commands). Definitions are markdown in this
> repo, so the swarm versions with the code and works in any future session.

## Two different things named "automation" — don't conflate them

1. **The Claude Code swarm** (this doc) — agents that run when a human (or
   `/schedule`) invokes them. Still true for prospecting, page-building, and now
   *auditing* the outreach engine. Nothing here sends email.
2. **The autonomous outreach engine** — plain Vercel cron routes
   (`app/api/cron/outreach-send`, `warm-scan`, `digest`; config in `vercel.json`)
   running inside the deployed app itself, on Vercel's schedule, with Vercel's
   prod env and Upstash Redis. **This is what actually sends mail now**, and it
   runs whether or not any Claude Code session is open — it does not have the
   "no secrets in a remote agent" problem described in the old version of this
   doc, because it isn't a Claude agent at all; it's application code.

## The one-command day

```
/swarm
```

Runs `ops-watchdog` + `outreach-drafter` in parallel and produces one morning
briefing: prod health (including the autonomous engine's telemetry), what the
cron sent/skipped/quarantined in the last 24h, any warm leads awaiting a reply,
queue runway, and overdue founder actions.

## The pipelines

| Command | Agent(s) | What it does | Cost / cadence |
|---|---|---|---|
| `/swarm` | ops-watchdog + outreach-drafter | Morning briefing: health + autonomous-engine audit + warm leads, one message | tokens only; daily |
| `/outreach-daily` | outreach-drafter | Audit the last 24h of autonomous sends, due-next, and QA quarantine | tokens only; every send day |
| `/prospect-city <city>` | prospector → prospect-curator | Apify Maps sweep → curated CSV + batch doc in `docs/marketing/outreach/` | **~$0.45–1 Apify credits**; when queue runway < ~2 days |
| `/build-vertical <vertical>` | vertical-page-builder | New vertical page from the med-spa template, wired + build/lint/test green | large token spend; when a vertical is chosen |
| `/ops-check [deep]` | ops-watchdog | Prod smoke (incl. cron routes gated + alive) + tests + outreach stats + overdue nags; `deep` adds `npm run build` | tokens only; any time |
| *(cron, not a skill)* `app/api/cron/outreach-send` | — | Sends due follow-ups then new cold, within `OUTREACH_DAILY_SEND_CAP`, gated by `lib/outreach-qa.ts` | runs on `vercel.json`'s schedule |
| *(cron, not a skill)* `app/api/cron/warm-scan` | — | Polls the mailbox (Graph) for replies; flips `warm`/`unsubscribed`, stops the cadence, alerts the founder | runs on `vercel.json`'s schedule |
| *(cron, not a skill)* `app/api/cron/digest` | — | Nightly founder email: sent/due/queue/quarantine summary | runs on `vercel.json`'s schedule |

After a curated CSV lands (from `/prospect-city` or hand-curated), push it into the
cloud queue the send cron reads from:
`node --env-file=.env.local tools/ingest-prospects.mjs --file <csv>`.

## What stays founder-gated (by design)

1. **Deploying** — commit/push + `vercel --prod --scope sparkcreativesinc`. Neither
   the Claude Code swarm nor the autonomous cron ever deploys.
2. **Spending beyond stated caps** — the send cap, the automated QA gate, and (once
   built) the Apify daily cap are all in code; raising any of them is a founder
   decision, not something an agent or the cron does on its own.
3. **Marking contact statuses by hand** (`--mark`/`set-status`) — only on explicit
   instruction. Autonomous status changes (`warm`, `unsubscribed`, `bounced`) are
   handled by the cron/webhooks, not by any agent.
4. **The founder-gated setup prereqs for the cutover itself** — see CLAUDE.md §2
   and `tasks.md`: the dedicated sending subdomain, `RESEND_WEBHOOK_SECRET`
   registration, the Azure AD app registration for Graph `Mail.Read`, and all the
   new Vercel prod env vars. Until these are done, the cron routes exist in code
   but either 503/no-op or aren't yet scheduled in a deployed `vercel.json`.

**No longer founder-gated:** sending itself (cold + follow-ups), within the coded
daily cap and QA gate — that was the entire point of this cutover.

## Standing guardrails baked into every agent (and now into the send code itself)

No fake testimonials/clients/details; no guaranteed-ranking or guaranteed-citation
language; no hype buzzwords. The honesty rules are enforced twice now: by every
agent's instructions, AND by `lib/outreach-qa.ts` at send time (belt-and-suspenders
— the code doesn't trust that an agent reviewed the email, because for autonomous
sends none did). Leads CSVs and previews in `docs/marketing/outreach/` remain
gitignored PII that exist only on this machine; the cloud prospect queue
(`pq:*` in Redis, `lib/prospect-queue.ts`) is the cloud-visible counterpart the
cron actually reads from.

## Extending the swarm

- New vertical batch recipe (city or vertical): edit `prospector.md` search terms.
- New health checks: add to `ops-watchdog.md`'s checklists.
- New autonomous-engine safety checks: add to `lib/outreach-qa.ts` (the check
  itself) AND `docs/playbooks/outreach-review.md` (the human-readable spec) —
  keep them in sync.
- Recurring scheduling for the **Claude Code swarm** itself (as opposed to the
  outreach engine, which already runs on Vercel cron): the `/schedule` skill can
  cron `/swarm`, but a scheduled cloud agent runs without this Mac's
  `.env.local`/Apify/M365 connections — fine for read-only audits, not for
  prospecting. Revisit if those secrets move to a shared vault.
- Agent definitions are only loaded at session start: after editing
  `.claude/agents/*.md`, new sessions pick them up; within an old session, fall
  back to `general-purpose` with the agent file's contents prepended to the prompt
  (each skill documents this).
