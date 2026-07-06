# Project Memory — queryclear (human-readable)

This file is updated at the end of every Claude Code session so future sessions can resume intelligently.

A running snapshot for humans. Complements (does not replace) the agent memory
in `~/.claude/.../memory/` which Aethos reads automatically each session.
Update the "Current state" line whenever it changes.

---

## Fixed facts

- **queryclear.com** = a **SparkCreatives Inc.** brand publicly (since 2026-06-11;
  parent 501(c)(3), EIN 33-4477854, FL reg CH79169). Internally still grew out of
  Aethelo (`aethelo.sparkcreativesinc.org`), but Aethelo no longer appears in
  public copy/schema.
- Product = **modern SEO for the AI search era** (formerly pitched as "GEO, the
  next layer on SEO" — repositioned 2026-06-11 after Google's official guidance).
  Sells readiness, not guarantees.
- Offer ladder (public): **free AI Search Audit (`/free-audit`, automated/instant)**
  → AI Search Audit **$497** → Website Upgrade from $2,500 → Modern Search Website
  Build from $6,500 → (later) care plan. **Updated 2026-06-17:** the manual "AI Search
  Snapshot" free tier was retired in favour of the automated `/free-audit` tool — the
  free thing is now an instant read-only **audit**, and "$497 audit" is the deeper paid
  product. (Earlier note "free audit naming is dead; the free thing is a Snapshot" is
  reversed.)

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

2026-07-06 session 2 (latest) — AGENT SWARM STOOD UP (Mac session, no site code
changes). The recurring business work is now packaged as Claude Code agents +
skills, versioned in-repo: `.claude/agents/` (outreach-drafter, prospector,
prospect-curator, vertical-page-builder, ops-watchdog) and `.claude/skills/`
(/swarm = daily morning briefing (ops + outreach in parallel), /outreach-daily,
/prospect-city <city>, /build-vertical <vertical>, /ops-check). Manual:
`docs/automation/SWARM.md`. Founder-gated by design: all --send, all deploys,
--mark status changes, spend beyond stated caps (Apify ~$1/city). NOT scheduled/
cron'd — cloud routines can't reach this Mac's .env.local/leads CSVs, so the swarm
is human-triggered (/swarm each morning). CORRECTION to the prior entry: this Mac
NOW HAS `.env.local` incl. OUTREACH_SECRET (founder added it after that session),
so outreach previews/sends run locally against prod via
OUTREACH_BASE_URL=https://www.queryclear.com. Vercel/Stripe cred gaps still stand.
New agent types load in NEW sessions (fallback documented in each skill).
COMMITTED + PUSHED to main same session (8e31cc5 "feat: agent swarm" + follow-up)
— docs/agents only, no site-code change; Vercel auto-deployed from the push; prod
smoke-checked 200 on /, /free-audit, /ai-visibility-audit, med-spa, sitemap.
No outreach sent. NOTE: this Mac's git identity was unset — 8e31cc5 is authored as
"Kyle Lamban <LoxeMortgage@Makaylas-MacBook-Air.local>"; set git config
user.name/user.email to fix future commits.

2026-07-06 — SELL-MODE PIVOT + FIRST PROSPECT LIST BUILT (Mac session, no
code changes). Founder adopted the "one motion for 90 days" plan: cold outreach →
/free-audit → $497 → Upgrade; everything else (Operator, verticals, $97 kit) to
maintenance. Built the first real prospect list via Apify Google Maps scraper
(compass/crawler-google-places, ~$0.45): **54 curated Jacksonville med spas** with
site+email at `docs/marketing/outreach/leads/2026-07-06-medspa-jacksonville.csv`
(gitignored PII — exists only on the Mac); batch notes + run commands in
`docs/marketing/outreach/2026-07-06-medspa-jacksonville-batch.md`. Coverage
exhausted (~all Maps-visible Jax med spas; ~45 more had no scrapeable email).
Prod smoke-checked: med-spa page/free-audit/operator/stack-kit all 200, sitemap 17
URLs, unsigned Stripe webhook POST → 400 (sig check live), /api/outreach GET → 405.
FOUND STILL OPEN (now 2+ wks overdue): DMARC still p=none (tighten to p=quarantine —
was due ~6/24); Maple Bear visibility rows still "Unknown"; Stripe Dashboard test
event unchecked. THIS MAC IS CREDENTIAL-LIMITED: Vercel CLI = momomonster549 (no
sparkcreativesinc team access), Stripe CLI keys expired 2026-03-12 (`stripe login`
needed), no .env.local (no OUTREACH_SECRET) — sends must wait for the founder to
supply the secret or run from Windows. Suggested pace: preview then send 10–15/day
from the 54; next metros St. Augustine → Orlando → Tampa → Miami (same recipe).

2026-06-17 — SNAPSHOT RETIRED + FREE-AUDIT UNLOCK MONETIZED — SHIPPED TO
PROD (commits f4e7e36 "retire AI Search Snapshot" + c300757 "monetize free-audit
unlock", pushed to origin/main → Vercel prod READY, smoke-checked queryclear.com:
/ + /free-audit 200, home links /free-audit, no "free snapshot" in home HTML).
Context: the public `/free-audit` lead magnet (automated, instant, read-only audit;
separate Vercel Python `agent-runtime` project; Upstash Redis rate-limit + daily
spend cap; Resend email gate) had already shipped and "worked great". This session
did two things. (1) RETIREMENT: replaced the manual "AI Search Snapshot" free offer
with `/free-audit` everywhere — sitewide free CTAs are now plain links to
`/free-audit` (Header "Free audit", Footer, hero, all ~18 service/guide pages); the
`SnapshotCta` overlay (name kept) now serves ONLY the homepage Website Upgrade/Build
offers, reframed as the "edit/rebuild my website" inquiry; `site.primaryCta` →
`/free-audit`; added `site.inquiryAnchor = "/#audit-cta"` (overlay fallback);
`site.offers[0]` is now "Free AI Search Audit"; `LeadForm.interestOptions` dropped
"Free AI Search Snapshot"; lead confirmation/notification emails reframed as a
"website inquiry" (dropped the "we'll email you in a couple days" line — the free
audit is instant); rewrote `tests/snapshot-overlay.test.mjs` to the new contract.
(2) MONETIZED THE UNLOCK: the unlocked `/free-audit` report ends with the three
paid-offer CTAs ($497 → /ai-visibility-audit; Upgrade/Build open the inquiry overlay
in place); on unlock the prospect is now emailed their audit (summary + prioritized
fix list + three clickable offer CTAs) via new `renderPublicAuditReportEmail` —
team still notified; extended the email builder with a stacked `ctas[]` option; added
`tests/public-audit-email.test.mjs`. Honesty held: the $497 tier is framed as ADDING
depth (asserted in test), never as paying for the free read. VERIFIED: lint ✅,
build ✅ 32 routes, test ✅ **56/56**; browser-checked the homepage CTAs + the
surviving Upgrade/Build inquiry modal; sent a real sample prospect email via Resend
(noticed the Resend plan shows a low daily quota — founder will upgrade when needed).
Docs reconciled this session (CLAUDE.md §1/§2, memory.md, Decisions.md ADR, readme,
product_spec, roadmap, tasks, start_here, UI_direction, page-template, BUILD_QUEUE,
stack-kit-demand-test, DEPLOY-free-audit). NOTE: dated entries below predate this and
describe the Snapshot as the live free offer — historical, not current. Open next:
Resend plan upgrade before real volume; DMARC → p=quarantine ~2026-06-24.

2026-06-15 — TWO-TRACK REPOSITION: AI SEARCH OPERATOR BUILT IN CODE (NOT
yet committed/deployed). The founder declared `queryclearagent` (the autonomous
SEO/AEO/GEO operator) the real pivot and the manual audit commoditized. Decision
(founder, this session; ADR in Decisions.md): run TWO tracks — keep the local
done-for-you ladder AND add a recurring agentic **AI Search Operator** track for
**B2B SaaS**, launched as a founder-led **early-access / design-partner** program,
delivered human-in-the-loop while the loop hardens. SHIPPED IN CODE: new
`app/ai-search-operator/page.tsx` (hero → what it does [monitor/create/fix/measure]
→ autonomy ladder [Review = available now; Auto-publish/Autopilot = roadmap] → "an
audit is the first run, not the product" → FAQ → embedded early-access lead form),
WebPage+Service+FAQPage+BreadcrumbList JSON-LD, honest Review-mode/human-approved/
staging-first framing, NO guarantees, NO live-site-autonomy claims. `lib/site.ts`
gained an `operator` block; `LeadForm` gained an "AI Search Operator (early access)"
interest (parity test unaffected — `site.offers` unchanged, so it stays the local
ladder); homepage gained a two-track band after the hero; `lib/navigation.ts` gained
an "Operate" group (→ mega-menu + footer); added to sitemap + llms.txt. The operator
ask uses its OWN embedded form, NOT the Snapshot overlay (different ask). The agent
is NOT wired into the site — early-access delivery is concierge; live autonomy is
gated on `queryclearagent` Phase 1. Docs reconciled: Decisions.md ADR, CLAUDE.md
§1/§2, product_spec.md (second-track section), roadmap.md (two-track note).
EYEBALLED via `next start` + Playwright (desktop): hero renders unclipped, two-track
band sits right after the homepage hero, operator page on-brand. FIX from eyeballing:
the embedded operator form was showing LeadForm's hardcoded "Request my free Snapshot"
button + Snapshot helper (wrong for an early-access ask) — parametrized `LeadForm`
with optional `submitLabel` + `note` props (defaults unchanged, so Snapshot/contact
forms are untouched); operator form now reads "Request early access" + a personal-
reply note. Founder calls on the three open items: (1) homepage = additive band (no
hero teardown); (2) pricing = "early access / talk to us" (no public tiers); (3)
design-partner terms — founder delegated the call ("you decide"), so: **five founding
partners** (capacity-based, honest scarcity for a solo concierge delivery) + founder-
led setup + direct line + **founding pricing locked for year one** + optional case
study; no guarantees. Copy updated on the operator page (hero label, early-access
section, FAQ cost answer). VERIFIED: build ✅ 31 routes, lint ✅, test ✅ 52/52.
**SHIPPED 2026-06-15** — commit a97f995 pushed to origin/main + `vercel --prod --scope
sparkcreativesinc` (aliased www, READY). Live smoke-check passed: /ai-search-operator,
/med-spa-ai-search-optimization, /, /sitemap.xml, /llms.txt all 200; operator copy
correct ("Request early access" / "five founding partners", no "free Snapshot" leak);
both routes in sitemap + llms.txt. The med-spa vertical shipped in the SAME commit (it
had also been sitting uncommitted). Tree clean, in sync. Open next: founder may later
publish operator pricing tiers; recurring Lighthouse/axe ≥90 pass; DMARC →
p=quarantine ~2026-06-24.

2026-06-15 — PHASE 6 FIRST DEEP VERTICAL (MED SPA) BUILT IN CODE (NOT yet
committed/deployed). New `app/med-spa-ai-search-optimization/page.tsx`, modeled on
the `local-ai-search-optimization` pattern but genuinely med-spa-specific (no thin
dupe): why med spas go invisible (treatment-intent queries, franchise competition,
no per-treatment pages), the 7-layer AI Visibility Stack read through a med-spa lens,
what we fix (per-treatment pages, treatment FAQs, provider clarity, review/before-
after proof, GBP↔site consistency, booking path), a proof band linking the Goldleaf
`/audit` sample (clearly fictional), med-spa-specific FAQ, Snapshot CTA top+bottom.
WebPage+Service+FAQPage+BreadcrumbList JSON-LD; honest claims only; NO emitted
medical schema; no new deps/components. Wired: `lib/navigation.ts` serviceColumns
"Improve" (auto-flows to header mega-menu + footer), `app/sitemap.ts`,
`app/llms.txt/route.ts`; the local page now cross-links to it. VERIFIED on Windows:
`npm run build` ✅ 30 routes (page prerenders static), `npm run lint` ✅, `npm test`
✅ 52/52; prerendered HTML confirmed to carry the h1, canonical, title (layout
suffix), and all four JSON-LD types. **Founder-gated:** commit/push + `vercel --prod
--scope sparkcreativesinc` is a separate go. NEXT (after it proves out): template the
other verticals (aesthetician, spa, salon, dentist, home service). Recurring still
open: formal Lighthouse/axe ≥90 pass; DMARC → p=quarantine ~2026-06-24; Maple Bear
manual ChatGPT/Gemini/Copilot visibility runs.

RECONCILED stale memory: the entries below stopped at 2026-06-12, but the repo had
already advanced — `git log` shows `4e18709 Finalize and deploy current queryclear
changes` plus three background-styling commits (sitewide brand background, smoothed
homepage transitions, flattened background color). So the Snapshot overlay + that
styling work ARE committed and deployed; the 2026-06-12 "NOT yet committed" note was
simply never updated. Working tree is clean and in sync with origin/main.

2026-06-12 — SNAPSHOT OVERLAY SHIPPED (code-complete, NOT yet
committed/deployed): every free-Snapshot CTA sitewide (header desktop+mobile,
home hero, "Not sure where you stand?" card, offer-ladder Snapshot/Upgrade/Build,
about, ai-visibility-audit hero, 3 category pages, scorecard, stack-kit text
link, footer text link, 404, and the /audit sample-report bottom CTA in
AuditReport.tsx — sample variant only, client reports untouched) now morphs
into a full-screen pine lead-form
overlay (new `components/SnapshotCta.tsx`, bespoke motion/react layoutId morph
portaled to body — NOT the Cult UI/shadcn component; sharp corners on-brand).
Ladder buttons preselect the form's "What do you need?" (Snapshot/Upgrade/Build);
the $497 Audit button still navigates to its sales page (`need: null` in
`site.offers`). Triggers stay real `<a href>` anchors (SEO/no-JS fallback;
embedded #audit-cta form sections kept); `site.primaryCta.href` is now
`/#audit-cta` and all `/${...}` concat hacks are gone. LeadForm gained
`defaultNeed` + useId-prefixed ids (fixes duplicate-id when overlay + embedded
form coexist). A11y verified in dev via Playwright: dialog semantics, Escape,
focus to close-btn + return to trigger, Tab trap wraps, scroll lock+restore,
ctrl-click opens new tab. New `tests/snapshot-overlay.test.mjs` (7 tests, added
to package.json test list). lint clean, 52/52 tests, build 29 routes.
Pre-existing Next 16 console advisory about `scroll-behavior: smooth` on <html>
(suggests data-scroll-behavior attr) noted, untouched.

2026-06-12 — DOCS COHESION PASS: all living .md docs brought in line
with the 2026-06-11 repositioning. Updated: roadmap.md (money ladder → Snapshot/
$497/$2.5k/$6.5k, GATE-PRICING marked superseded, Phase 7 flagged internal-only),
product_spec.md (offer section rewritten to the four public tiers matching
`site.offers`), UI_direction.md (CTAs → "Get your free AI Search Snapshot",
offer-ladder section added to landing structure), readme.md (modern-SEO framing,
"a SparkCreatives Inc. brand", status → LIVE, four-tier What-we-do),
start_here.md (framing + ladder updated; stale "Current state 2026-05-29"
replaced with a pointer to CLAUDE.md §2), tasks.md + BUILD_QUEUE.md (gate +
done-log lines annotated "then $750, now $497"; free-audit CTA → free-Snapshot),
page-template.md (CTA rule → Snapshot), running-an-audit.md ($497),
stack-kit-demand-test.md (Snapshot → $497 motion), seed_data.md ("sample AI
Search Audit"). Left as dated historical records by design: Decisions.md,
claude.md.txt, docs/superpowers/plans+specs. Sweep verified: remaining
$750/Aethelo/free-audit hits in living docs are only superseded-markers or
internal-strategy notes. Docs-only change; build/lint/test sanity-checked.

2026-06-11 — FULL REPOSITIONING: "Modern SEO for the AI search era" —
**DEPLOYED TO PROD same day** (commit b312cb8, `vercel --prod --scope
sparkcreativesinc`, founder-authorized). Prod smoke-checked: homepage has
$497 + Snapshot, zero Aethelo/$750; /thank-you 200 + noindex + not in sitemap;
/audit prerenders 33 (CountUp fix live). `.firecrawl/` added to .gitignore
(scrape cache, not committed). Trigger: Google
published official guidance on generative-AI features in Search (GEO/AEO = SEO;
llms.txt + special AI files NOT needed for Google; no special schema). Pedro
delivered a full edit brief; founder approved: (1) adopt Pedro's $497 ladder
(supersedes $750 gate), (2) drop Aethelo from public copy → "a SparkCreatives Inc.
brand" (parentOrgUrl=sparkcreativesinc.org), (3) full sitewide pass, (4) do NOT
cite Google by name in site copy — align quietly. Rejected from Pedro's brief:
Brightleaf Plumbing example (kept Goldleaf med-spa), hardcoded "42/100", his 5-URL
sitemap, "create privacy/terms/404" (already existed). REAL BUG Pedro found
(misdiagnosed as score bug): CountUp started its motion value at 0, so static HTML
showed "0/100" to scrapers/no-JS readers on /audit — fixed by server-rendering the
real value (`useMotionValue(to)` + keyframes [0,to] after in-view). SHIPPED IN
CODE: lib/site.ts (tagline/description/primaryCta="Get your free AI Search
Snapshot"/parentOrg/`offers` ladder/stack-kit contents reorder); homepage reframe
(hero "Modern SEO for the AI search era", new problem cards, 8 FAQs incl. "Do I
need llms.txt?", steps Snapshot→Plan→Build→Submit/measure→Monitor, 14 deliverables,
offer-ladder section, TypingPanel "# business profile" instead of "# llms.txt");
LeadForm → router.push("/thank-you") + privacy reassurance; NEW /thank-you route
(noindex, deliberately excluded from sitemap+llms.txt); email templates + /api/lead
subjects → Snapshot wording (Snapshot promises plain-English review, NOT the scored
report — that's the paid audit's deliverable); Header/Footer (GEO audit→"AI Search
Audit", footer "queryclear is a SparkCreatives Inc. brand"); $497 sweep (12 spots);
Aethelo removal (layout schema, about, contact, privacy, terms, llms.txt route);
goldleaf-demo + rivermark fixes reframed ("No llms.txt" Critical → "No clear
business summary" High; added generic-content/local-alignment/buyer-questions
framing; LAYER SCORES UNCHANGED so computed 33/86 stable, tests green); scorecard
Q6 reworded (id/points unchanged); /geo-audit rewritten as "GEO done right IS
modern SEO" honest-authority page; /ai-visibility-audit = paid $497 landing w/
Offer schema; category pages + stack-kit + OG image updated; llms.txt route
self-aware ("supplemental, not required, not a ranking signal"). Maple Bear client
report data UNTOUCHED. VERIFIED: lint ✅, 45/45 tests ✅, build ✅ 29 routes,
prerendered /audit shows 33/86 (not 0), built-output sweep = zero stale strings
($750/Aethelo/"next layer"/"free AI search audit"). Three ADRs appended to
Decisions.md; CLAUDE.md §2 updated. Commit+deploy DONE (see top of this entry).
Still pending from before: Stripe webhook registration, Maple Bear manual engine
runs, Lighthouse/axe pass, DMARC p=quarantine ~2026-06-24. NEXT BUILD: Phase 6
first deep vertical (med spa).
SAME-DAY ADDENDUM (button audit, founder-requested): no broken links sitewide.
Ladder tiers 3/4 ("Upgrade my site"/"Talk about a build") retargeted from the
generic /ai-search-ready-website page to #audit-cta (form sits right below the
ladder); LeadForm gained an optional "What do you need?" select (interest field:
Snapshot/Audit $497/Upgrade/Build) which flows through /api/lead (validated,
120-char cap) into both emails as "Interested in" + the plain-text confirmation.
Two stale hero labels fixed (ai-search-ready-website "Start with an audit",
local-ai-search-optimization "Get a local AI visibility audit" → Snapshot
wording). Tests now 46/46 (new interest test in lead-route.test.mjs). Dedicated
/services/website-upgrade + /services/modern-search-website-build offer pages
stay NEXT-PHASE per Pedro's defer-until-real-content rule — build them after the
first Upgrade/Build client. Pre-selecting interest from the clicked tier also
deferred — revisit if form data shows tier-3/4 clickers skip the select.

2026-06-10 (session 2) — EMAIL DELIVERABILITY FIX (code done, DNS/env founder-gated).
All three mail categories (lead confirmations, internal notifications, founder's manual
outreach) were landing in Spam/Promotions. Diagnosed via DNS: DKIM ✅ (resend._domainkey)
and SPF ✅ (send.queryclear.com) already pass, but **_dmarc.queryclear.com DOES NOT EXIST**
— that's the root cause (Gmail requires DMARC since Feb 2024). Manual outreach is worst:
Cloudflare Email Routing is receive-only, so Gmail "send as info@" goes out via Google's
servers with zero queryclear.com auth. Decisions (founder, this session): simplified
scheme — public contact = **hello@queryclear.com**, Resend sends as
"Kyle at queryclear <audit@queryclear.com>"; info@ stays as forwarding alias; DEFER the
updates. sending subdomain (Pedro's full 4-address plan = over-engineered at our volume).
CODE SHIPPED: `lib/site.ts` site.email → hello@ (propagates to footer/contact/privacy/
terms/llms.txt/stack-kit/checkout-error); lead confirmation subject de-promotionalized:
"Your free AI search audit — here's what happens next" → "We got your audit request —
next steps" (body untouched, still honest); test mocks updated to hello@. VERIFIED:
build ✅ 28 routes · lint ✅ · 45/45 ✅. INFRA DONE same session (founder authorized):
(1) ✅ DMARC TXT live + verified via 1.1.1.1: `_dmarc` = "v=DMARC1; p=none;
rua=mailto:hello@queryclear.com; fo=1" (Cloudflare MCP; zone 16bc52f6e7bbbc643a07c41158aa1b94;
tighten to p=quarantine after ~2 wks of clean reports); (2) ✅ Email Routing rules for
hello@ + audit@ → aethelo@sparkcreativesinc.org (same destination as info@, which stays);
(3) ✅ Vercel prod env replaced via CLI (`vercel env rm/add --scope sparkcreativesinc`):
LEAD_FROM="Kyle at queryclear <audit@queryclear.com>", LEAD_TO=hello@queryclear.com.
NOTE: vercel CLI IS installed + logged in (kylelamban54-6487) — ignore the session-start
hook claiming otherwise. SHIPPED: commit 6ddaeae pushed + `vercel --prod` deployed
(dpl_C4aSd6qTTPGpncvPXQD3DGx2VcFr, aliased to www). Prod smoke ✅: /contact + llms.txt
show hello@, no info@ remnants. MANUAL OUTREACH FIX (same session, M365-native — founder is in Outlook, NOT Gmail):
the founder's mailbox = kyle@sparkcreativesinc.org on Microsoft 365 (aethelo@ is an
alias of it). Done via `m365` CLI (was already logged in) + ExchangeOnlineManagement
PowerShell (device-code auth ×3): queryclear.com added + verified in the M365 tenant
(TXT MS=ms99240042), supportedServices=Email, accepted domain = **InternalRelay**,
hello@+audit@queryclear.com added as ALIASES on kyle's mailbox, Set-OrganizationConfig
SendFromAliasEnabled=$true, M365 DKIM **Enabled** for queryclear.com (CNAMEs
selector1/2._domainkey → selector1/2-queryclear-com._domainkey.sparkcreativesinc2.
**y-v1.dkim.mail.microsoft** — note NEW format, not onmicrosoft.com; keys verified
resolving), outbound connector "queryclear.com relay to Cloudflare MX" (OnPremises,
smart hosts route1/2/3.mx.cloudflare.net) so tenant mail to unprovisioned queryclear
addresses (info@) relays out instead of NDRing. queryclear.com SPF now
"v=spf1 include:spf.protection.outlook.com include:_spf.mx.cloudflare.net ~all".
Founder now picks hello@queryclear.com in Outlook's From dropdown — fully authenticated.
ALSO FOUND (sparkcreativesinc.org, DNS NOT in this Cloudflare account — unfixed):
no M365 DKIM selectors published (selector1/2 missing → enable in Defender portal +
add CNAMEs wherever that DNS lives), 5 STALE Google aspmx MX records alongside the
outlook.com MX (mail-loss risk — delete), DMARC bare "p=none" with no rua.
TEST LEAD SENT to bluwhatsright@gmail.com (founder's test Gmail): /api/lead 200, no
delivery failures in Vercel logs — founder checking inbox placement + auth headers.
BRANDED EMAIL SYSTEM SHIPPED (commit 4ba0334, deployed): `lib/email.ts` (Pedro built
the system + wiring, Aethos polished): brand-token templates for audit confirmation /
lead alert / kit order, pine masthead + logotype, dashed step chips, machine panel,
MSO-safe CTA. Two email-client bugs fixed during polish: font tokens must be
SINGLE-quoted (double quotes inside style="" terminate the attribute → serif
fallback everywhere) and position:absolute is stripped by Gmail/Outlook (old brand
mark replaced with table-safe logotype). Verified via Playwright screenshots of
rendered HTML + lint/tsc/45 tests/build. Second test lead sent post-deploy.
STILL PENDING: (a) founder confirms Gmail placement + SPF/DKIM/DMARC PASS on the
test emails; (b) ~2026-06-24: tighten queryclear DMARC p=none → p=quarantine
if reports clean; (c) fix sparkcreativesinc.org DKIM/MX/DMARC when DNS host located.

2026-06-10 (prev) — FIRST PAID CLIENT AUDIT DELIVERED + T15/T16 SHIPPED TO PROD.
First real $750 audit client: **Maple Bear St. Johns** (maplebearstjohns.com — bilingual
daycare/preschool in St. Johns, **Florida**). Ran the full playbook
(`docs/playbooks/running-an-audit.md`): crawled all 5 pages, checked public listings,
ran web-grounded visibility tests, scored the 7 layers → **49/100** (34/70), scoreAfter 80.
Key findings: schema = bare Organization (name+url only, despite NAP+hours published on
site); NO H1 on any page (Elementor heroes are H2s); zero FAQ/answer content (layer score
2); business name splinters across web ("Maple Bear St. Johns" vs Yelp "Maple Bear Early
Learning Center" vs Care.com "...LLC"); homepage/Programs page CONTRADICT on infant age
range (24 vs 17 months); main Book-a-Tour CTA has rel="nofollow" on an internal link;
og:type=article sitewide; 10-required-field contact form. Strengths: real Google reviews
on-site, consistent footer NAP, hours published. Visibility: NOT surfaced for "best
preschools St Johns FL", infant-daycare, or even bilingual/Spanish-immersion (their core
differentiator — Primrose got called "bilingual" instead); branded lookups resolve but
identity splinters. ChatGPT/Gemini/Copilot tests = "Unknown" pending founder's manual
runs (update the data file + redeploy when recorded). Report =
`lib/reports/maplebear-stjohns-4caf31.ts` (variant client, demo:false), registered in
index.ts. Also improved `tests/audit-report.test.mjs` to auto-load all lib/reports/*.ts
so future clients need no test edit. VERIFIED: build ✅ 28 routes · lint ✅ · 45/45 ✅ ·
prod-build serve checks ✅. Founder approved content → DEPLOYED `vercel --prod`
(founder authorized deploy this session): T15 /scorecard + T16 /reports now LIVE.
Prod smoke ✅: report 200+noindex, unknown slug 404, slug absent from sitemap/llms.txt,
robots disallows /reports/, /scorecard 200. Private client link:
https://www.queryclear.com/reports/maplebear-stjohns-4caf31 (founder sends; Save-as-PDF
for attachment). STILL PENDING: founder's 3-engine manual visibility runs; Stripe
webhook endpoint registration (T14); formal Lighthouse/axe ≥90 pass. NEXT natural step:
pitch the client on the fix-implementation engagement (8 fixes scoped in the report).

2026-06-06 (prev) — T16 PAID AUDIT REPORT TEMPLATE BUILT + VERIFIED (not yet deployed).
Founder picked T16 over Phase 6 verticals as the next build: the revenue bottleneck is
*repeatable delivery* of a paid audit, not traffic. Productized it — the hand-built
`/audit` page is now a data-driven `<AuditReport>` template (output unchanged), and a new
**private** `/reports/[slug]` route delivers a client's report as a noindexed link + clean
Save-as-PDF. Founder decisions this session: delivery = private web link + print-to-PDF
(no standalone PDF lib); scope = template + client route + playbook. New files:
`lib/audit-report.ts` (typed model + pure helpers — `scoreFromLayers` derives the headline
0–100 from the 0–10 layer scores so it can't contradict the scorecard; Goldleaf → 33),
`components/AuditReport.tsx` (sample vs client CTA variant, `print-hide`), `lib/reports/
goldleaf-demo.ts` (public sample) + `lib/reports/index.ts` (private registry + one
clearly-fictional example, Rivermark Family Dental), `app/reports/[slug]/page.tsx`
(noindex, generateStaticParams, notFound), `docs/playbooks/running-an-audit.md` (SOP),
`tests/audit-report.test.mjs` (12 tests). Edited: `app/audit/page.tsx` (onto template),
`app/robots.ts` (disallow /reports/), `app/globals.css` (@media print), `package.json`
(test list). /reports kept OUT of sitemap + llms.txt. VERIFIED on Windows: build ✅
27 routes + TS · lint ✅ · test ✅ 45/45 (12 new). Served prod build via `next start`:
`/reports/[slug]` 200 + `noindex,nofollow` meta, unknown slug → 404, robots disallows
/reports/, /audit unchanged. (Side note: founder's long-running `next dev` on :3000 had a
stale broken Header.tsx in memory throwing 500s — not our code; on-disk builds clean.)
NEXT (founder-gated): `git push` + `vercel --prod` ships BOTH /scorecard (T15) and
/reports (T16). Still also pending: register the Stripe webhook endpoint for T14;
formal Lighthouse/axe ≥90 pass. To deliver a real audit: follow the playbook → add
`lib/reports/<unguessable-slug>.ts` (demo:false) → register → deploy → send the link.

2026-06-05 (prev+++) — T15 FREE SCORECARD TOOL BUILT + VERIFIED (not yet deployed).
New `/scorecard`: a client-side self-assessment — 19 plain-English Yes/Not-sure/No
questions across the 7 AI Visibility Stack layers → instant 0–100 readiness score with
per-layer bars, weakest-layer guidance, and an honest "readiness not rankings" disclaimer.
Founder chose the open-result model (no email gate); below the result is an optional lead
form that POSTs to the existing `/api/lead` with the self-score summary auto-attached in
the `message` field (no API change). New files: `lib/scorecard.ts` (rubric + pure,
unit-tested scoring — weights sum to exactly 100), `components/Scorecard.tsx`,
`app/scorecard/page.tsx`, `tests/scorecard.test.mjs` (15 tests). Added to sitemap +
llms.txt; linked from Footer and the /ai-visibility-stack & /audit CTA blocks. Reuses the
ScoreRing/LayerBar patterns from /audit, CountUp, and ui primitives. VERIFIED on Windows:
build ✅ 26 routes + TS · lint ✅ · test ✅ 33/33 (added scorecard 15). Drove the live
page in a browser: all-yes→100 ("Strong"), all-no→0 ("Hard for AI to read"), weakest
cards render, lead submit → success + accepted lead carrying the self-score in the
message; WebPage+BreadcrumbList JSON-LD present; /scorecard in sitemap.xml + llms.txt.
NEXT (founder-gated): `git push` + `vercel --prod` to ship /scorecard. Still also pending:
register the Stripe webhook endpoint for T14.

2026-06-05 (latest++) — NEW SAMPLE AUDIT LIVE + DEMO UNIFIED. Rebuilt /audit as a Rebuilt /audit as a
best-practice, methodology-driven page on a fictional med spa (Goldleaf Aesthetics &
Med Spa, Westhaven) — 7-layer AI Visibility Stack scorecard (per-layer bars), richer
AI-visibility test table, findings tagged to layers, added WebPage+BreadcrumbList
JSON-LD (page had none). Honesty boundary: med-spa schema shown only as illustrative
machine-view text, never emitted as real structured data. Unified the running demo
business sitewide (homepage machine-view, /schema-for-ai-search example,
/llms-txt-for-businesses sample) from Brightleaf plumbing → Goldleaf med spa; seed_data.md
updated (Brightleaf retired). Also committed the earlier Phase 5 discoverability work
(/stack-kit footer link + method CTA + homepage/audit FAQ + docs/marketing playbook).
Committed c872191, pushed, `vercel --prod` → live; verified in prod (audit 200, scorecard,
schema present, no emitted MedicalBusiness JSON-LD, no leftover Brightleaf; unified
examples live). Doubles as Phase 6 med-spa vertical groundwork. build 25 routes / lint /
tests 18/18 green.

2026-06-05 (latest+) — T14 FULLY OPERATIONAL IN LIVE MODE. Founder verified the webhook
code path in Stripe SANDBOX (test mode has its own endpoint+secret), then switched back
to LIVE. Re-confirmed prod is consistent: Vercel STRIPE_* untouched since setup; live
webhook endpoint enabled w/ checkout.session.completed; prod /api/checkout returns a real
LIVE checkout.stripe.com session. Keys are sk_live — real $97 charges. End-to-end flow is
go: pre-order → charge → /stack-kit/success → order email to info@. Optional 100% live
proof: Stripe Dashboard (live) → Webhooks → endpoint → "Send test event" → expect 200.

2026-06-05 (earlier+) — T14 /stack-kit DEPLOYED + LIVE. Pushed (0196ee1), `vercel --prod`,
aliased to www.queryclear.com. Verified in prod: /stack-kit + /stack-kit/success → 200;
prod /api/checkout → real checkout.stripe.com session (STRIPE_* env vars added to Vercel
production via CLI). In sitemap. ONLY remaining founder step: register the webhook
endpoint https://www.queryclear.com/api/stripe/webhook (event checkout.session.completed)
in the Stripe Dashboard so its signing secret matches STRIPE_WEBHOOK_SECRET — until then
checkout/payments work but order-notification emails won't fire (orders still show in
Stripe Dashboard). Also: keys may be test or live mode — confirm before driving traffic.

2026-06-05 (earlier) — T14 /stack-kit BUILT + VERIFIED IN CODE.
Pages `/stack-kit` + `/stack-kit/success`; `/api/checkout` (Stripe Checkout Session)
+ `/api/stripe/webhook` (sig verify → Resend order email to info@); `PreorderButton`;
`stripe` SDK added; `lib/site.ts` gained `stackKit` config. build 25 routes clean,
lint clean, tests 18/18. Checkout endpoint verified end-to-end → real
checkout.stripe.com session using founder's keys in .env.local. NOT pushed/deployed
yet (awaiting founder go on a live payment surface). To go live: commit/push +
`vercel --prod`, add STRIPE_SECRET_KEY/PUBLISHABLE_KEY/WEBHOOK_SECRET to Vercel prod
env, and register the prod webhook endpoint (/api/stripe/webhook) in the Stripe
Dashboard so its signing secret matches STRIPE_WEBHOOK_SECRET. Watch: JSX trims a
text node's leading space right after a {expr}; fixed by putting whole phrases in one
template literal (bit us on "30 days of purchase").

2026-06-05 (later) — BUILDING T14 /stack-kit offer test (Phase 5 demand test).
GSC + Bing verified + sitemap submitted (founder) → T13 core complete. Founder chose
the **Stripe refundable $97 pre-order** capture for "The Local AI Visibility Stack"
(design approved; spec at `docs/superpowers/specs/2026-06-05-stack-kit-offer-test-design.md`).
Stripe keys (SECRET/PUBLISHABLE/WEBHOOK_SECRET) are in `.env.local`; still need to be
added to Vercel prod + webhook registered in Stripe Dashboard before launch. Pre-order
terms: ships ≤30 days or auto-refund; refundable anytime before delivery; no guarantees.

2026-06-05 — DEPLOYED. All 12 newer routes + custom 404 + OG image are now LIVE in
production (committed 1d732f2, pushed to GitHub main, `vercel --prod` → aliased to
https://www.queryclear.com, readyState READY). Verified live: /, /about,
/ai-visibility-audit, /ai-visibility-stack, /geo-audit, /schema-for-ai-search,
/opengraph-image, /sitemap.xml, /llms.txt all 200; unknown route → real 404.
Production now MATCHES code. Vercel CLI is installed + authenticated locally (user
kylelamban54-6487; project linked via .vercel/project.json to team sparkcreativesinc).
Still pending (founder accounts): Google Search Console + Bing Webmaster verification,
submit updated sitemap, formal Lighthouse/axe ≥90.

2026-06-04 — PHASES 1–3 NOW VERIFIED ON WINDOWS + T13 STARTED. `npm run build`
(21 routes, TS pass) + `npm run lint` (clean) + `npm test` (9/9) all green — the
prior sandbox "can't run next build" blocker is CLEARED. Added two T13 artifacts,
both visually verified via Playwright: `app/not-found.tsx` (custom 404, full chrome,
returns real HTTP 404) and `app/opengraph-image.tsx` (next/og 1200×630 brand card,
auto-wired into OG+Twitter sitewide). STILL pending (need founder accounts/creds):
deploy the 12 new pages to Vercel, Google Search Console + Bing Webmaster, submit
updated sitemap, formal Lighthouse/axe ≥90. NOTE: only the original Phase-1 MVP is
live in production; the 12 newer routes exist in code (green) but are NOT deployed yet.

2026-06-03 — ROADMAP CLARIFIED + PHASES 1–3 BUILT IN CODE (not yet deployed/verified).
See `roadmap.md` (canonical), `docs/build/BUILD_QUEUE.md` (executable task cards),
and `CLAUDE.md` (auto-loaded orientation — supersedes the stale `claude.md.txt`).

DOC OVERHAUL (this session): the three competing roadmaps (lean `roadmap.md`, the
big uploaded website roadmap, and a $97-product brainstorm) were reconciled into one.
Added root `CLAUDE.md` (ground truth + conventions + guardrails + how-to-pick-up-work),
rewrote `roadmap.md` (phases + decision gates + DoD), added `docs/build/BUILD_QUEUE.md`
(self-contained T0–T18+ cards) and `docs/build/page-template.md` (the reusable page recipe).

DECISION GATES CLOSED 2026-06-03 (logged in `Decisions.md`):
- Canonical = **www** (`https://www.queryclear.com`). `site.url` updated to www (T0). 
  Apex still 307→www in production; verify redirect type on deploy.
- Model = **audit-first**; the $97 "Local AI Visibility Stack" kit is only a future
  DEMAND TEST (landing+waitlist, BUILD_QUEUE T14) — do NOT build kit contents until validated.
- Pricing = public **"starting at $750"** for the audit; build/upgrade + product prices stay private.

PAGES NOW IN CODE (12 routes total; Phases 1–3 of BUILD_QUEUE):
- Phase 1 (trust): `/about` (AboutPage schema), `/contact` (ContactPage+ContactPoint,
  reuses LeadForm), `/privacy`, `/terms` (WebPage+BreadcrumbList). Legal copy is a
  sensible draft — NOT lawyer-reviewed; flag if entering regulated space / GDPR/CCPA.
- Phase 2 (proof+commercial): `/ai-visibility-stack` (the 7-layer method, our proprietary
  framework), `/audit` promoted (CTAs now point to /ai-visibility-audit + /ai-visibility-stack),
  `/ai-visibility-audit` (commercial landing, 7 scoring categories, CTA top+bottom,
  WebPage+Service+FAQPage+BreadcrumbList, LeadForm).
- Phase 3 (category/intent): `/local-ai-search-optimization`, `/geo-audit`,
  `/ai-search-ready-website`, `/schema-for-ai-search`, `/llms-txt-for-businesses`.
  Each distinct (no thin dupes), Service/FAQPage schema where it fits, "$750" CTA.

WIRING: all routes added to `app/sitemap.ts` and `app/llms.txt/route.ts`. Header nav
leads with "AI visibility audit" + "The method". Footer restructured into
Services / Resources / Company groups (no orphan pages). Note: Header "Free audit"
button + footer "Get started" link still point to `/#audit-cta` (homepage form) —
fine, but consider pointing to /ai-visibility-audit later.

VERIFICATION STATUS: `npm test` (lead-route) passes 9/9. `next build` and `tsc`
could NOT be run in the cowork Linux sandbox (blocked SWC binary download + a
file-mount sync lag that serves stale/truncated reads — authoritative file state is
correct). Lint: one earlier 'Reveal' unused-import warning in `/about` already fixed
(import trimmed to Stagger/StaggerItem). ACTION FOR FOUNDER: run
`npm run build && npm run lint` on Windows, then deploy all 12 pages to Vercel and
submit the updated sitemap to Search Console. NONE of the new pages are live yet.

NEXT (per roadmap): BUILD_QUEUE **T13 technical hardening** — Google Search Console +
Bing Webmaster (needs founder account access), OG image, custom 404 (`app/not-found.tsx`),
Lighthouse/axe pass. Then Phase 6 = ONE deep vertical (med spa) before templating others.
Phase 5 ($97 test, T14) stays gated/deferred until the audit motion is proven.

PRIOR LAUNCH FACTS (still true): LIVE at https://www.queryclear.com on Vercel
(team `sparkcreativesinc`, CLI needs `--scope sparkcreativesinc`). Deployment Protection
off. Prod env: RESEND_API_KEY, LEAD_TO=info@queryclear.com, LEAD_FROM="queryclear <info@queryclear.com>"
(STALE as of 2026-06-10 session 2 — switching to hello@/audit@, see latest entry).
queryclear.com verified in Resend; DNS on Cloudflare; info@ via Cloudflare Email Routing.
End-to-end lead form verified (submit → /api/lead → Resend → inbox, reply-to=lead).
GitHub push via gh credential override. Stack: Next.js 16 + React 19 + Tailwind v4,
Bricolage Grotesque + IBM Plex, paper/pine/lime. Tools: resend-cli (global), vercel CLI.
