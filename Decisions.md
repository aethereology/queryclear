# Decisions Log — queryclear

Append-only record of meaningful decisions. Newest first.
Format: date · decision · rationale · status.

---

## 2026-06-23 · Local funnel redesign: Discovery Sprint + recurring Care Plan; retire the public $97 kit
- **Decision:** Redesign the local/service funnel for velocity and recurrence, as one
  coherent ladder: **Free audit (`/free-audit`) → Paid Discovery Sprint ($497, credited
  toward the upgrade) → Website Upgrade (from $2,500, now includes the Stack kit free) →
  AI Search Care Plan ($997/mo, recurring).** Three moves:
  1. **Reposition the $497 audit as a "Paid Discovery Sprint."** Same self-serve Stripe
     one-time checkout, reframed around two honest levers: it's delivered as a **live
     walkthrough**, and the **$497 is credited in full toward a Website Upgrade** if the
     client proceeds. Copy-only on `/ai-visibility-audit` + its success page + the order
     email; no billing-path change.
  2. **Launch the AI Search Care Plan — queryclear's first SUBSCRIPTION product** ($997/mo,
     `subscription`-mode Stripe Checkout). Human-delivered monthly retainer for the local
     track: a monthly re-audit, up to two content/schema updates, and a measured score +
     AI-citation watch. New `/care-plan` + success page, `carePlan` config block, a
     `care-plan` checkout branch, `renderCarePlanOrderEmail`, webhook dispatch, and a new
     `LeadForm` interest option. Distinct from the agentic B2B `operator` (this is
     human-delivered, local, self-serve).
  3. **Retire the public $97 DIY kit** (ends the T14 demand test). Its contents are now a
     **free bonus bundled with every Website Upgrade**. `/stack-kit` is noindexed, removed
     from nav/sitemap/llms.txt, and reframed to "included with every Upgrade" (the
     standalone pre-order CTA is gone). The `/api/checkout` `stack-kit` branch + tests are
     left intact (no public path reaches them) to avoid touching green billing code.
- **Rationale:** The local track had **zero recurring revenue** — the single biggest hole
  in the model (a client paid once and vanished; the operator MRR was B2B-SaaS-only). The
  Care Plan adds local MRR; the Sprint's credit mechanic raises audit→upgrade conversion
  honestly; the kit-as-bonus stops a $97 SKU from anchoring value below the $2,500 offer.
  Derived from a founder-reviewed triage of two pasted "monetization" docs — the honest
  funnel mechanics were kept; the dishonest tactics (fabricated competitor data, outcome
  guarantees, fake urgency, dark-pattern auto-billing, affiliate kickbacks, fear/hype copy)
  were explicitly rejected.
- **Honesty constraint (binding):** no outcome guarantees anywhere; the Sprint credit is a
  real, plainly-stated discount (no fake "expires on the call" urgency); the Care Plan is
  "$997/month, cancel anytime, no contract" and reports only **measured** data ("we report
  what we measure" — never "your score will improve"); any "first month free" is a
  sales-time Stripe coupon, disclosed, not a default dark-pattern trial.
- **Breaks the 2026-06-18 sell-only code freeze — deliberately.** Founder judged the MRR
  upside worth the build and authorized "full build including Stripe plumbing" on 2026-06-23.
- **Status:** Code-complete and verified on Windows 2026-06-23 (build = 38 routes incl.
  `/care-plan` + success, lint clean, **83/83** tests). **Founder-gated:** register/confirm
  the Stripe webhook endpoint in the Dashboard (new product reuses the same endpoint — no
  new env vars; price is inline via `price_data`), a Stripe test-mode subscription smoke,
  set final Care Plan price/name in `lib/site.ts` if different from $997 / "AI Search Care
  Plan", then commit/push + `vercel --prod --scope sparkcreativesinc`. Amends the
  2026-06-11 pricing ADR (the $497 rung is now framed as a credited Sprint) and the T14
  kit demand test (closed: kit is now an Upgrade bonus, not a public SKU).

---

## 2026-06-17 · Retire the manual "AI Search Snapshot"; `/free-audit` is the free top-of-funnel
- **Decision:** The manual, human-delivered **"AI Search Snapshot"** free offer is
  **retired**. The free top-of-funnel is now the automated, instant, read-only
  **AI Search Audit at `/free-audit`** (the public lead magnet backed by the
  `agent-runtime` Python audit; Upstash Redis rate-limit + daily spend cap; Resend
  email gate that captures the free-tier lead). Sitewide free CTAs become plain links
  to `/free-audit`; the `SnapshotCta` overlay (component name kept) is repurposed as
  the higher-intent **"edit / rebuild my website" inquiry**, used only by the homepage
  **Website Upgrade / Build** offers. The four-tier ladder is unchanged in shape, only
  its free rung: **Free AI Search Audit (`/free-audit`) → Audit $497 → Upgrade from
  $2,500 → Build from $6,500.** Additionally, the unlocked report and a new
  prospect-facing email now carry the three paid-offer CTAs (monetizing the unlock).
- **Rationale:** The automated `/free-audit` shipped and proved out, making the manual
  Snapshot redundant and slower. Folding the free tier into the instant tool removes
  the free-audit/Snapshot naming split, captures the lead automatically (email + domain),
  reframes the lead form for genuinely higher-intent work, and turns the unlock — peak
  intent — into a monetization moment. Founder directed the full retirement + the
  unlock-monetization 2026-06-17.
- **Honesty constraint (binding):** the `/free-audit` tool is an instant, read-only
  read with engine-visibility results shown as modeled estimates (clearly marked); the
  **$497** audit must always be framed as *adding* depth (full prompt testing, scoring,
  prioritized roadmap), never as paying for what was just received free. No guaranteed
  rankings/citations. Reframed emails drop any "we'll review and email you in a couple
  days" language (the free read is immediate).
- **Status:** Adopted and **SHIPPED** to prod 2026-06-17 (commits f4e7e36 + c300757).
  Amends the 2026-06-11 pricing ADR (the "Free Snapshot" rung is now the automated
  `/free-audit`) and supersedes the 2026-06-12 "use `SnapshotCta` for every free CTA"
  guideline (free CTAs are now plain `/free-audit` links).

## 2026-06-15 · Two-track reposition: add the agentic "AI Search Operator"
- **Decision:** queryclear now runs **two tracks**, not one. (1) The existing
  **done-for-you local/service track** (Snapshot → $497 audit → Upgrade → Build)
  is unchanged. (2) A new **AI Search Operator** track — the recurring, agentic
  offering for **B2B SaaS** teams, powered by the separate `queryclearagent`
  product (the autonomous SEO/AEO/GEO operator). The operator launches as a
  founder-led **early-access / design-partner program**, sold now, delivered with
  a human in the loop while the autonomous loop hardens. New page
  `/ai-search-operator`; homepage gains a two-track band; lead form gains an
  "AI Search Operator (early access)" interest. No public monthly price yet.
- **Rationale:** The audit/report is commoditized; the defensible product is the
  *operator that does the work* ("Searchable tells your team what to do; QueryClear
  does it"). The founder has declared `queryclearagent` the real pivot. We sell the
  operator now to build the right (B2B SaaS) pipeline and recruit design partners,
  without abandoning the local cash flow. Founder approved 2026-06-15.
- **Honesty constraint (binding):** The agent is at M0 — **Review mode, staging/
  draft only**. Public copy MUST lead with "agent proposes, human approves," frame
  Auto-publish/Autopilot as roadmap, and use "early access," never "fully
  autonomous, live today." No guaranteed rankings/citations. The agent is NOT yet
  wired into the live site — early-access delivery is concierge. Live-site autonomy
  is gated on `queryclearagent` Phase 1 (live-writes, multi-domain, guardrails).
- **Status:** Adopted. Amends the single-track local-service framing in
  `product_spec.md` / `roadmap.md` (the local track persists alongside the new one).

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
