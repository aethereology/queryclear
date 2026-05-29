# Project Memory — queryclear (human-readable)

This file is updated at the end of every Claude Code session so future sessions can resume intelligently.

A running snapshot for humans. Complements (does not replace) the agent memory
in `~/.claude/.../memory/` which Aethos reads automatically each session.
Update the "Current state" line whenever it changes.

---

## Fixed facts

- **queryclear.com** = first product of **Aethelo** (the company), under
  **SparkCreatives Inc.** (parent 501(c)(3), EIN 33-4477854, FL reg CH79169).
- Aethelo lives at `aethelo.sparkcreativesinc.org`. queryclear has its own domain.
- Product = GEO / AI Search Optimization service. Sells readiness, not guarantees.
- First revenue target: local business owner buying a GEO audit (~$750–1.5k).
- Money ladder: audit → build → Aethelo automation.

## Repo facts

- This repo: `github.com/aethereology/queryclear`,
  local `Documents/Claude/Projects/queryclear`.
- Home dir `C:/Users/kylel` is no longer a git repo (was a leak risk).
  Old Aethelo repo preserved at `C:/Users/kylel/.git.aethelo-backup`
  (branches aethelov1/main @ f6e84959, unpushed). Re-home it later.

## People

- Founder = operator. Aethos = CEO/CTO/COO (assistant). Pedro = cofounder (Codex).

## Brand rules

- No fake testimonials/clients/reviews/ratings/certs. No invented business details.
  No guaranteed rankings/citations. Plain language, no hype buzzwords.

## Current state (update this line)

2026-05-29 — Phase 1 MVP BUILT + merged to `main` LOCALLY (4 commits ahead of
origin/main). Next.js 16 + React 19 + Tailwind v4. Landing page (hero H1 "Your
customers ask AI. We make sure it knows you." + human/machine-view motif, problem,
solution, what-we-build, how-it-works, deliverables, FAQ, lead-form CTA), sample
audit page (/audit, Brightleaf demo), GEO infra (llms.txt, sitemap.xml, robots.txt,
JSON-LD Organization/WebSite/Service/FAQPage). Lead form → /api/lead now emails via
Resend when RESEND_API_KEY set (always logs; see .env.example). Build green, 0
console errors, verified in browser. Design: Fraunces + IBM Plex, paper/pine/lime.

LAUNCHED 2026-05-29: LIVE at https://www.queryclear.com (apex queryclear.com 307→www).
Deployed on Vercel (team `sparkcreativesinc`, project `queryclear`, scope flag required
on CLI: --scope sparkcreativesinc). Deployment Protection disabled (public). Production
env set: RESEND_API_KEY, LEAD_TO=info@queryclear.com, LEAD_FROM="queryclear <info@queryclear.com>".
queryclear.com verified in Resend (sending enabled); DNS/nameservers on Cloudflare.
End-to-end lead form VERIFIED: submit → /api/lead → Resend → delivered to info@queryclear.com
(reply-to = lead's email). GitHub push works via gh credential override.
Tools installed: resend-cli (global), vercel CLI. info@queryclear.com receives via Cloudflare Email Routing.

OPEN POLISH: canonical mismatch — code declares apex (site.url=https://queryclear.com) but
live canonical is www. Decide: make apex primary in Vercel (www→apex) OR set site.url=www.
NOT yet done: resolve canonical, optional OG image, real audit prompt-runner tooling.
