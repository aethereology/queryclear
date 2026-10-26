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
- [ ] Shared tokens, navigation, footer and controls
- [ ] Homepage and meaningful example visualization
- [ ] Free audit acquisition and report presentation
- [ ] Pricing index grounded in existing offers
- [ ] Supporting page copy and hierarchy review
- [ ] Owner workspace presentation
- [ ] All public routes metadata, responsive and accessibility QA
- [ ] Build, unit, Redis and browser regression checks
- [ ] Preview screenshots and visual refinement
- [ ] Merge, production deployment and workflow smoke checks

## Measurement and limits

Retain consent-controlled events audit_preview_start, audit_preview_complete, audit_preview_capacity_gate and existing lead/checkout events. Compare consented start → completion → unlock and inquiry conversion by device and landing page; never infer a conversion uplift without post-release data. Private reports and admin paths stay excluded from analytics. No raw submitted URLs or email addresses in new events. Core Web Vitals require field data; payload budgets are not CWV evidence. Real owner production workflow still requires secure owner sign-in. Keep legal terms, fees, checkout behavior, API contracts and report retention intact.
