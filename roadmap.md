# Roadmap — queryclear (canonical)

> This is the single source of truth for sequence and strategy. It reconciles the
> earlier lean roadmap, the larger uploaded "website roadmap", and the $97-product
> discussion. The executable task cards live in `docs/build/BUILD_QUEUE.md`.
> Read `CLAUDE.md` first.

---

## The thesis (don't lose this)

queryclear's edge is the intersection of **modern SEO for the AI search era
(GEO = part of SEO, not a separate discipline) + local-service-business
reality + operator execution**. The site's job is to (1) make that credible to a
skeptical local business owner, and (2) feed the money ladder
(public ladder repositioned 2026-06-11 — see `Decisions.md`):

> **free AI Search Audit (`/free-audit`, lead)** → **paid AI Search Audit ($497)**
> → **Website Upgrade (from $2,500) / Build (from $6,500)**
> → **Aethelo automation (internal upsell — not public-facing)**.

The site itself is the proof asset — it must be a flawless example of a modern,
AI-search-ready site.

**Two tracks as of 2026-06-15 (see `Decisions.md`).** The ladder above is the
**local / done-for-you** track. A second, recurring **AI Search Operator** track —
the agentic offering for **B2B SaaS**, powered by the separate `queryclearagent`
product — now launches as a founder-led **early-access / design-partner** program
(`/ai-search-operator`). It is sold Review-mode / human-approved / staging-first;
Auto-publish & Autopilot are roadmap and gated on `queryclearagent` Phase 1
(live-site writes, multi-domain, brand-safety guardrails). The local track is
unchanged and keeps running alongside it.

## Strategy notes carried from review (read before Phase 3+)

- **Build demand before supply.** Don't build a large product catalog before
  someone pays. The highest-leverage early assets are *trust* (about/contact/legal)
  and *proof* (sample audit + methodology), not 15 landing pages.
- **The $97 kit is a funnel/qualifier, not the business.** Local owners are the
  worst buyers for a self-serve DIY product; they buy done-for-you. Treat a cheap
  product as bait that surfaces warm leads for the $497 audit → upgrade work — and validate it with
  a landing-page/waitlist test *before* building the actual kit.
- **Avoid thin duplicate pages.** Category and vertical pages must each be
  meaningfully different and genuinely useful, or they hurt us (we sell the opposite).

---

## Decision gates (FOUNDER must close these; Claude Code must not guess)

These forks change *what* gets built. If a gate is open, do not build past it.
**All three closed 2026-06-03 — see `Decisions.md`.**

- **GATE-CANONICAL** — ✅ CLOSED → **www**. Canonical is `https://www.queryclear.com`
  (apex redirects to www, already live). Action: set `site.url` to the www form. (T0)
- **GATE-MODEL** — ✅ CLOSED → **audit-first; $97 kit deferred**. The kit is only a
  demand test (T14 landing page + waitlist); product build waits on validation.
- **GATE-PRICING** — ✅ CLOSED, then **SUPERSEDED 2026-06-11** → audit is **$497
  flat** with a public four-tier offer ladder (free AI Search Audit `/free-audit` /
  Audit $497 / Upgrade from $2,500 / Build from $6,500). The old "starting at $750,
  other prices private" rule is retired. See `Decisions.md` 2026-06-11.

---

## Phases

Each phase ends with something sellable or usable. Build top-to-bottom; don't skip
ahead. Task IDs (Tn) map to cards in `docs/build/BUILD_QUEUE.md`.

### Phase 0 — Foundation ✅ (done)
Clean repo, strategy, docs, stack locked, **MVP built and LIVE** (landing + sample
audit + lead flow + SEO/AI-search infra). See `CLAUDE.md` §2 for current state.

### Phase 1 — Credibility & trust  *(do this first)*
**Goal:** a skeptical owner can see who's behind this and trust it before we send traffic.
- T0  Resolve GATE-CANONICAL + make `site.url` correct (unblocks everything)
- T1  `/about` (entity trust; SparkCreatives Inc. relationship — Aethelo dropped
      from public copy 2026-06-11)
- T2  `/contact` (real contact path + form)
- T3  `/privacy` and `/terms` (data use + no-guarantee language)
- T4  Footer + nav links to all of the above; persistent free-audit CTA (`/free-audit`)
**Exit:** footer-complete site; every page reachable; trust signals present.

### Phase 2 — Proof & methodology  *(highest sales leverage)*
**Goal:** make the offer tangible and feel proprietary.
- T5  `/ai-visibility-stack` — the named framework (the 7 layers). Linkable sales asset.
- T6  Promote the sample audit: keep `/audit` working, ensure it reads as a sendable
      proof page (clear fictional label, score format, prioritized fixes, CTA).
- T7  `/ai-visibility-audit` — commercial landing page for audit search intent;
      links to the sample audit and the stack.
**Exit:** we can send a prospect a methodology page + a sample audit + an audit
landing page that all reinforce each other.

### Phase 3 — Category / intent pages  *(SEO+GEO surface area; build only what's distinct)*
Build in this order; each must be genuinely useful, not boilerplate:
- T8  `/local-ai-search-optimization`
- T9  `/geo-audit`
- T10 `/ai-search-ready-website`
- T11 `/schema-for-ai-search`
- T12 `/llms-txt-for-businesses` (stay credible: llms.txt is an **optional
      supplemental file** — not required, not a ranking factor, not a substitute
      for content; framing per the 2026-06-11 repositioning)
**Exit:** ≥10 strong indexable pages; core query clusters covered.

### Phase 4 — Technical AI/search hardening  *(can run in parallel with 1–3)*
Per-page metadata + canonical tags, BreadcrumbList/WebPage schema, OG image,
custom 404, Search Console + Bing Webmaster, sitemap/llms.txt kept in sync, Core
Web Vitals + a11y audit. Tracked as T13 (a recurring checklist card).
**Exit:** every page passes `test_plan.md`; both webmaster tools configured.

### Phase 5 — Productization  *(BLOCKED by GATE-MODEL — except the T14 demand test)*
Only after the audit motion is proven. Likely order:
- T14 `/stack-kit` **offer test page** ▣ in progress (2026-06-05) — "The Local AI
      Visibility Stack" via a **Stripe refundable $97 pre-order** to measure demand.
      Built *before* the product. Design:
      `docs/superpowers/specs/2026-06-05-stack-kit-offer-test-design.md`.
- T15 Free AI-visibility scorecard (the 100-pt rubric) as a lightweight tool/form.
- T16 Paid audit report template (productize what we deliver by hand first).
- T17 DIY kit contents — *only if T14 shows real demand.*
**Exit:** at least one validated paid product; site no longer depends only on inquiries.

### Phase 6 — Vertical depth  *(after one vertical proves out)*
Do **one** vertical deeply first (med spa — we have the most knowledge there), prove
it converts, then template the rest (aesthetician, spa, salon, dentist, home service).
Tracked as T18+. No thin duplicates.

### Phase 7 — Aethelo automation expansion
Upsell path from queryclear clients into Aethelo automation systems. Out of scope
until queryclear has paying clients asking for more. Internal strategy only —
Aethelo does not appear in public copy/schema (Decisions.md 2026-06-11).

---

## Explicitly NOT now
No SaaS app, dashboard, client login, billing platform, or partner/affiliate program
until a client is paying and asking. No $99/mo "Monitor" product or partner license
until the core audit→build motion is repeatable. Service business first.

## Definition of done (whole project)
Homepage explains the offer in <5s · ≥10 high-quality indexable pages · public sample
audit · visible proprietary framework · audit funnel works end-to-end · About/Contact/
Privacy/Terms present · sitemap+robots+llms.txt live and in sync · Search Console +
Bing configured · every page has schema/metadata/internal links/CTA · zero guarantee
language · queryclear usable as its own proof asset · ≥1 validated paid product.
