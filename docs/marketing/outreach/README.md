# Outreach workflow

This directory holds the outreach CSVs and batch documentation for queryclear.

## Purpose

- `leads/` stores gitignored prospect CSVs used by the outreach CLI.
- `previews/` stores rendered email previews produced by `tools/outreach-audit.mjs`.
- Batch docs record sourcing, curation, and send instructions.

## Current process

1) Discover leads using Agent-Reach and/or prospect curation.
2) Convert raw discovery output into `docs/marketing/outreach/leads/<YYYY-MM-DD>-<vertical>-<city>.csv`.
   - Header must be: `business_name,website,email,city`
   - Quote fields containing commas.
3) Preview the batch locally:

```powershell
node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/<your-list>.csv --limit 10
```

4) Review the generated HTML in `docs/marketing/outreach/previews/`.
   - Validate business name, domain, and email content.
   - Ensure the email is honest, personalized, and not overpromising.

5) Send the reviewed batch:

```powershell
node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/<your-list>.csv --limit 10 --send
```

6) Use the due queue for follow-ups:

```powershell
node --env-file=.env.local tools/outreach-audit.mjs due
```

## Agent-Reach integration

Use the `tools/agent_reach/USAGE.md` guide to set up Agent-Reach and convert raw discoveries into outreach CSV format.

## Notes

- This repo uses Resend for sending outbound emails via the current `app/api/outreach` route.
- Email verification is intentionally disabled for the current workflow.
- The CSV directory is gitignored because it contains PII.
