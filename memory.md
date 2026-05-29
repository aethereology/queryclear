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

2026-05-29 — Phase 1 MVP BUILT on branch `phase1-mvp`. Next.js 16 + React 19 +
Tailwind v4. Landing page (hero w/ human/machine-view motif, problem, solution,
what-we-build, how-it-works, deliverables, FAQ, lead-form CTA), sample audit page
(/audit, Brightleaf demo), GEO infra (llms.txt, sitemap.xml, robots.txt, JSON-LD
Organization/WebSite/Service/FAQPage), accessible lead form → /api/lead (logs
only; delivery not yet wired). `npm run build` green, 0 console errors, verified
in browser. Design: Fraunces + IBM Plex Sans/Mono, paper/pine/lime palette.
NOT yet done: lead delivery (Resend/Formspree), deploy to Vercel, merge to main.
