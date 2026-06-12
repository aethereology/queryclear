# Decisions Log — queryclear

Append-only record of meaningful decisions. Newest first.
Format: date · decision · rationale · status.

---

## 2026-06-11 · Repositioning: "Modern SEO for the AI search era"
- **Decision:** Sitewide reframe away from "GEO is the next layer on top of SEO"
  and llms.txt-as-headline-feature, to "Modern SEO for the AI search era." llms.txt
  is demoted everywhere to an optional supplemental file (not required, not a
  ranking factor). Free offer renamed **"free AI Search Snapshot"** ("audit" is now
  exclusively the paid product). Multi-engine framing (ChatGPT/Claude/Perplexity/
  Gemini) retained. The site does NOT cite Google's guidance by name — we align
  quietly; honesty comes from what we don't claim.
- **Rationale:** Google published official guidance on generative AI features in
  Search stating GEO/AEO is just SEO, llms.txt and special AI files are not needed,
  and no special schema is required. Our old framing was on the wrong side of that
  document, and prospects can find it. CEO (Pedro) brief 2026-06-11; founder
  approved. Also fixes free-audit/paid-audit name cannibalization.
- **Status:** Adopted (supersedes the "next layer" positioning everywhere).

## 2026-06-11 · Pricing: audit $497 flat; public offer ladder
- **Decision:** Paid AI Search Audit is **$497** (was "starting at $750"). Public
  four-tier ladder on the site: Free Snapshot → AI Search Audit $497 → Website
  Upgrade from $2,500 → Modern Search Website Build from $6,500. "From" prices are
  floors; scopes confirmed in writing.
- **Rationale:** CEO brief: lower-friction paid diagnostic plus visible upgrade
  anchors sells the main offer (Website Upgrade). Founder approved 2026-06-11.
- **Status:** Adopted (supersedes GATE-PRICING "starting at $750" and the
  prices-stay-private rule).

## 2026-06-11 · Brand: drop Aethelo from public copy/schema
- **Decision:** All public copy and JSON-LD now say "queryclear is a SparkCreatives
  Inc. brand" (parentOrgUrl → https://sparkcreativesinc.org). Aethelo no longer
  appears on the public site. Internal docs keep historical references.
- **Rationale:** One fewer unknown name for a prospect to parse; SparkCreatives is
  the real registered entity. CEO brief; founder approved 2026-06-11. (Amends the
  2026-05-29 "Aethelo is the company" decision's public-facing expression only —
  org structure itself is unchanged.)
- **Status:** Adopted.

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
