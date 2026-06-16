# CLAUDE.md — queryclear

> This file is auto-loaded by Claude Code. It is the orientation layer.
> Read it fully before doing anything, then open `roadmap.md` (strategy/sequence)
> and `docs/build/BUILD_QUEUE.md` (the executable task cards).
>
> The old brief `claude.md.txt` is kept for history but is NOT auto-loaded and is
> partly stale. This file supersedes it.

---

## 1. What this is (30 seconds)

**queryclear.com** — a productized **GEO / AI Search Optimization** service. We make
a business's website easier for search engines and AI answer engines (ChatGPT,
Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot) to **crawl,
understand, summarize, trust, and cite**.

We sell *readiness*, not outcomes. **Never** promise rankings or AI citations.

- **queryclear** = a **SparkCreatives Inc.** brand (real 501(c)(3), `sparkcreativesinc.org`).
  Internally it grew out of Aethelo, but Aethelo no longer appears in public
  copy/schema (decided 2026-06-11; see Decisions.md).
- Our own site IS our first case study, so it must be a flawless GEO example.
- **Two tracks (since 2026-06-15; see Decisions.md):** (1) the **done-for-you
  local/service track** (Snapshot → $497 audit → Upgrade → Build), and (2) the
  **AI Search Operator** — the recurring agentic offering for **B2B SaaS**, powered
  by the separate `queryclearagent` product, launched as a founder-led **early-access
  / design-partner program**. The operator is **Review-mode / human-approved /
  staging-first** today; market it honestly (no "fully autonomous, live" claims).

## 2. Ground-truth state (keep this section current)

> Last verified: 2026-06-15. If you change the site, update this section and
> `memory.md` at the end of your session.

- **LIVE** at https://www.queryclear.com (apex 307 → www). Deployed on Vercel
  (team `sparkcreativesinc`, project `queryclear`; CLI needs `--scope sparkcreativesinc`).
- **SHIPPED 2026-06-15 (commit a97f995, `vercel --prod`):** the **AI Search
  Operator** track (two-track reposition) and the **med-spa vertical** are now LIVE
  (`/ai-search-operator`, `/med-spa-ai-search-optimization`) — smoke-checked 200,
  correct copy ("Request early access" / "five founding partners", no "free Snapshot"
  leak), present in sitemap + llms.txt. The two detailed bullets immediately below
  were written pre-deploy ("NOT yet committed/deployed") — that status is now
  superseded by this line.
- **AI SEARCH OPERATOR / TWO-TRACK REPOSITION 2026-06-15 (code-complete, NOT yet
  committed/deployed):** new `app/ai-search-operator/page.tsx` — the agentic
  B2B-SaaS track (early access / design partners), powered by the `queryclearagent`
  product. Honest framing: agent proposes → human approves (Review mode),
  staging-first, Auto-publish/Autopilot are roadmap. Has its own embedded
  early-access lead form (NOT the Snapshot overlay — different ask); `LeadForm`
  gained an "AI Search Operator (early access)" interest option; `lib/site.ts`
  gained an `operator` config block. Homepage (`app/page.tsx`) gained a two-track
  band after the hero (done-for-you vs. operator). Wired into `lib/navigation.ts`
  (new "Operate" group → mega-menu + footer), `app/sitemap.ts`, `app/llms.txt`.
  WebPage+Service+FAQPage+BreadcrumbList JSON-LD. The local ladder + all existing
  pages are unchanged. **Founder-gated:** commit/push + `vercel --prod`.
- **MED-SPA VERTICAL 2026-06-15 (code-complete, NOT yet committed/deployed):**
  Phase 6 first deep vertical — new `app/med-spa-ai-search-optimization/page.tsx`,
  built from the `local-ai-search-optimization` pattern (Header/Footer/Container/
  MonoLabel/Cta/SnapshotCta/Stagger/Accordion) but med-spa-specific (treatment-
  intent queries, the 7 layers read through a med-spa lens, per-treatment fixes,
  links the Goldleaf `/audit` sample as proof). WebPage+Service+FAQPage+
  BreadcrumbList JSON-LD; Snapshot CTA top+bottom; no new deps/components/medical
  schema. Wired into `lib/navigation.ts` serviceColumns "Improve" (auto-adds to
  header mega-menu + footer), `app/sitemap.ts`, `app/llms.txt/route.ts`; the
  `local-ai-search-optimization` page now cross-links to it. Verified on Windows:
  build ✅ 30 routes (page prerenders static), lint ✅ clean, test ✅ 52/52;
  prerendered HTML confirmed to carry the h1, canonical, title, and all four
  JSON-LD types. **Founder-gated:** commit/push + `vercel --prod --scope
  sparkcreativesinc` is a separate go.
- **SNAPSHOT OVERLAY 2026-06-12 (code-complete, NOT yet committed/deployed):**
  every free-Snapshot CTA sitewide (incl. the /audit sample-report bottom CTA in
  `AuditReport.tsx` — sample variant only; private client reports keep their
  own CTAs) now morphs into a full-screen pine lead-form
  overlay via the new `components/SnapshotCta.tsx` (bespoke motion/react
  `layoutId` morph, portaled to body, sharp corners — NOT Cult UI/shadcn; no new
  deps). Triggers remain real `<a href>` anchors as SEO/no-JS fallback and the
  embedded `#audit-cta` form sections were kept. Offer-ladder Snapshot/Upgrade/
  Build buttons preselect the form's "What do you need?" via `LeadForm`'s new
  `defaultNeed` prop + `need` field on `site.offers`; the $497 Audit button
  (`need: null`) still navigates to /ai-visibility-audit. `site.primaryCta.href`
  is now `/#audit-cta` (root-relative; all `` `/${...}` `` concats removed).
  LeadForm ids are `useId`-prefixed (overlay + embedded form can coexist).
  Verified: lint clean, 52/52 tests (new `tests/snapshot-overlay.test.mjs`),
  build 29 routes, Playwright a11y pass (dialog/Escape/focus-return/Tab-trap/
  scroll-lock/ctrl-click-new-tab). **When adding any future snapshot CTA, use
  `SnapshotCta`, not `Cta`/`Link`.**
- **REPOSITIONED 2026-06-11 — DEPLOYED TO PROD same day** (commit b312cb8,
  `vercel --prod`; prod smoke-checked: $497 + Snapshot live on /, zero stale
  Aethelo/$750 strings, /thank-you 200 + noindex + not in sitemap, /audit
  prerenders 33): sitewide reframe
  to **"Modern SEO for the AI search era"** after Google's official generative-AI
  guidance (GEO=SEO; llms.txt not needed for Google). Free offer renamed **"free
  AI Search Snapshot"** (the "audit" is now exclusively the paid product, **$497**
  flat). Public offer ladder: Snapshot free → Audit $497 → Upgrade from $2,500 →
  Build from $6,500 (in `site.offers`). llms.txt demoted everywhere to "optional
  supplemental file". Aethelo dropped from all public copy/schema → "queryclear is
  a SparkCreatives Inc. brand" (parentOrgUrl = sparkcreativesinc.org). **No Google
  citations in site copy** — we align quietly. New `/thank-you` route (noindex,
  deliberately NOT in sitemap/llms.txt; LeadForm now redirects there on success).
  **CountUp SSR bug fixed:** score figures used to render `0` in static HTML
  (scrapers saw "0/100" on /audit — how the CEO caught it); `CountUp` now
  server-renders the real value and animates 0→to only after hydration. Verified
  2026-06-11: lint clean, 45/45 tests, build = 29 routes, prerendered /audit shows
  33/86, zero stale strings ($750/Aethelo/"next layer"/"free AI search audit") in
  built output. See Decisions.md 2026-06-11 (three ADRs).
  **Docs cohesion pass 2026-06-12:** all living .md docs (roadmap, product_spec,
  UI_direction, readme, start_here, tasks, BUILD_QUEUE, page-template,
  running-an-audit SOP, stack-kit-demand-test, seed_data) updated to match the
  repositioning — $497/Snapshot/ladder/SparkCreatives/llms.txt-optional.
  Historical artifacts (Decisions.md, claude.md.txt, docs/superpowers/*) left
  as dated records by design.
- **Stack:** Next.js 16 (App Router) + React 19 + Tailwind v4. Fonts: Bricolage
  Grotesque + IBM Plex Sans/Mono. Palette: paper / pine / lime.
- **Routes that exist today:**
  - `app/page.tsx` — landing page (hero, problem, solution, what-we-build,
    how-it-works, deliverables, FAQ, **offer ladder**, lead form)
  - `app/thank-you/page.tsx` — post-conversion success page (2026-06-11; noindex,
    excluded from sitemap + llms.txt by design)
  - `app/audit/page.tsx` — public sample audit (fictional "Goldleaf Aesthetics"
    med-spa demo). As of T16 (2026-06-06) it is data-driven: renders the
    `<AuditReport>` template from `lib/reports/goldleaf-demo.ts` (output unchanged).
  - `app/about/page.tsx` — entity-trust About page (T1, 2026-06-03)
  - `app/contact/page.tsx` — contact + lead form (T2, 2026-06-03)
  - `app/privacy/page.tsx`, `app/terms/page.tsx` — legal pages (T3, 2026-06-03)
  - `app/ai-visibility-stack/page.tsx` — the 7-layer method page (T5, 2026-06-03)
  - `app/ai-visibility-audit/page.tsx` — commercial audit landing + form (T7, 2026-06-03)
  - `app/ai-search-operator/page.tsx` — the AI Search Operator (B2B SaaS, early
    access; 2026-06-15). Agentic recurring track; Review-mode/human-approved
    framing; embedded early-access lead form. Built in code; founder-gated deploy.
  - Category pages (T8–T12, 2026-06-03): `app/local-ai-search-optimization`,
    `app/geo-audit`, `app/ai-search-ready-website`, `app/schema-for-ai-search`,
    `app/llms-txt-for-businesses`
  - `app/med-spa-ai-search-optimization/page.tsx` — Phase 6 first deep vertical
    (2026-06-15; med-spa-specific; WebPage+Service+FAQPage+BreadcrumbList; links
    the Goldleaf `/audit` sample). Built in code; founder-gated deploy.
  - `app/not-found.tsx` — custom 404 (T13, 2026-06-04; full chrome, returns HTTP 404)
  - `app/opengraph-image.tsx` — sitewide social card (T13, 2026-06-04; next/og 1200×630)
  - `app/stack-kit/page.tsx` + `app/stack-kit/success/page.tsx` — $97 DIY-kit
    offer-test (T14, 2026-06-05; Stripe refundable pre-order, LIVE in prod)
  - `app/scorecard/page.tsx` — free AI-visibility self-scorecard tool (T15, 2026-06-05;
    client-side quiz over the 7 layers → 0–100 score; open result + optional lead with
    self-score attached to /api/lead. Logic in `lib/scorecard.ts`, UI in
    `components/Scorecard.tsx`. LIVE in prod since 2026-06-10.)
  - `app/reports/[slug]/page.tsx` — **private** per-client paid-audit report (T16,
    2026-06-06). Productizes the paid audit (then $750, now $497): each report is a typed `AuditReport`
    data file (`lib/reports/`), rendered by the shared `<AuditReport>` template
    (`components/AuditReport.tsx`). NOINDEX + robots-disallowed + excluded from
    sitemap/llms.txt; unguessable slugs; print-to-PDF styles. Registry +
    one fictional example in `lib/reports/index.ts`. Model in `lib/audit-report.ts`.
    SOP: `docs/playbooks/running-an-audit.md`. LIVE in prod since 2026-06-10.
    **First real client report delivered 2026-06-10:** Maple Bear St. Johns
    (daycare/preschool, St. Johns FL) at `lib/reports/maplebear-stjohns-4caf31.ts`,
    score 49/100. ChatGPT/Gemini/Copilot visibility rows = "Unknown" pending the
    founder's manual runs — update the data file + redeploy when recorded.
    `tests/audit-report.test.mjs` now auto-loads all `lib/reports/*.ts`, so new
    client reports need no test edit.
  - `app/api/checkout/route.ts` — Stripe Checkout Session for the pre-order
  - `app/api/stripe/webhook/route.ts` — verify sig → Resend order notify (LEAD_TO)
  - `app/api/lead/route.ts` — lead capture → Resend email (LEAD_TO, default `site.email`)
  - `lib/email.ts` — branded HTML email system (2026-06-10, Pedro + Aethos): brand
    tokens + table-based templates (audit confirmation, lead alert, kit order) used
    by both API routes. Email-client constraints: single-quoted font names ONLY
    (double quotes break style="" attributes), no position:absolute, tables not divs.
  - `app/llms.txt/route.ts`, `app/robots.ts`, `app/sitemap.ts` — GEO infra
- **Lead flow VERIFIED working** end-to-end (form → /api/lead → Resend → inbox).
- **Email deliverability update (2026-06-10):** all outbound mail was hitting
  Spam/Promotions. Root cause: NO DMARC record (DKIM + SPF via Resend already pass).
  Code side done: `site.email` is now `hello@queryclear.com` (public contact
  everywhere); confirmation subject de-promotionalized ("We got your audit request —
  next steps"). `info@` stays alive as a forwarding alias. DONE same day (founder
  authorized, via Cloudflare MCP + Vercel CLI): `_dmarc.queryclear.com` TXT live
  ("v=DMARC1; p=none; rua=mailto:hello@queryclear.com; fo=1" — tighten to
  p=quarantine after ~2 wks), hello@/audit@ Email Routing aliases forward to
  aethelo@sparkcreativesinc.org, Vercel prod env LEAD_FROM="Kyle at queryclear
  <audit@queryclear.com>" + LEAD_TO=hello@queryclear.com. DEPLOYED to prod same day
  (commit 6ddaeae; smoke-checked: hello@ live on /contact + llms.txt). Manual-outreach
  fix is M365-native (founder is in Outlook, mailbox kyle@sparkcreativesinc.org):
  queryclear.com is a verified InternalRelay accepted domain in the M365 tenant,
  hello@/audit@ are mailbox aliases, send-from-alias on, M365 DKIM enabled, outbound
  connector → Cloudflare MX. Founder sends as hello@ from Outlook's From dropdown.
  STILL PENDING: tighten DMARC to p=quarantine ~2026-06-24; sparkcreativesinc.org has
  its own issues (no M365 DKIM, stale Google MX) — DNS not in our Cloudflare account.
  Deliberately deferred: `updates.` sending subdomain (premature at current volume).
- **Canonical now = www in code** (`site.url = https://www.queryclear.com`, T0 done).
- **BUILD/LINT/TEST VERIFIED ON WINDOWS (2026-06-06):** `npm run build` → 27 routes
  compile + TS passes; `npm run lint` clean; `npm test` 45/45 (lead 9 + checkout 4 +
  webhook 5 + scorecard 15 + audit-report 12). `stripe` SDK added. Code is green. Also
  served the production build via `next start` to verify `/reports/[slug]` (200,
  noindex meta, unknown slug → 404). NOTE: `npm test` lists files explicitly
  (`node --test tests/lead-route... tests/checkout-route... tests/stripe-webhook...
  tests/scorecard... tests/audit-report...`) because `node --test tests/` errors on
  this Node (22.14) — add new test files to that list in `package.json`.
- **What does NOT exist yet:** more vertical pages (Phase 6's first one — med spa —
  is now built in code; the rest are templated only *after* it proves out); the
  actual $97 kit contents (T17, deferred until T14 validates). Phases 1–4 + T14 + T15 + T16 are DEPLOYED and
  live (T15/T16 shipped 2026-06-10 with the first client report; prod smoke-checked:
  report 200+noindex, 404 on unknown slugs, no sitemap/llms leakage). STILL pending =
  founder-gated: register the Stripe webhook endpoint in the Stripe Dashboard, the
  founder's manual ChatGPT/Gemini/Copilot visibility runs for the Maple Bear report,
  and a formal Lighthouse/axe ≥90 pass.

### Decision gates — ALL CLOSED 2026-06-03 (see `Decisions.md`)
- **Canonical = www** (`https://www.queryclear.com`). Action pending: set `site.url`
  to the www form so code matches live (BUILD_QUEUE T0).
- **Model = audit-first**; the $97 kit is only a demand test (T14), product deferred
  until validated. Do not build the kit contents yet.
- **Pricing — SUPERSEDED 2026-06-11:** audit is now **$497 flat** with a public
  four-tier offer ladder (Snapshot free / Audit $497 / Upgrade from $2,500 / Build
  from $6,500). The old "starting at $750, other prices private" gate is closed.

## 3. Conventions — reuse these, don't reinvent

- **Single source of truth for copy/config:** `lib/site.ts`. Add shared strings
  (name, urls, CTAs, engine list) there, import everywhere. Don't hardcode.
- **Schema (JSON-LD):** Organization + WebSite schema live in `app/layout.tsx`.
  Add page-level schema (WebPage, BreadcrumbList, Service, FAQPage) inside the page
  via a `<script type="application/ld+json">`. Only emit a schema type when real
  data supports it.
- **Metadata:** export a `metadata: Metadata` object per route. Title uses the
  layout template `%s — queryclear`. Every page needs a unique title + description
  + `alternates.canonical`.
- **UI primitives:** `components/ui.tsx` (`Container`, `MonoLabel`, `Cta`, `Mark`),
  `components/motion.tsx` (`Stagger`, `ClipReveal`, etc.), plus `Header`, `Footer`,
  `Accordion`, `LeadForm`. Build new pages from these; keep the visual system.
- **Sitemap + robots:** `app/sitemap.ts` is a hand-maintained array. **Every new
  public route must be added there**, and to `app/llms.txt/route.ts`.
- **Tests:** `npm test` runs `tests/lead-route.test.mjs` (node:test). Add tests when
  you add API behavior.

## 4. Guardrails (hard rules — never violate)

- No fake testimonials, clients, reviews, ratings, certs, or invented business
  details (addresses, phone numbers, hours) for queryclear OR for demo content.
  Demo/sample data must be clearly labeled fictional (see `seed_data.md`).
- No guaranteed-ranking / guaranteed-citation language anywhere.
- No hype buzzwords (see `UI_direction.md` banned list). Plain, concrete claims.
- Every public page must pass `test_plan.md` (GEO + a11y WCAG 2.1 AA + perf + honesty)
  before it ships. We are the demo; our own site failing the gate is a sales problem.

## 5. How to pick up work (the loop)

1. Read `roadmap.md` → find the current phase and check its decision gates are open.
2. Open `docs/build/BUILD_QUEUE.md` → take the lowest-numbered unblocked task card.
3. Each card is self-contained: route, files to touch, sections, schema, metadata,
   internal links, and acceptance criteria. Build exactly that scope.
4. Reuse conventions in §3. Run `npm run build` + `npm run lint` + `npm test`.
5. Check the card's acceptance criteria and the relevant parts of `test_plan.md`.
6. Add the route to `app/sitemap.ts` and `app/llms.txt/route.ts`.
7. Update ground-truth (§2 here) + `memory.md`, check the card off in BUILD_QUEUE.

For broad/risky changes or anything touching a decision gate: stop and ask the
founder. For small, in-scope, in-convention changes: proceed and report.

## 6. Doc map

| File | Role |
|---|---|
| `CLAUDE.md` (this) | Orientation, ground truth, conventions, guardrails |
| `roadmap.md` | Canonical strategy + phases + decision gates (the *why/when*) |
| `docs/build/BUILD_QUEUE.md` | Ordered, self-contained build task cards (the *what/how*) |
| `docs/build/page-template.md` | The reusable recipe every page card references |
| `tasks.md` | Short living board: Now / Next / Later |
| `product_spec.md` | Offer, deliverables, pricing bands, what we don't promise |
| `UI_direction.md` | Brand voice, visual system, banned buzzwords |
| `test_plan.md` | Definition of done / quality gate for every page |
| `prompts.md` | AI-visibility test prompts + internal audit prompts |
| `seed_data.md` | Fictional demo business for sample audit |
| `Decisions.md` | Append-only decision log (ADRs) |
| `memory.md` | Human-readable running project memory (update each session) |
