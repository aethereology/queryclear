# Decisions Log — queryclear

Append-only record of meaningful decisions. Newest first.
Format: date · decision · rationale · status.

---

## 2026-06-03 · Closed the three roadmap decision gates
- **GATE-CANONICAL → www.** Canonical domain is `https://www.queryclear.com`; apex
  redirects to www (already the live behavior). Action: set `site.url` to the www
  form so code matches production. *Rationale:* least work (matches live), no SEO
  difference at this size. **Status: Closed.**
- **GATE-MODEL → audit-first; $97 kit deferred.** Primary motion stays the GEO audit
  → build → Aethelo ladder. The $97 "Local AI Visibility Stack" is only a demand
  test (landing page + waitlist, BUILD_QUEUE T14); the actual product is not built
  until that test shows real demand. *Rationale:* local owners buy done-for-you, not
  self-serve kits; validate before building supply. **Status: Closed.**
- **GATE-PRICING → "starting at $750".** Public site shows the audit entry price as
  "starting at $750"; build/upgrade and any product prices stay private for now.
  *Rationale:* a concrete entry number converts skeptical owners better than
  "contact us" while keeping upside flexible. **Status: Closed.**

---

## 2026-05-29 · Stack = Next.js (App Router) + Tailwind + shadcn/ui on Vercel
- **Decision:** Build queryclear on Next.js App Router + Tailwind + shadcn/ui,
  deploy on Vercel. (Founder raised SvelteKit; CTO call after delegation.)
- **Rationale:** Revenue-first stage → AI-build velocity is the binding
  constraint, and the loaded tooling here is React/Next/Vercel-weighted (shadcn,
  Vercel skills). shadcn/ui = fast accessible UI (which we sell). Matches the
  SparkCreatives stack. GEO needs (metadata/schema/llms.txt/sitemap/robots) fully
  met via route handlers + Metadata API. SvelteKit's leaner output judged
  marginal for a site this simple; revisit if a future project is perf-critical.
- **Status:** Adopted.

## 2026-05-29 · Build the audit-first MVP before anything else
- **Decision:** Phase 1 = landing page + lead form + one real sample GEO audit. Nothing else.
- **Rationale:** Smallest sellable thing. The sample audit IS the sales pitch.
- **Status:** Adopted.

## 2026-05-29 · Lead with the GEO audit for local business owners
- **Decision:** First revenue target = local/SMB owner buying a low-friction GEO
  audit (~$750–1.5k), not a custom automation buyer.
- **Rationale:** Sharp fear-shaped pain, fast yes, fast to deliver and get paid.
  Automation is the upsell after trust + cash flow. (See money ladder in start_here.md.)
- **Status:** Adopted.

## 2026-05-29 · Aethelo is the company; queryclear is its first product
- **Decision:** Aethelo (AI automation, everything) at `aethelo.sparkcreativesinc.org`
  is the parent brand. queryclear.com is the first productized service under it.
  SparkCreatives Inc. is the parent org/entity.
- **Rationale:** Founder's core identity is Aethelo; queryclear domain already
  purchased; structure consolidates the scatter instead of adding a 4th brand.
- **Status:** Adopted.

## 2026-05-29 · Fixed the git root (home dir was a live repo)
- **Decision:** Renamed `C:/Users/kylel/.git` → `.git.aethelo-backup`; stood up
  queryclear as its own repo in `Documents/Claude/Projects/queryclear`.
- **Rationale:** Home-dir repo risked committing `.ssh` keys / `.claude.json`
  tokens. Aethelo work was unpushed, so preserved (not deleted).
- **Status:** Done. Follow-up: properly re-home the Aethelo work into its own repo.

---

## Open decisions (need founder input)

- **queryclear color palette** — own identity, distinct from Aethelo orange/teal. TBD.
- **Pricing** — bands proposed in `product_spec.md`; confirm before publishing.
