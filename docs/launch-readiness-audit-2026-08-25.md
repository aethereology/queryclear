# QueryClear launch-readiness audit

Audit date: 2026-08-25
Operator: SparkCreatives Inc. d/b/a QueryClear
Decision: **Do not scale paid acquisition yet.** The local product and operating system are materially stronger, but the P0 external gates below still require accountable human sign-off and production evidence.

This register distinguishes work that can be proven in the repository from legal, tax, insurance, identity, customer-proof, and production-account facts that cannot be manufactured in code.

## Status key

- **DONE** — implemented and locally verified.
- **CONTROLLED** — intentionally disabled or quarantined until its launch gate is met.
- **OPEN** — requires evidence, an external account, or an authorized decision.
- **P0** — blocks paid launch or aggressive outreach.
- **P1** — complete before meaningful scale.
- **P2** — improve after the first controlled deliveries.

## Executive assessment

The offer ladder is commercially coherent: free automated preview → $497 human audit → $2,500+ upgrade → $6,500+ build → eligibility-only care plan. The principal risk was not the visual design. It was the gap between persuasive marketing and a defensible operating business: ambiguous entity/tax treatment, underspecified fulfillment, thin proof, spoofable purchase states, non-durable operations, public report-link exposure, and production controls that could silently fail open.

The repository now addresses the controllable portion of those risks. QueryClear should open only a small, capacity-approved audit cohort after every P0 item is evidenced. The $497 audit should be treated as a diagnostic and implementation-credit product, not an uncapped high-touch consulting engagement.

## P0 launch blockers

- [ ] **Public-repository history containment — owner.** Current tracking of the two telephone artifacts has been removed and all 28 exposed report tokens were revoked (73 scoped Redis keys deleted; zero remain). However, commit `a76f719` still preserves contact data and dead report URLs in public history. Immediately make the repository private and choose an owner-authorized history rewrite/force-push procedure with collaborator coordination. Do not publish or push the current deletions as if they erase history.
- [ ] **Counsel concurrence — counsel.** Execute the counsel concurrence, approve or revise the public Terms, Privacy Policy, MSA, SOW templates, DPA/security addendum, contracting name, dispute terms, accessibility posture, and state/customer-specific requirements.
- [ ] **CPA concurrence — CPA.** Execute the CPA concurrence and document earned-income classification, unrelated-business-income treatment, Form 990/990-T implications, expense allocation, sales-tax treatment, bookkeeping, reserves, and nexus monitoring.
- [ ] **Corporate authorization — board/secretary.** After counsel and CPA concurrences, complete the director count and roster, attach the final referenced exhibits, execute unanimous written consent, and retain the secretary certification.
- [ ] **Management certification — authorized officer.** Execute only after the final approved legal/tax exhibits are attached and the implementation representations are true.
- [ ] **Florida name/status evidence — management/counsel.** Reverify SparkCreatives Inc. status immediately before signing and confirm/register the QueryClear fictitious name or document the applicable exemption. Florida states that a DBA different from the entity's legal name generally must be registered before doing business.
- [ ] **Insurance — management/broker.** Bind and archive appropriate technology E&O/professional liability, cyber/privacy, and general liability coverage, including subcontractor and AI/search-service disclosures.
- [ ] **Founder identity and authority — founder.** Approve a full professional name, current headshot, substantive bio, role/authority, and at least one verifiable professional profile. The site currently uses only supportable facts and does not invent credentials.
- [ ] **Real proof — founder/client.** Add no testimonial or case study until results, measurement caveats, permission, and a signed release exist. Broader studio work may be linked only when clearly labeled as broader operator work, not QueryClear outcomes.
- [ ] **Production systems — technical owner.** Configure and smoke-test Vercel, Stripe live mode and webhook retries, Redis, private Blob storage, Resend, runtime authentication/timeouts, report-cookie exchange, lead delivery, buyer intake, refund/dispute projection, and reconciliation. Archive timestamps, request/event IDs, and screenshots without secrets.
- [ ] **Measurement — marketing/technical owner.** Supply a valid GA4 measurement ID, verify consent-before-load and no-PII event payloads in production, configure key events, and recheck Google Search Console and Bing Webmaster Tools after deployment.
- [ ] **Capacity sign-off — delivery owner.** Prove the sample deliverable, intake checklist, evidence ledger, seven-business-day capacity, walkthrough scheduling, and backup coverage. Keep `AUDIT_CHECKOUT_PAUSED=true` until the approved cohort can be fulfilled.

## Brand and trust signals

### DONE or controlled in the repository

- [x] Seller identity consistently names SparkCreatives Inc. as the legal operator and QueryClear as its brand.
- [x] Public address, entity type, document number/EIN context, service-fee language, and operator relationship are disclosed without calling a commercial fee a donation.
- [x] About content identifies the founder/lead operator only to the level supported by current evidence.
- [x] Terms and Privacy match the implemented forms, Stripe flow, email systems, private reports, retention, AI providers, analytics consent, and client responsibilities.
- [x] Separate MSA, fixed-scope SOWs, DPA/security addendum, and case-study/testimonial release templates exist.
- [x] Counsel, CPA, board, and management execution documents exist with controlled sequencing and blank signature/roster fields.
- [x] No fabricated testimonials, reviews, certifications, customer outcomes, or guaranteed rankings/citations are used.
- [x] Broader operator portfolio evidence is clearly separated from QueryClear-specific proof.
- [x] Accessibility statement and contact/remedy paths are included in the public legal/trust system.
- [x] Care Plan is eligibility-only; the retired Stack Kit and experimental Operator are not presented as purchasable primary offers.

### OPEN before launch or scale

- [ ] Counsel-approved final versions replace every legal file marked draft.
- [ ] CPA and board records substantiate the not-for-profit corporation's commercial activity and controls.
- [ ] DBA/fictitious-name, local business-tax, state sales-tax, foreign qualification/nexus, and regulated-client requirements are resolved.
- [ ] Professional insurance declarations and incident contacts are archived.
- [ ] Founder identity/professional profile and real, released proof are published.
- [ ] A human-monitored support path and response SLA are tested from an outside inbox.

## Technical and AI-search foundation

### DONE or controlled in the repository

- [x] Next.js and related packages are updated; the production dependency audit is clean.
- [x] Canonicals, unique metadata, sitemap, robots rules, page-level indexing controls, `llms.txt`, 404 behavior, and private-route noindex/no-store headers are defined.
- [x] Organization, Brand, WebSite, WebPage, Service, FAQ, Breadcrumb, and offer data are emitted only where the visible facts support them.
- [x] The Operator and retired surfaces are noindex and excluded from primary discovery paths.
- [x] HSTS, MIME-sniff protection, frame denial, restrictive permissions policy, referrer controls, and a restrictive source policy are configured.
- [x] Public reports use private storage, short-lived access exchange, no-referrer/no-store controls, and validated evidence provenance.
- [x] Public audit requests validate URLs and protect against SSRF, oversized payloads, abusive request rates, demo fallback, and runaway provider/crawl latency.
- [x] Public audit network work is bounded to a 35-second worst-case window and produces safe timeout behavior.
- [x] Lead, audit, checkout, social-admin, outreach, and webhook operations use bounded inputs, origin/secret checks where applicable, durable state, and fail-closed shared rate limiting.
- [x] Stripe fulfillment validates the current product, exact USD amount, paid/complete state, current terms assent, request ID, buyer email, and public website before buyer fulfillment.
- [x] Email delivery uses stable idempotency keys and durable per-channel state; invalid/legacy offers route to manual review.
- [x] Outreach sending defaults paused and its locally generated telephone artifacts are quarantined/ignored.
- [x] GA4 code loads only after explicit consent; conversion events exclude names, emails, submitted site URLs, and form text.
- [x] A production launch checker covers canonical URL, GA4, storage, email, Stripe, report access, runtime authentication, and paid-audit capacity state.

### OPEN production evidence

- [ ] Deploy the reviewed tree to a preview, then production, without copying development/demo secrets.
- [ ] Verify www/apex redirects, TLS/HSTS, CDN/WAF behavior, CSP console behavior, and named AI-crawler responses at the edge.
- [ ] Confirm GA4 consent mode, page views, and conversion events in DebugView/Realtime without PII.
- [ ] Revalidate structured data with current Google tooling and inspect representative rendered HTML as anonymous crawlers.
- [ ] Confirm Search Console/Bing ownership, sitemap acceptance, index coverage, crawl errors, and canonical selection.
- [ ] Run live-mode Stripe checkout only after capacity approval; verify signed webhook delivery, duplicate replay, partial email retry, refund, dispute, and reconciliation.
- [ ] Verify Resend domain authentication, DMARC alignment, bounce/complaint suppression, and buyer/owner delivery from external inboxes.
- [ ] Verify Redis and Blob retention/deletion, backup/recovery, access logging, and least-privilege production credentials.
- [ ] Test the production audit runtime against permitted, blocked, redirected, slow, IPv4/IPv6, and malformed targets.
- [ ] Make the code repository private or complete the approved history remediation before any further operational data can enter it.

## Messaging and positioning

### DONE

- [x] The promise is now “clearer, more credible source material and measurable readiness,” not control over third-party rankings or citations.
- [x] The Seven Layers framework uses one consistent layer set and transparent readiness scoring; it is positioned as a diagnostic method, not proprietary proof of an outcome.
- [x] The free audit is explicitly an automated, read-only readiness preview with modeled scenarios—not a live ChatGPT/Claude/Google ranking test.
- [x] The $497 audit is human-reviewed and capped at one public site, 10 URLs, and 12 total prompt-engine observations across up to three named engines. One prompt checked in one engine consumes one observation; repeats and blocked/failed checks also consume capacity.
- [x] Audit timing begins after complete intake, includes a 45-minute walkthrough and one factual-correction round, and excludes implementation/private systems/extra scope.
- [x] The $497 implementation credit has a minimum project, same-site, one-use, non-cash, 60-day rule.
- [x] Website Upgrade and Website Build state starting prices, concrete inclusions, exclusions, assumptions, revision limits, client dependencies, and change-order boundaries.
- [x] Care Plan states eligibility, monthly limits, non-rollover, response target, cancellation, and exclusions.
- [x] `llms.txt`, schema, FAQs, landing pages, emails, and legal scopes describe the same offers.

### P1 commercial validation

- [ ] Deliver three to five tightly controlled audits and record actual labor by task before increasing traffic.
- [ ] Confirm that $497 covers acquisition support, research, report production, walkthrough, corrections, payment fees, and follow-up—or narrow scope/raise price.
- [ ] Track audit-to-upgrade conversion separately from audit gross margin; the audit may be rational as paid discovery even if its standalone margin is modest.
- [ ] Define ideal-customer exclusions: poor-fit budgets, unsupported platforms, multi-location complexity, regulated-claim risk, missing client access, and urgency beyond capacity.
- [ ] Test one vertical at a time with real proof; do not template thin location/industry pages before demand and evidence exist.

## User experience and conversion

### DONE

- [x] Navigation leads with free audit, paid audit, implementation paths, method, proof resources, company, and contact.
- [x] A dedicated Website Upgrade page closes the gap between the audit and the $6,500+ build.
- [x] Primary pages have one clear H1, main landmark, canonical, relevant CTA, and honest next-step copy.
- [x] Lead forms normalize website URLs, reject malformed credentials/ports, expose field errors accessibly, carry privacy/terms notice, and avoid promising acceptance or results.
- [x] Checkout requires current Terms assent, uses a stable request ID, shows capacity-specific failures, and cannot open unless the explicit sales-window switch is false.
- [x] Purchase success is verified server-side; retired/Care success URLs do not spoof a purchase.
- [x] Free-audit result transitions move focus to the new result; input errors return focus to the field.
- [x] Mobile navigation supports Escape-to-close and focus return; animations respect reduced motion and content remains visible without animation.
- [x] Optional analytics preferences remain accessible after the first decision and analytics stays off when configuration is absent/invalid.

### OPEN conversion evidence

- [ ] Replace placeholder founder credibility with approved identity/profile assets.
- [ ] Add released customer proof near high-intent CTAs only after substantiated results exist.
- [ ] Confirm the contact inbox, reply identity, calendaring path, response ownership, and after-hours expectations.
- [ ] Record baseline conversion rates for landing → free audit → unlocked report → consultation → paid audit → implementation.
- [ ] Run mobile/desktop production accessibility, console, checkout-pause, lead-delivery, and analytics QA after deployment.
- [ ] Review generated telephone/cold-outreach assets before unpausing; current local generators are not approved fulfillment evidence.

## Launch sequence

1. Contain the public repository and decide history remediation.
2. Obtain counsel and CPA signatures; finalize legal/tax exhibits.
3. Complete board consent and management certification in that order.
4. Bind insurance and approve founder identity/proof assets.
5. Configure production systems with outreach and checkout still paused.
6. Run production smoke, privacy, accessibility, payment, refund/dispute, and measurement tests; archive evidence.
7. Approve a small delivery cohort and set `AUDIT_CHECKOUT_PAUSED=false` only for that sales window.
8. Deliver and time three to five audits; close defects before paid acquisition.
9. Add released proof, refine vertical positioning, and scale only while capacity and service quality remain inside the written limits.

## Primary external references

- IRS, unrelated business income: https://www.irs.gov/charities-non-profits/unrelated-business-income-defined
- IRS, substantially related activity: https://www.irs.gov/charities-non-profits/substantially-related
- IRS, private benefit/inurement: https://www.irs.gov/charities-non-profits/charitable-organizations/inurement-private-benefit-charitable-organizations
- Florida Division of Corporations, fictitious-name registration: https://dos.fl.gov/sunbiz/start-business/efile/fl-fictitious-name-registration

This audit and the included templates are operational drafts, not a substitute for advice from the retained counsel, CPA, insurer, or other licensed professional responsible for the decision.
