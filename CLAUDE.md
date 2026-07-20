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
  local/service track** (free `/free-audit` → $497 audit → Upgrade → Build), and (2) the
  **AI Search Operator** — the recurring agentic offering for **B2B SaaS**, powered
  by the separate `queryclearagent` product, launched as a founder-led **early-access
  / design-partner program**. The operator is **Review-mode / human-approved /
  staging-first** today; market it honestly (no "fully autonomous, live" claims).

## 2. Ground-truth state (keep this section current)

> Last verified: 2026-07-20. If you change the site, update this section and
> `memory.md` at the end of your session.

- **AUTOMATIC LEAD SOURCING 2026-07-20 (code shipped, NOT yet fully live —
  founder-gated on `APIFY_TOKEN`):** built same day as the autonomous outreach
  cutover below, after the founder asked "how will you find leads?" and the new
  cloud queue turned out to be empty. Two parts: (1) **immediate seed —
  DONE**: pushed the two pre-curated CSVs into the live queue via
  `tools/ingest-prospects.mjs` — **58 real prospects now queued** (52 Fort
  Lauderdale + 6 Georgia, rest deduped against the masterlist). The other 5
  local CSVs (150 raw + dental 30 + custom-home-builder 32 + physical-therapy
  31 + non-FL med-spa 101) still need a curation pass — not done, fast-follow.
  (2) **Automatic ongoing sourcing** — new `lib/apify.ts` (Apify REST client;
  actor `compass/crawler-google-places`; input schema verified against Apify's
  public docs — `searchStringsArray` not `searches`), `lib/prospect-curate.ts`
  (deterministic port of the `prospect-curator` agent's rules — drop no-email/
  junk-platform-emails/national-chains-and-institutions/careers-mailboxes,
  dedupe by domain; tested against synthetic fixtures matching the real
  Jacksonville 120→54 batch's named drop examples), `lib/prospect-targets.ts`
  (explicit round-robin rotation: med-spa → dental → chiropractic → law,
  excluding already-covered metros), `lib/apify-spend.ts` (daily cost cap,
  same atomic pattern as `reserveSend`/`reserveSpend`), `lib/apify-runs.ts`
  (rotation index + pending-run tracking in Redis). Two new once-daily crons
  (`app/api/cron/prospect-topup` at 6am ET checks queue depth and starts one
  Apify run if low; `prospect-ingest` at 7am ET curates finished runs and
  enqueues survivors) — wired into `vercel.json` ahead of `warm-scan`/
  `outreach-send` so same-day sourcing feeds same-day sending. Verified:
  build 41 routes, lint clean, **141/141** tests. **`APIFY_TOKEN` set by the
  founder same day → CONFIRMED WORKING LIVE END-TO-END**: manually triggered
  `prospect-topup` (with the watermark temporarily raised to force it, then
  reverted) started a real Apify run (St. Augustine FL med-spas,
  `p1MW4DKOfsNqMUxCZ`); `prospect-ingest` then curated its 23 results to 7
  kept / 16 dropped and enqueued all 7 (queue depth 58→65, 0 quarantined) —
  proves the actor call, the curation rules, AND the previously-uncertain
  email-field extraction all work against real data, no code changes needed.
  The automatic loop is fully live; nothing further is founder-gated here.
  Full design: `C:\Users\kylel\.claude\plans\we-need-to-get-fancy-tower.md`.
- **AUTONOMOUS OUTREACH ENGINE 2026-07-20 (code-complete, verified, NOT yet
  committed/deployed — founder-gated):** the cold-outreach system is no longer
  "assisted, founder fires every send" — it now sends autonomously on a Vercel
  cron, within hard safety gates, per founder decision (fully autonomous sending,
  dedicated sending subdomain, full Microsoft Graph reply detection, multi-
  vertical sourcing). This is the single biggest guardrail change in the repo's
  history — see `docs/playbooks/outreach-review.md`, `docs/automation/SWARM.md`,
  and the rewritten `.claude/agents/outreach-drafter.md` / `.claude/skills/
  swarm|outreach-daily` for the new framing (agents now **audit** the autonomous
  engine; they no longer prepare batches for the founder to fire).
  **New cron routes** (`vercel.json`, `CRON_SECRET`-gated): `app/api/cron/
  outreach-send` (sends due follow-ups then new cold prospects, within
  `OUTREACH_DAILY_SEND_CAP`), `app/api/cron/warm-scan` (polls the reply mailbox
  via Microsoft Graph; a reply flips the contact to the new terminal `warm`
  status — stopping the cadence on its next run — and fires a `[WARM]` founder
  alert with a one-paste draft reply; opt-out-worded replies auto-unsubscribe
  instead), `app/api/cron/digest` (nightly summary: sent/due/queue/quarantine).
  **VERCEL PLAN LIMIT hit + resolved 2026-07-20:** the original design was a
  `*/20`-weekday send drip + a 15-min warm-scan poll (near-instant reply
  alerts). The first deploy attempt was **rejected outright** — "Hobby accounts
  are limited to daily cron jobs" — because this Vercel team is on Hobby, not
  Pro. Founder chose to **collapse both to once/day** rather than upgrade to
  Pro: `warm-scan` runs once/day (`0 12 * * *`), `outreach-send` once/day
  weekdays right after it (`0 13 * * 1-5`, so that day's just-detected replies
  are excluded before sending), `digest` stays once/day (`0 22 * * *`).
  **Real, accepted tradeoff: a reply can now sit up to ~24h before the founder
  is alerted** (was designed to be ~15 min) — "instant" in the earlier session
  entry below refers to the original design, not what's live. Upgrading to
  Vercel Pro is what restores near-instant reply detection; nothing else about
  the design needs to change if that happens later — just tighten the two
  schedules in `vercel.json`. Because a single run must now cover the whole
  day's cap, `OUTREACH_TICK_TOUCH_MAX`/`OUTREACH_TICK_COLD_MAX` were raised to
  10 (matching `OUTREACH_DAILY_SEND_CAP`) so one daily invocation can actually
  reach the cap — `reserveSend`'s atomic cap is still the real ceiling either way.
  **Automated QA gate**
  (`lib/outreach-qa.ts`) runs on every rendered email before it can send —
  honesty/no-guarantee lint, postal-address-not-a-placeholder, unsubscribe
  present, MX record resolves, report link healthy — anything that fails is
  **quarantined** (`lib/prospect-queue.ts`, Redis `pq:*`), never sent. **Daily
  send cap** (`OutreachStore.reserveSend`, mirrors the existing `reserveSpend`
  cap pattern) is a hard, atomic, cross-instance-safe ceiling. **Deliverability**:
  every autonomous send now carries a one-click `List-Unsubscribe` header
  (`app/api/outreach/unsubscribe`, a stateless HMAC-signed token — no new
  secret), and a Resend bounce/complaint webhook (`app/api/hooks/resend`) auto-
  sets `bounced` on any delivery failure — both are the circuit-breakers
  unattended sending didn't have before. **Cloud prospect queue**
  (`lib/prospect-queue.ts`, Redis `pq:queue`/`pq:seen`/`pq:quarantine`) replaces
  the local gitignored leads CSVs as the send cron's input — CSVs are pushed in
  once via the new `ingest-prospects` action on `/api/outreach` (CLI:
  `tools/ingest-prospects.mjs --file <csv>` / `--status`). Refactor: `sendEmail`/
  `secretOk` extracted from `app/api/outreach/route.ts` into `lib/outreach-send.ts`
  / `lib/secret.ts` so the founder-facing route and the autonomous crons send
  through one path (no self-HTTP, no double-charging an audit). Verified on
  Windows: build = 39 routes (5 new: 3 crons + the Resend webhook + the
  unsubscribe endpoint), lint clean, **125/125** tests (11 new: QA gate, prospect
  queue, send cap, secret/token helpers, digest + warm-alert email templates).
  **Deliberately deferred this session** (documented, not built): Apify-driven
  cloud prospect *sourcing* (Phase 2/3 of the plan) and multi-vertical rotation —
  today's queue is filled by `ingest-prospects` from founder/agent-curated CSVs,
  same as before; auto-sourcing is the next increment. **Founder-gated before this
  goes live:** ~~(1) a dedicated sending subdomain~~ — **RESOLVED 2026-07-20:
  Resend's current plan on this account only includes 1 domain
  (`queryclear.com` already uses it; `outreach.queryclear.com` create attempt
  returned `403 create_error`, "Your plan includes 1 domain"). Founder decided
  to **ship on the existing domain** rather than upgrade the plan —
  `LEAD_FROM` stays `Kyle at queryclear <audit@queryclear.com>`. Accepted risk:
  a bad bounce/complaint run from autonomous cold sends could degrade
  `hello@`/transactional deliverability too, since they now share reputation.
  Mitigated by starting the daily cap conservative (see below) and the new
  bounce-webhook circuit-breaker. Revisit the subdomain if/when a Resend plan
  upgrade is worth it — see [[email-deliverability-scheme]].
  (2) Azure AD app registration — **DONE 2026-07-20** via `m365 entra app add`
  (Graph `Mail.Read`, application permission, `--grantAdminConsent` succeeded):
  app registered, tenant confirmed `d5006e92-c329-4a7b-9349-79ec1de1f8a0`, and
  `MS_GRAPH_MAILBOX=kyle@sparkcreativesinc.org` confirmed as the right target —
  `hello@`/`audit@queryclear.com`/`aethelo@sparkcreativesinc.org` are all proxy
  addresses on that one mailbox (verified via `m365 entra user get`), so replies
  to any of them land there. (3) `RESEND_WEBHOOK_SECRET` — **DONE 2026-07-20**:
  webhook `13b26026-1773-4690-803d-b6a77191f363` registered via `resend
  webhooks create` (`--profile default`, the queryclear Resend account — NOT
  the `maureenella` profile the CLI defaults to; always pass `--profile
  default` for queryclear Resend work) against `/api/hooks/resend`, events
  `email.bounced`/`email.complained`. (4) new Vercel prod env vars — **DONE
  2026-07-20** via `vercel env add ... --value ... --yes --scope
  sparkcreativesinc`: `CRON_SECRET` (freshly generated), `RESEND_WEBHOOK_SECRET`,
  `MS_GRAPH_TENANT_ID`/`CLIENT_ID`/`CLIENT_SECRET`/`MS_GRAPH_MAILBOX`,
  `OUTREACH_DAILY_SEND_CAP=10` (the ramp-low value from item 6). Confirmed
  already present from before this session: `OUTREACH_SECRET`,
  `OUTREACH_POSTAL_ADDRESS` (real address, set), `LEAD_FROM`, `LEAD_TO`,
  `RESEND_API_KEY`, `KV_REST_API_*`, `AGENT_RUNTIME_URL`, `PUBLIC_AUDIT_*` (via
  `vercel env ls production`). `FOUNDER_ALERT_TO` was skipped — it falls back to
  `LEAD_TO`, which already resolves to the same mailbox. **(5) DEPLOYED
  2026-07-20** — commit `ba679e0` pushed to main, `vercel deploy --prod --scope
  sparkcreativesinc` shipped after the cron-schedule fix above. **(6)
  `OUTREACH_DAILY_SEND_CAP=10`** — the conservative starting value; ramp up over
  the following weeks by watching the nightly digest's sent-count and the
  Resend webhook's bounce/complaint rate, and raising the Vercel env var.
  Full design + phased plan: `C:\Users\kylel\.claude\plans\we-need-to-get-fancy-tower.md`.
- **LIVE** at https://www.queryclear.com (apex 307 → www). Deployed on Vercel
  (team `sparkcreativesinc`, project `queryclear`; CLI needs `--scope sparkcreativesinc`).
- **CLOUDFLARE IS BLOCKING AI CRAWLERS — FOUNDER ACTION PENDING (found 2026-07-08):**
  Cloudflare's default-on "AI Crawl Control" injects a managed robots.txt block
  (GPTBot, ClaudeBot, Google-Extended, CCBot, Amazonbot, Applebot-Extended, Bytespider,
  meta-externalagent all `Disallow: /`, plus `Content-Signal: ai-train=no`) on
  www.queryclear.com — directly contradicting the GEO pitch. Founder decided
  **allow all AI crawlers**. Fix is dashboard-only (MCP API token lacks bot-management
  scope): Cloudflare → zone queryclear.com → Security → Bots / AI Crawl Control →
  Allow + turn OFF "manage AI bot traffic with robots.txt"; also confirm no WAF-level
  verified-bot block. Verify: `curl -s https://www.queryclear.com/robots.txt` shows no
  "Cloudflare Managed content" block. Googlebot was never blocked (fetches 200); our own
  `app/robots.ts` is correct. Related: site appears absent from Google's index (~5-week-old
  domain, GSC+sitemap submitted 2026-06-04) — founder should check the GSC Pages report,
  Request-index the money pages, and do the same in Bing Webmaster. Triage source: an
  external Gemini review (2026-07-08) whose headline claims (noindex headers, blocked
  crawlers, broken sitemap, FCP problems, form friction) were all verified FALSE.
- **DEPLOYED TO PROD 2026-07-08 (founder-authorized "commit push deploy ALL"):** commits
  4590d20 (machine-view SSR fix), 26936ff (docs), and 2fd712e (RZ Regular + Hagrid Trial
  local font swap + guide-page/Header/Scorecard redesign) pushed to main and shipped via
  `npx vercel deploy --prod --scope sparkcreativesinc`. Smoke-checked: pre/code machine
  view live on /, both font files 200 from /_next/static/media, 9 key routes 200
  (incl. /care-plan). Font licensing risk (RZ Regular + Hagrid Trial, unlicensed/trial
  EULAs) remains founder-accepted and is now in production.
- **MACHINE-VIEW SSR FIX 2026-07-08 (commit 4590d20, deployed same day — see above):** the
  homepage Human/Machine toggle previously mounted only the active panel, so the
  "Machine view" demo was absent from prerendered HTML. `components/HumanMachineToggle.tsx`
  now keeps both tabpanels mounted (inactive one aria-hidden + opacity-animated; no more
  AnimatePresence unmount) and the machine panel in `app/page.tsx` is semantic
  `<pre><code>`. Verified: build 38 routes, lint clean, 83/83 tests, pre/code present in
  prerendered HTML, toggle exercised in-browser via Playwright. Deploys with the founder's
  next `vercel --prod --scope sparkcreativesinc`.
- **LOCAL FUNNEL REDESIGN 2026-06-23 (code-complete, verified, NOT yet committed/deployed
  — founder-gated):** the local ladder is reshaped for recurrence:
  **Free audit → $497 Discovery Sprint (credited toward upgrade) → Upgrade (from $2,500,
  now includes the Stack kit free) → AI Search Care Plan ($997/mo).** Three moves (see
  Decisions.md 2026-06-23): (1) the **$497 `/ai-visibility-audit` is reframed as a Paid
  Discovery Sprint** — delivered as a live walkthrough, **$497 credited toward a Website
  Upgrade** if they proceed (copy-only: page + success page + `renderAuditOrderEmail`; same
  one-time `payment` checkout). (2) **NEW: `/care-plan` — queryclear's first SUBSCRIPTION
  product** ($997/mo, `subscription`-mode Stripe Checkout; `carePlan` block in `lib/site.ts`;
  new `care-plan` branch in `app/api/checkout/route.ts` using `subscription_data` +
  `recurring`; `renderCarePlanOrderEmail` + webhook dispatch in
  `app/api/stripe/webhook/route.ts`; new `LeadForm` interest "AI Search Care Plan"; `/care-plan`
  + `/care-plan/success` pages with WebPage+Service+FAQPage+BreadcrumbList JSON-LD; nav
  "Maintain" column + sitemap + llms.txt + homepage follow-on line under the ladder). Human-
  delivered, local, self-serve — **distinct from the agentic B2B `operator`**. (3) **$97 DIY
  kit retired as a public SKU** (ends the T14 demand test): `/stack-kit` is **noindex**,
  removed from nav/sitemap/llms.txt, reframed to "included free with every Upgrade"; the
  `/api/checkout` `stack-kit` branch + tests left intact (unreachable, harmless). Honesty
  held: no guarantees; Sprint credit is a real stated discount (no fake urgency); Care Plan
  is "$997/mo, cancel anytime, no contract," reports only measured data. **This deliberately
  breaks the 2026-06-18 sell-only freeze** — founder authorized the full build (incl. Stripe
  plumbing) for the MRR. Verified on Windows 2026-06-23: build = **38 routes** (incl.
  `/care-plan` + success, both prerender static with h1/canonical/4 JSON-LD types), lint
  clean, **83/83** tests (new care-plan checkout + webhook + email cases). **Founder-gated:**
  confirm the Stripe webhook endpoint in the Dashboard (reuses the same endpoint — no new env
  vars), a Stripe test-mode subscription smoke, set final Care Plan price/name if different
  from $997 / "AI Search Care Plan", then commit/push + `vercel --prod --scope sparkcreativesinc`.
- **SNAPSHOT RETIRED → `/free-audit` IS THE FREE TOP-OF-FUNNEL — SHIPPED 2026-06-17
  (commits f4e7e36 + c300757, pushed to main → prod READY, smoke-checked):** the
  manual "AI Search Snapshot" is gone. The free offer is now the **automated, instant,
  read-only audit at `/free-audit`** (a separate Vercel Python project — the
  `agent-runtime` audit — called server-to-server; guarded by Upstash Redis per-IP
  rate-limit + a daily spend cap; the unlock email gate captures the free-tier lead).
  Sitewide free CTAs (Header "Free audit", Footer, hero, every service/guide page) are
  now **plain links to `/free-audit`**. The `SnapshotCta` overlay (component name kept)
  now serves ONLY the homepage **Website Upgrade / Build** offers — reframed as the
  "edit / rebuild my website" inquiry. `site.primaryCta` → `/free-audit`;
  `site.inquiryAnchor = "/#audit-cta"` is the overlay's no-JS fallback; `site.offers[0]`
  is now "Free AI Search Audit" (href `/free-audit`, `need: null`);
  `LeadForm.interestOptions` dropped "Free AI Search Snapshot"; the lead-form
  confirmation/notification emails are reframed as a **website inquiry** (no more
  "we'll email you in a couple days" — the free audit is instant). **Offer ladder is
  now: Free AI Search Audit (`/free-audit`) → AI Search Audit $497 → Upgrade from
  $2,500 → Build from $6,500.** **MONETIZED THE UNLOCK (commit c300757):** the unlocked
  `/free-audit` report ends with the three paid-offer CTAs ($497 → `/ai-visibility-audit`;
  Upgrade/Build open the inquiry overlay in place), and on unlock the prospect is now
  emailed their audit (summary + prioritized fix list + the three offer CTAs) via
  `renderPublicAuditReportEmail` — team still notified. Email builder gained a stacked
  `ctas[]` option. Tests: `tests/snapshot-overlay.test.mjs` rewritten to the new
  contract + new `tests/public-audit-email.test.mjs`; suite is **56/56**. The $497
  `/ai-visibility-audit` page and the `/audit` static sample are unchanged real,
  separate deliverables. **⚠️ The dated entries below predate this and describe the
  Snapshot as the live free offer — they are historical, NOT current.**
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
  scroll-lock/ctrl-click-new-tab). ~~**When adding any future snapshot CTA, use
  `SnapshotCta`, not `Cta`/`Link`.**~~ **SUPERSEDED 2026-06-17:** free CTAs are now
  plain links to `/free-audit`; `SnapshotCta` is only for the homepage Upgrade/Build
  inquiry (see the 2026-06-17 entry at the top of this section).
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
    (daycare/preschool, St. Johns FL), score 49/100.
    **RETIRED 2026-07-07 (not yet committed):** the client's business closed
    down, so `lib/reports/maplebear-stjohns-4caf31.ts` and its
    `lib/reports/index.ts` registry entry were deleted — only the fictional
    Rivermark demo remains in the private registry. Verified: build/lint/83
    tests all still green.
    `tests/audit-report.test.mjs` auto-loads all `lib/reports/*.ts`, so new
    client reports (and removals) need no test edit.
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
  **DMARC tightened `p=none` → `p=quarantine` on 2026-07-07** (via Cloudflare API,
  zone `16bc52f6e7bbbc643a07c41158aa1b94`) — this item is closed. sparkcreativesinc.org
  still has its own issues (no M365 DKIM, stale Google MX) — DNS not in our Cloudflare
  account. Deliberately deferred: `updates.` sending subdomain (premature at current volume).
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
  four-tier offer ladder (free `/free-audit` / Audit $497 / Upgrade from $2,500 / Build
  from $6,500; the free tier was the manual "Snapshot" until 2026-06-17 — now the
  automated `/free-audit`). The old "starting at $750, other prices private" gate is closed.

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
