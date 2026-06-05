# Build Queue — queryclear

> Ordered, self-contained task cards. Take the **lowest-numbered unblocked** card,
> build exactly its scope using `page-template.md` + `CLAUDE.md` conventions, run
> the checks, then check it off. Strategy/why lives in `roadmap.md`.
>
> **Blocked by a decision gate?** Stop and ask the founder. Do not guess.
> Legend: ☐ todo · ▣ in progress · ✅ done · 🔒 blocked by gate.

---

## T0 — Resolve canonical domain ✅ (gate closed → www) — done 2026-06-03
**Phase 1.** Decision: canonical = **`https://www.queryclear.com`** (apex already
redirects to www in production). Set `lib/site.ts` `url` to `https://www.queryclear.com`
so code matches live. Verify `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`
and all `alternates.canonical` resolve to www. Confirm apex→www redirect stays in Vercel.
**Files:** `lib/site.ts` (primary), infra routes (verify only).
**Accept:** code `site.url` == `https://www.queryclear.com`; apex 30x → www; no mixed
apex/www URLs anywhere. *Do first — establishes consistent canonical before page cards.*

## T1 — /about ✅ done 2026-06-03 (app/about/page.tsx; AboutPage+BreadcrumbList schema; in sitemap+llms+nav+footer)
**Phase 1.** Entity trust page.
**Sections:** what queryclear is · who built it / why it exists · the
Aethelo→SparkCreatives Inc. relationship (plain language) · operating principles ·
no-guarantee philosophy · contact CTA.
**Schema:** WebPage + BreadcrumbList. (AboutPage type optional.)
**Links:** Aethelo (`site.parentOrgUrl`), `/contact`, free-audit CTA.
**Accept:** names the company relationship clearly; builds human trust; passes page checklist.

## T2 — /contact ✅ done 2026-06-03 (app/contact/page.tsx; ContactPage+ContactPoint+BreadcrumbList; LeadForm; in sitemap+llms+nav+footer). Note: re-add privacy link in T3.
**Phase 1.** Real, unmissable contact path.
**Sections:** contact form (reuse `LeadForm` or a slim variant) · email
(`site.email`) · company info · service-area note · response expectation · privacy note.
**Schema:** WebPage + BreadcrumbList; ContactPoint only if a public contact channel is real.
**Accept:** accessible form submits via existing `/api/lead` (or documented endpoint);
footer-wide link; no dead contact path.

## T3 — /privacy and /terms ✅ done 2026-06-03 (app/privacy + app/terms; WebPage+BreadcrumbList; in sitemap+llms+footer; contact privacy link restored)
**Phase 1.** Two routes: `app/privacy/page.tsx`, `app/terms/page.tsx`.
**Content:** how audit-form data is used/stored · no ranking/citation guarantee ·
service limitations · standard privacy terms. Plain English.
**Schema:** WebPage + BreadcrumbList.
**Accept:** both linked in footer; explain data use + no-guarantee; honest, not boilerplate filler.

## T4 — Footer + nav wiring ✅ done 2026-06-03 (Company group = About/Contact/Privacy/Terms; nav has About+Contact; free-audit CTA persistent). Services/Resources footer groups deferred until those pages exist (T5+).
**Phase 1.** Update `components/Footer.tsx` (and `Header.tsx` nav) so every new page
is reachable. Footer groups: Company (About, Contact, Privacy, Terms), Services,
Resources (per `roadmap.md` nav plan). Keep the free-audit CTA persistent.
**Accept:** homepage links to ≥3 deeper pages; no orphan pages; nav consistent across site.

## T5 — /ai-visibility-stack ✅ done 2026-06-03 (7-layer method page; WebPage+BreadcrumbList; in sitemap+llms+nav+footer)
**Phase 2.** The named methodology — makes queryclear feel proprietary; primary sales asset.
**Sections:** intro to "The QueryClear AI Visibility Stack" · the 7 layers (Entity
Clarity, Service Specificity, Proof Density, Local Relevance, Answer Coverage, Machine
Readability, Conversion Path) each with plain description + what it requires on a site ·
how we use it in an audit · CTA.
**Schema:** WebPage + BreadcrumbList; FAQPage if you add an FAQ.
**Links:** `/ai-visibility-audit`, `/audit` (sample), category pages once they exist.
**Accept:** explains the method plainly; reads as a linkable standalone asset; no hype.

## T6 — Promote the sample audit (/audit) ✅ done 2026-06-03 (CTAs now link to /ai-visibility-audit + /ai-visibility-stack; demo banner already present)
**Phase 2.** The existing `/audit` (Brightleaf demo) becomes a sendable proof page.
**Do:** ensure clear "fictional demo" labeling; show a score format; show prioritized
fixes + a before→after framing; strong CTA to request a real audit. Confirm it's in
sitemap + llms.txt. (Optional: alias `/sample-audit` → `/audit` if useful for SEO intent.)
**Schema:** WebPage + BreadcrumbList.
**Accept:** a prospect could be sent this link cold and "get it"; clearly not a real client.

## T7 — /ai-visibility-audit ✅ done 2026-06-03 (commercial landing; 7 categories; CTA top+bottom; WebPage+Service+FAQPage+BreadcrumbList; LeadForm; in sitemap+llms+nav+footer)
**Phase 2.** Commercial landing page for audit search intent (AI visibility audit, GEO
audit, ChatGPT visibility audit, etc.).
**Sections:** hero "See how AI search understands your business" · what the audit
checks (≥7 scoring categories, align to the 7 layers) · what you receive · who it's
for · how long it takes · what happens after submission · no-guarantee disclaimer ·
audit form CTA (above the fold AND bottom).
**Schema:** WebPage + BreadcrumbList + Service + FAQPage (if FAQ added).
**Links:** `/audit` (sample), `/ai-visibility-stack`.
**Accept:** ≥7 scoring categories; CTA top + bottom; links to sample + stack.

## T8 — /local-ai-search-optimization ✅ done 2026-06-03 (WebPage+Service+FAQPage+BreadcrumbList; in sitemap+llms+footer)
**Phase 3.** Own the local AI-visibility category.
**Sections:** why local discovery is changing · why Google Business Profile isn't
enough · how AI systems understand local businesses · the 7-layer stack applied
locally · what queryclear fixes · industries served · CTA.
**Schema:** WebPage + BreadcrumbList + FAQPage.
**Links:** `/ai-visibility-stack`, `/ai-visibility-audit`, future vertical pages.
**Accept:** clearly local; mentions service area, city, reviews, GBP, booking path, service pages.

## T9 — /geo-audit ✅ done 2026-06-03 (WebPage+Service+FAQPage+BreadcrumbList; in sitemap+llms+footer)
**Phase 3.** Capture GEO search intent without overpromising.
**Sections:** what GEO means · how queryclear defines it · how GEO relates to SEO ·
what the audit includes · what we won't promise · CTA.
**Schema:** WebPage + BreadcrumbList + Service.
**Accept:** positions GEO as a layer on top of solid SEO; not framed as magic.

## T10 — /ai-search-ready-website ✅ done 2026-06-03 (WebPage+Service+FAQPage+BreadcrumbList; in sitemap+llms+footer)
**Phase 3.** The build/optimization offer.
**Sections:** what makes a site AI-search-ready · what normal sites miss · technical
setup · content setup · schema/structured data · service-page system · internal
linking · conversion path · CTA (audit or rebuild inquiry).
**Schema:** WebPage + BreadcrumbList + Service.
**Links:** `/ai-visibility-stack`.
**Accept:** deliverables defined clearly; no guaranteed-citation claims.

## T11 — /schema-for-ai-search ✅ done 2026-06-03 (WebPage+FAQPage+BreadcrumbList; simplified code example; in sitemap+llms+footer)
**Phase 3.** Structured data, business-friendly.
**Sections:** what schema is · why machines use structured context · which types
matter (Organization, LocalBusiness, Service, FAQPage, BreadcrumbList, WebSite,
WebPage) · simplified examples · common mistakes · CTA.
**Schema:** WebPage + BreadcrumbList.
**Links:** `/ai-visibility-audit`, `/ai-search-ready-website`.
**Accept:** plain-English + simplified code examples.

## T12 — /llms-txt-for-businesses ✅ done 2026-06-03 (WebPage+FAQPage+BreadcrumbList; sample format; links to live /llms.txt; in sitemap+llms+footer)
**Phase 3.** Emerging intent, kept credible.
**Sections:** what llms.txt is · what it may help with · what it does NOT guarantee ·
why it's not a substitute for crawlable content · example structure · our
recommendation · CTA.
**Schema:** WebPage + BreadcrumbList + FAQPage.
**Accept:** explicitly states llms.txt is optional and that good crawlable content
matters more; includes a sample format. (Don't make this a signature offering.)

## T13 — Technical hardening (recurring) ✅ core complete 2026-06-05 (recurring checklist stays open for new pages)
**Phase 4, runs in parallel.** Standing checklist, not one-shot:
per-page metadata + canonical tags · BreadcrumbList/WebPage schema everywhere ·
OG image · custom 404 (`app/not-found.tsx`) · fix broken links · Google Search
Console + Bing Webmaster verified · sitemap + llms.txt kept in sync with new routes ·
Core Web Vitals + axe/Lighthouse a11y ≥90. See `test_plan.md`.
**Accept:** every shipped page passes `test_plan.md`; both webmaster tools live.

Progress 2026-06-04:
- ✅ **Build/lint/test all verified on Windows** (`npm run build` → 21 routes compile,
  TS passes; `npm run lint` clean; `npm test` 9/9). This cleared the prior blocker
  where the Linux sandbox couldn't run `next build`.
- ✅ **Custom 404** — `app/not-found.tsx`. Full Header/Footer chrome, mono `[ 404 ]`
  label, dual CTA (home + free audit), 4 destination cards, `robots:{index:false}`.
  Verified renders + returns real **HTTP 404** status (good for crawlers).
- ✅ **OG image** — `app/opengraph-image.tsx` (`next/og`, 1200×630, on-brand pine/
  paper/lime, brand mark + tagline). Auto-wired into OpenGraph + Twitter sitewide;
  prerendered static at build. Visually verified.
- ✅ **Deployed** 2026-06-05: committed 1d732f2 → pushed main → `vercel --prod` →
  live + aliased to www.queryclear.com. All routes verified 200; unknown route → 404.
- ✅ **Google Search Console + Bing Webmaster verified, sitemap submitted** (founder,
  2026-06-05).
- ☐ **Still open (recurring):** formal axe/Lighthouse ≥90 pass; keep sitemap +
  llms.txt in sync as new pages ship.

## T14 — /stack-kit offer test ✅ LIVE 2026-06-05 (founder TODO: register Stripe webhook endpoint)
**Phase 5.** Demand test for "The Local AI Visibility Stack" ($97). Landing page +
**Stripe refundable pre-order** — built before the product exists to measure intent.
Position as a funnel into the paid audit/build, not the whole business. Decision
(GATE-MODEL): audit-first stays primary; do NOT build the actual kit until this test
shows real demand.
**Design:** `docs/superpowers/specs/2026-06-05-stack-kit-offer-test-design.md`.
**Capture (founder-chosen):** Stripe Checkout pre-order $97, **refundable**; ship ≤30
days or auto-refund. `POST /api/checkout` (create session) + `POST /api/stripe/webhook`
(notify info@ via Resend on `checkout.session.completed`) + `/stack-kit/success`.
**Schema:** WebPage + Product(Offer) + FAQPage + BreadcrumbList. Add to sitemap+llms.txt.
**Env:** STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET (in
`.env.local`; must also be added to Vercel prod + webhook registered in Stripe Dashboard).
**Accept:** can drive traffic to it and measure real pre-orders before any product is built.
**Built + verified 2026-06-05:** `/stack-kit` + `/stack-kit/success` pages, `/api/checkout`
(Stripe Checkout Session) + `/api/stripe/webhook` (sig verify → Resend order notify),
`PreorderButton`. In sitemap+llms.txt. build clean (25 routes) · lint clean · tests 18/18
(4 checkout + 5 webhook added). Checkout endpoint verified end-to-end → real
checkout.stripe.com session with founder's keys. **Pending to go live:** commit/push +
`vercel --prod`, add STRIPE_* to Vercel prod env, register webhook endpoint
(`/api/stripe/webhook`) in Stripe Dashboard so its signing secret matches.

## T15–T18+ — Later (see roadmap.md) 🔒
Scorecard tool · paid audit report template · DIY kit contents (only if T14 validates) ·
one deep vertical (med spa) then templated verticals. Do not start until prior phases
ship and gates close.

---

### How to add a new card
Copy the format: `## Tn — <title> [gate?]`, then **Phase**, **Sections**, **Schema**,
**Links**, **Accept**. Keep each card self-contained so it can be executed in isolation.
