# Decisions Log — queryclear

Append-only record of meaningful decisions. Newest first.
Format: date · decision · rationale · status.

---

## 2026-07-20 · Automatic lead sourcing (Apify REST, replacing the empty-queue gap)
- **Decision:** After shipping autonomous sending (below), the founder asked "how
  will you find leads?" — the new cloud prospect queue was empty. Rather than
  just seeding it once and calling it done, the founder chose to also build
  automatic ongoing sourcing now: two new once-daily crons
  (`prospect-topup`/`prospect-ingest`) that run an Apify Google-Maps scrape
  when the queue runs low, curate the results with the same rules the
  `prospect-curator` agent uses (now deterministic code), and refill the queue
  — closing the loop without a human running `/prospect-city` by hand.
- **Immediate seed, separate from automation:** pushed the two already-curated,
  ready CSVs (Fort Lauderdale 71, Georgia 17) into the live queue via the
  existing `tools/ingest-prospects.mjs` — 58 real prospects now queued. The
  other 5 local CSVs (raw/uncurated or different verticals) were explicitly
  left for a separate curation pass, not folded into this build.
- **Rationale:** the interactive `prospector` agent's Apify MCP connection
  cannot run inside a headless Vercel cron, so a real REST integration
  (`APIFY_TOKEN`, not MCP) was a genuinely new build, not a wrapper around
  something that already ran unattended. Verified the actor's real input field
  names against Apify's public docs first (`searchStringsArray`, not the
  originally-guessed `searches`) rather than assuming.
- **Guardrails preserved:** same daily-cap pattern as outreach sending (fails
  closed, no crash, no silent overspend); curation drops rather than guesses on
  anything ambiguous (no email, junk platform address, national chain, careers
  mailbox); dedupes by domain so franchise locations aren't conflated.
- **Status:** code shipped, verified (build 41 routes, lint clean, 141/141
  tests). **Founder-gated:** an `APIFY_TOKEN` from the Apify dashboard, then
  deploy. The two new crons no-op harmlessly without a token — sending isn't
  blocked on this, only auto-refill is.

## 2026-07-20 · Cold-outreach sending goes autonomous (Vercel cron, coded safety gates)
- **Decision:** Flip the cold-outreach engine from "assisted — the founder personally
  fires every send" to **fully autonomous within hard coded safety gates**, run as
  plain Vercel cron routes (not a scheduled Claude agent — a scheduled cloud agent
  would lack this Mac's secrets/CSVs; moving the send logic into the deployed app
  itself avoids that problem entirely). Founder locked four sub-decisions via
  AskUserQuestion: (1) fully autonomous sending, gated by a daily send cap and an
  automated QA gate rather than a human reviewing every email; (2) Vercel cron
  (cloud) runtime so it runs with the founder's PC off; (3) full Microsoft Graph
  reply detection for the warm-lead alert (not just report-opens); (4) a dedicated
  sending subdomain to protect the domain's transactional/`hello@` reputation, and
  expand sourcing to more verticals over time (Apify-driven auto-sourcing deferred
  to a later phase; today's queue is still fed from curated CSVs).
- **What shipped (code-complete, NOT deployed):** three new `CRON_SECRET`-gated
  cron routes (`app/api/cron/outreach-send`, `warm-scan`, `digest`; schedule in
  `vercel.json`); an automated pre-send QA gate (`lib/outreach-qa.ts`) that
  quarantines (never sends) anything failing honesty/compliance/deliverability
  checks; a hard atomic daily send cap (`OutreachStore.reserveSend`); a new
  terminal `warm` contact status set by Graph-based reply detection, which stops
  the autonomous cadence immediately and fires a rich founder alert with a
  one-paste draft reply; a Resend bounce/complaint webhook + one-click
  List-Unsubscribe (deliverability circuit-breakers that didn't exist before); and
  a cloud prospect queue (`lib/prospect-queue.ts`, Redis) replacing local CSVs as
  the cron's input, seeded via a new `ingest-prospects` action /
  `tools/ingest-prospects.mjs`. Every markdown guardrail that said "preview-only,
  founder fires every send" (`.claude/skills/swarm`, `.claude/skills/outreach-daily`,
  `.claude/agents/outreach-drafter.md`, `.claude/agents/ops-watchdog.md`,
  `docs/playbooks/outreach-review.md`, `docs/automation/SWARM.md`) was rewritten to
  reflect that agents now **audit** the autonomous engine and surface warm leads,
  rather than preparing batches for a human to fire.
- **Rationale:** the founder needs client acquisition to run without daily manual
  effort ("I don't want to have to run this every day"). The existing engine
  (prospector → curator → drafter → send, Redis-backed cadence) was already ~85%
  of this — the missing pieces were a scheduler, a daily cap, an automated QA
  gate to replace the human reviewer, and reply detection. The honesty/CAN-SPAM
  guardrails themselves are **preserved verbatim**, just enforced in code
  (`lib/outreach-qa.ts`) instead of a human/in-session-agent reading every email.
- **Guardrails preserved, non-negotiable:** no fake testimonials/guarantees/hype
  (CLAUDE.md §4); the estimate-vs-measured honesty rule in email rendering; the
  CAN-SPAM postal-address + opt-out requirement; per-recipient dedup.
- **Status:** code-complete, verified (build 39 routes, lint clean, 125/125 tests).
  **Founder-gated before going live:** a dedicated sending subdomain (Resend +
  Cloudflare SPF/DKIM/DMARC), an Azure AD app registration for Graph `Mail.Read`,
  the Resend webhook secret, new Vercel prod env vars (incl. a real
  `OUTREACH_POSTAL_ADDRESS`), commit/push + `vercel --prod`, and a conservative
  send-cap ramp (the domain's DMARC only reached `p=quarantine` on 2026-07-07).
  Full design: `C:\Users\kylel\.claude\plans\we-need-to-get-fancy-tower.md`.
- **Update, same day — shipped, with two real plan limits surfaced and resolved
  by founder choice rather than silently worked around:** (1) Resend's plan on
  this account allows only 1 domain (`queryclear.com` already uses it) — the
  dedicated-subdomain idea is deferred; shipped sending from the existing
  `audit@queryclear.com` instead, accepting the shared-reputation risk. (2)
  This Vercel team is on the Hobby plan, which only allows once-daily cron
  jobs — the original multi-tick-per-day `outreach-send`/`warm-scan` design was
  rejected outright on the first deploy attempt. Collapsed both to once/day;
  **the real consequence is reply-to-alert latency up to ~24h instead of the
  designed ~15 min.** Deployed: commit `ba679e0`, live in prod. Upgrading
  Resend and/or Vercel Pro later restores the original design.

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
