# Agent-Reach usage for queryclear

This folder contains the queryclear-specific Agent-Reach configuration for lead discovery and audit-driven personalization.

## What it does
- Uses Agent-Reach for prospect discovery and website audit signal extraction.
- Does not require email verification for current outreach.
- Keeps Resend as the send provider through the existing `app/api/outreach` + `tools/outreach-audit.mjs` flow.

## Setup

1) Clone Agent-Reach and install dependencies:

```powershell
git clone https://github.com/Panniantong/Agent-Reach.git agent-reach
cd agent-reach
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2) Copy queryclear campaign configs into the Agent-Reach repo:

```powershell
cp ..\queryclear\tools\agent_reach\campaigns\*.yml .\configs\
cp ..\queryclear\tools\agent_reach\.env.template .env
```

3) Populate `agent-reach/.env` with your API keys.

- `GOOGLE_MAPS_API_KEY`: required for Google Maps discovery.
- `LINKEDIN_AUTH_COOKIE`: required for LinkedIn profile scraping.
- `FIRECRAWL_API_KEY`: optional, used when Firecrawl is available for additional industry lead discovery.
- `FIRECRAWL_API_URL`: optional endpoint used with Firecrawl.
- `EMAIL_VERIFY_ENABLED=false`: disables email verification for the current queryclear workflow.

4) Run a discovery campaign:

```powershell
python run.py --pipeline discover --config configs/medspa.yml
```

> The exact command may vary depending on the Agent-Reach version; follow its `README` if needed.

5) Convert the discovery JSON output into queryclear outreach CSV format:

```powershell
node ..\queryclear\tools\agent_reach\json_to_outreach_csv.mjs --input <raw-discovery.json> --output ..\queryclear\docs\marketing\outreach\leads\<YYYY-MM-DD>-<vertical>-<city>.csv
```

## Output and workflow

1) Export discovered leads from Agent-Reach into a CSV matching the `docs/marketing/outreach/leads/` format.
2) Use the existing queryclear send flow to preview and send via Resend:

```powershell
node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/<your-list>.csv --limit 10
```

3) After preview QA, send reviewed messages:

```powershell
node --env-file=.env.local tools/outreach-audit.mjs --file docs/marketing/outreach/leads/<your-list>.csv --limit 10 --send
```

4) Use the due queue for follow-ups:

```powershell
node --env-file=.env.local tools/outreach-audit.mjs due
```

## Notes

- This setup is intentionally split: Agent-Reach discovers and audits, `queryclear` sends using Resend.
- If you later want to enable email verification, set `EMAIL_VERIFY_ENABLED=true` and add an `EMAIL_VERIFY_API_KEY`.
- Always respect `robots.txt` and LinkedIn/Google terms of service.
