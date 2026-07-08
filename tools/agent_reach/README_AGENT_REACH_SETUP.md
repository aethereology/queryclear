Agent-Reach integration and setup for queryclear

1) Clone the Agent-Reach repo

```powershell
git clone https://github.com/Panniantong/Agent-Reach.git agent-reach
cd agent-reach
```

2) Create Python virtualenv and install

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3) Copy config files into the Agent-Reach working directory

```powershell
cp ..\queryclear\tools\agent_reach\*.yml .\configs\
cp ..\queryclear\tools\agent_reach\.env.template .env
```

4) Optional: if you want to use Resend for send-only outreach, keep the current queryclear
   app and use `tools/outreach-audit.mjs` + `app/api/outreach`. Agent-Reach can be used for discovery and
   auditing while Resend handles sending.

5) Populate `.env` with API keys (see `.env.template`).

6) Run discovery pipeline (example)

From this project root copy the `tools/agent_reach` templates into the agent-reach config folder. Example:

```powershell
cp ..\queryclear\tools\agent_reach\*.yml .\configs\
cp ..\queryclear\tools\agent_reach\.env.template .env
```

4) Populate `.env` with API keys (see `.env.template`).

5) Run discovery pipeline (example)

```powershell
python run.py --pipeline discover --config configs/medspa.yml
```

6) Output: verified leads CSV in `outputs/` and draft messages saved to `outputs/messages/`.

Notes:
- Agent-Reach may require Node/Playwright for LinkedIn scraping — follow its README.
- Ensure legal/compliance review before running broad crawls. Respect robots.txt.
