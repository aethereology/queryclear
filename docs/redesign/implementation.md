# QueryClear redesign — implementation record

## Product audit and direction

Reviewed October 25, 2026: live homepage, source route inventory, free submission → preview → email unlock → full report, paid checkout components, inquiry form, owner workspace, metadata, consent and report exports. Existing issues: long repetitive homepage, competing five-outcome/seven-layer terminology, lime-tinted full-screen decoration, dashed borders and clipped controls throughout, complex navigation, illustration resembling live analytics, and no concise pricing index. No public customer account dashboard exists: the authenticated audit console is owner-only. Keep this distinction explicit.

Position: website clarity, supported by evidence. QueryClear helps service businesses and the marketers/agencies supporting them understand how their public pages communicate to people, search systems and AI discovery experiences. The free preview fetches at most five public pages and models answer scenarios. Paid audit and implementation services are human-delivered. No live-engine visibility promise or overall automated score.

Primary conversion: start free preview. Secondary: human-reviewed paid audit or implementation inquiry. Existing billing configuration is the source of truth; no invented subscription entitlements. Brand voice: specific, calm, useful, accountable. Terminology: on-page findings (observed HTML), modeled scenarios (hypotheses), action plan (recommendations requiring review), readiness rubric (separate human/self assessment).

Research (official sources): Linear features https://linear.app/features; Vercel https://vercel.com/platform; Stripe https://stripe.com/payments; Attio https://attio.com; Profound https://www.tryprofound.com/features; Peec https://peec.ai/product/ai-visibility; Otterly https://help.otterly.ai/how-otterlyai-collects-data; Ahrefs https://ahrefs.com/site-audit. These show opportunities to apply concise hierarchy, product context, progressive disclosure and evidence provenance. Profound/Peec/Otterly focus on measured AI visibility; QueryClear's current free product must be positioned as a bounded readiness review.

## Design system

Direction: The clarity workspace. Warm white canvas, white panels, deep forest text, muted sage surfaces, restrained chartreuse accent. Existing open-Q mark retained for recognition. Bricolage display, Plex Sans body and Plex Mono only for metadata; reuse existing self-hosted Next font output. Rounded rectangular controls, solid hairlines, consistent 8px rhythm, generous reading space, visible focus. No essential information in motion or color alone. Product examples explicitly illustrative. No fabricated charts, customers or counts.

## Release checklist

- [x] Current architecture, commercial offers and auth inspected
- [x] Positioning and design direction selected
- [x] Shared tokens, navigation, footer and controls
- [x] Homepage and meaningful example visualization
- [x] Free audit acquisition and report presentation
- [x] Pricing index grounded in existing offers
- [x] Supporting page copy and hierarchy review
- [x] Owner workspace presentation
- [x] All public routes metadata, responsive and accessibility QA
- [x] Build, unit, Redis and browser regression checks
- [x] Preview screenshots and visual refinement
- [ ] Merge, production deployment and workflow smoke checks

## Measurement and limits

Retain consent-controlled events audit_preview_start, audit_preview_complete, audit_preview_capacity_gate and existing lead/checkout events. Compare consented start → completion → unlock and inquiry conversion by device and landing page; never infer a conversion uplift without post-release data. Private reports and admin paths stay excluded from analytics. No raw submitted URLs or email addresses in new events. Core Web Vitals require field data; payload budgets are not CWV evidence. Real owner production workflow still requires secure owner sign-in. Keep legal terms, fees, checkout behavior, API contracts and report retention intact.


## Route and copy review

Public inventory: /, /free-audit, /pricing, /ai-visibility-audit, /website-upgrade, /ai-search-ready-website, /care-plan, /about, /contact, /audit-methodology, /ai-visibility-stack, /geo-audit, /schema-for-ai-search, /llms-txt-for-businesses, /local-ai-search-optimization, /med-spa-ai-search-optimization, /scorecard, /audit, /privacy and /terms. Shared chrome, controls, surfaces and typography apply across these routes. Headlines and acquisition copy were rewritten where vague; useful technical guidance and existing contractual details were retained after review. There is no separate public blog, product/features page or customer dashboard to migrate. Existing educational routes provide the resource architecture.

Private/noindex inventory includes /admin/audits, /admin/social, /outreach, /reports/[slug], /r/[token], checkout success pages, /thank-you, the retired /stack-kit and the unlaunched /ai-search-operator. Keep access, noindex and commercial status intact. The operator remains early access; remove the unverified five-partner scarcity claim and preserve explicit human approval. No customer dashboard or autonomous editing capability is promised.

Sample reports: /audit retains the existing fictional human-reviewed report; /audit?view=automated exposes the real automated report component with a hand-authored, clearly fictional dataset. No crawl, model call, trend, benchmark or visibility score is implied. The report can be inspected without requiring a lead email. Downloaded example text retains the fictional labels in the page title, evidence and details.

Legal language, refund/credit provisions, prices and entitlements are preserved. Typography and layout changes do not amend the Terms or Privacy Policy. No customer/customer-logo/social-proof content was invented.


## Verification record

Revision bde75ee passed 356 unit/contract tests, two real-Redis recovery integration tests, the production build, lint, typecheck, dependency security and all 180 browser checks across 360/768/1280/1536 widths. Expanded coverage exposed and fixed mobile pricing-heading overflow, a Care Plan price overflow, and keyboard-inaccessible scrollable examples. Responsive screenshots were inspected; a deployed code example was confirmed keyboard-focusable and arrow-scrollable. Final copy/formatting changes receive the same gate before merge. Current merge/deployment outcome is recorded on https://github.com/aethereology/queryclear/pull/13; the checklist above is the pre-release implementation snapshot.

Production smoke checks after the separate owner-recovery release passed: public audit page, private-address rejection with support ID and no-store response, and Python authentication enforcement. Final redesign deployment receives fresh smoke checks. Remaining limits: field Core Web Vitals and conversion impact need real post-release data; the owner-only console requires secure owner sign-in for its authenticated production walkthrough. Existing 6-hour public smoke checks and weekly production dependency reviews remain active. The previous production deployment and Git commits provide the rollback path.
