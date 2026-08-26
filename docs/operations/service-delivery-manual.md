# QueryClear service-delivery manual

Version: 2026-08-25. Owner: operating lead. Review quarterly and whenever offer copy changes.

## Delivery principles

1. Sell a bounded deliverable, not an outcome controlled by a search or AI platform.
2. Separate live observations, crawler/technical measurements, third-party data, modeled estimates, and professional judgment in every report.
3. Make every finding traceable to a URL, prompt, timestamp, engine/tool, evidence capture, and recommended control.
4. Use client-owned domain, hosting, analytics and search-platform accounts where feasible.
5. Never publish a business fact, credential, review, statistic, testimonial, or regulated claim without a recorded source and approval.
6. Stage, back up, validate, approve, deploy, smoke-test, and retain a rollback path for every production change.

## Offer-control matrix

| Offer | Fixed boundary | Acceptance evidence | Escalation trigger |
|---|---|---|---|
| Free readiness check | One normalized public origin; automated, limited snapshot; no authenticated access; no implementation | Labeled result with timestamp, methodology/limitations and next step | Fetch blocked, ambiguous redirect/domain, sensitive URL, or runtime unavailable |
| $497 AI Search Audit | Up to 10 public URLs; up to 12 total prompt-engine observations distributed across up to 3 named engines chosen at kickoff; 7-business-day target after complete intake; 45-minute walkthrough; one factual-correction round | Report contains scope, seven-layer evidence, prompt-engine observation matrix, prioritized roadmap and invitation | More URLs/observations/engines, authenticated area, regulated claims, deep competitor study or implementation |
| Website Upgrade, from $2,500 | Exact pages/templates/new copy/schema/redirects/revisions/platform stated in signed SOW | Staging implementation matrix passes; client approves launch or uses it in production | Net-new design system, platform migration, unsupported integration, extra revision, page or template |
| Website Build, from $6,500 | Exact pages/components/copy/revisions/redirects/forms/platform stated in signed SOW | Approved page/integration matrix, launch checklist, production smoke test and handoff | Ecommerce, portal, complex CRM/ERP, multilingual, large migration, custom application |
| Care Plan, $997/month | Eligibility review first; monthly re-audit; up to two updates of no more than 60 minutes each and two hours aggregate; 30-minute planning exchange; two-business-day ordinary response target; no rollover | Monthly report, request log, approval, change record and time consumed | Emergency, security remediation, redesign, net-new page/site, custom development or capacity overage |

The paid audit credit applies once to an implementation SOW of at least $2,500 signed within 60 days of audit delivery. It is non-transferable and has no cash value.

## Stage 0 — qualification and capacity

Owner: sales/operating lead. Target: one business day.

- Confirm legal business name, primary domain, services, locations, buyer, decision-maker, budget range, timing and platform.
- Ask what outcome prompted the inquiry without converting it into a guarantee.
- Flag medical, legal, financial, safety, franchise, licensing, testimonial, environmental or efficacy claims for qualified client review.
- Check fit: public service-business site, supportable platform, responsive owner, lawful business and realistic scope.
- Check capacity using committed delivery hours, not revenue alone. Reserve at least 20% of weekly delivery capacity for QA, support and rework.
- Keep `AUDIT_CHECKOUT_PAUSED=true` until seller/entity, offer, production controls, and capacity are approved. Set it to `false` only for an approved paid-audit sales window; return it to `true` before capacity is exhausted.
- Send the approved MSA/SOW or open paid checkout only after seller/entity and offer are approved for use.
- Record source, consent/relationship, requested service, next action, owner, due date and loss reason in the durable lead record.

Disqualify or refer work requiring deceptive review tactics, doorway pages, hidden text, fabricated credentials/proof, policy evasion, illegal scraping, guaranteed placement, or unsupported regulated claims.

## Stage 1 — contract, payment and intake

Owner: project owner. Do not start until all required fields are complete.

- Executed MSA and SOW, or checkout assent to the approved versioned terms.
- Cleared deposit/payment milestone and matching durable transaction record.
- Client decision-maker and consolidated-feedback method.
- Domain/platform inventory, access owner, approved named accounts and MFA.
- Scope matrix: URLs/templates/prompts/engines/deliverables/exclusions/revisions/milestones/acceptance.
- Business-fact register: legal/public name, address/service area, phones, licenses, credentials, people, services, prices, policies and supporting sources.
- Data-risk questionnaire and DPA schedule if QueryClear will process personal data for the client.
- Baseline date and agreed success indicators. Examples: valid indexed pages, non-brand impressions, qualified form/call events, conversion path completion and sampled live-engine citation presence. Never promise a value.

## Stage 2 — baseline and evidence capture

Owner: auditor. A second person reviews any high-severity finding before delivery.

Create a read-only evidence folder named `client-project/YYYY-MM-DD-baseline`. Record timezone and tool versions where material.

### Technical capture

- HTTP status/redirect chain, canonical, robots meta/header, robots.txt, sitemap membership and alternate hosts.
- Rendered title, description, headings, primary content, internal links, image alternatives and client-side rendering dependencies.
- Structured data extracted from rendered HTML and whether every asserted fact is visible and supported.
- Mobile viewport, keyboard path, form validation, error/success behavior and primary conversion events.
- Core Web Vitals field data when available; otherwise clearly label lab measurements.
- GA4, GSC and Bing ownership/access and dated baseline exports when the client authorizes access.

### Live answer-engine sampling

- Freeze a matrix of no more than 12 total prompt-engine observations before testing and document why each exact prompt maps to a buyer stage. One prompt checked in one named engine is one observation; the same prompt checked in three engines consumes three observations, and every repeat check consumes another observation.
- Distribute the observation matrix across no more than three named engines selected at kickoff. Do not describe the scope as 12 prompts per engine or as 12 distinct prompts unless the frozen matrix actually uses 12 distinct prompts once each.
- Record the exact engine/product, access mode, account/location state if known, date/time and exact prompt.
- Capture the complete relevant response, cited sources/links and whether the client appears. Do not reduce “mentioned,” “cited,” “recommended,” and “ranked” to one metric.
- Repeat only according to a predefined sampling rule. Do not cherry-pick favorable runs.
- Label failed/blocked runs as missing observations; do not silently replace them with a modeled score.
- A failed or blocked prompt-engine check still consumes its scheduled observation; record the failure rather than silently substituting an unplanned run. Any owner-approved repeat also consumes another observation.
- Follow applicable platform terms and do not imply that a small prompt sample represents all users.

### Seven-layer assessment

Every layer needs a definition, observable checks, scoring rule, confidence/limitation and remediation link. Maintain the rubric version in the report. A total score is a prioritization device, not a validated probability of traffic, leads, or AI inclusion.

1. Crawl access and indexability.
2. Entity identity and consistency.
3. Service/location topical clarity.
4. Evidence, experience and trust support.
5. Answer structure and extractability.
6. Technical performance/accessibility and structured data.
7. Conversion path and measurement readiness.

## Stage 3 — analysis and roadmap

For each finding record:

- finding ID, affected URLs/layer and evidence reference;
- observed fact versus inference;
- severity: `Critical`, `High`, `Medium`, or `Low`;
- user/business risk and why it matters;
- exact recommended control and owner;
- estimated effort band, dependency and validation method; and
- whether the work is in the purchased scope.

Severity means:

- `Critical`: materially prevents access/conversion, exposes sensitive data, creates legal/deceptive-claim risk, or breaks checkout/lead capture.
- `High`: likely affects discovery, factual trust, major journey completion, or measurement across important pages.
- `Medium`: meaningful but narrower quality/clarity/performance issue.
- `Low`: polish or marginal optimization with limited near-term risk.

Roadmap ordering is risk/dependency first, then effort and expected controllable benefit. Never convert correlation or a third-party estimate into causal certainty.

## Stage 4 — quality review and audit delivery

Reviewer checklist:

- scope counts match the order;
- evidence links open and timestamps/engine labels are present;
- live, modeled, cached and inferred results are unmistakably separated;
- claims about the client match approved sources;
- no ranking, traffic, lead, revenue, citation or recommendation promise appears;
- score math matches the rubric version;
- recommendations are technically feasible on the named platform;
- regulated/high-risk statements are flagged, not approved by QueryClear;
- private report access is authenticated or signed/expiring and responses are `no-store`; and
- the report includes limitations, correction process and upgrade-credit terms.

Deliver privately. Log delivery time, access recipient and the correction deadline. During the walkthrough, distinguish defects/factual errors from new scope or differences in professional judgment.

## Stage 5 — implementation

Owner: technical lead. No direct unreviewed production edits.

1. Confirm current backup/export and rollback owner.
2. Create a staging/preview deployment and record the source revision.
3. Implement only items in the signed matrix. Use a change order for additions.
4. Validate status codes, redirects, canonicals, robots, sitemaps, metadata, visible content/schema agreement, internal links, forms, consent text, analytics events, mobile layout, keyboard path and major performance regressions.
5. Capture before/after evidence without claiming a modeled or technical score is an external outcome.
6. Obtain the client decision-maker’s written launch approval.
7. Deploy during the agreed window, smoke-test primary pages/forms/events, and monitor errors.
8. Roll back if a Critical defect, material data exposure, widespread 5xx response, broken primary conversion, or unintended indexing block cannot be promptly corrected.

## Stage 6 — acceptance, correction and handoff

- Send the final implementation matrix and request acceptance under the SOW.
- Record production revision, launch time, smoke-test evidence and any accepted exception.
- Provide client-owned source/deliverables, platform notes, account/access matrix and maintenance dependencies.
- Remove QueryClear/contractor access that is no longer needed and record offboarding.
- Open the 30-day implementation defect-correction window. Paid-audit factual corrections follow that SOW’s seven-calendar-day window.
- Export the agreed post-launch baseline and state when 30/60/90-day measurement reviews belong to the client, Care Plan, or a separate SOW.
- Ask for a testimonial/case-study release only after results exist; do not condition service or remedy on permission.

## Care Plan request flow

1. Confirm active payment and supportable site status.
2. Log request, business purpose, risk, approval and effort estimate.
3. Classify as included small update or separate quote before work starts.
4. Stage/validate/approve/deploy using the same controls as implementation.
5. Deduct actual time from the monthly aggregate and show it in the monthly report.
6. Preserve unused capacity as expired; do not silently create backlog or rollover promises.

## Required delivery records

- signed agreements and change orders;
- payment/transaction reference;
- intake, business-fact register and access matrix;
- baseline and evidence ledger;
- report/rubric version and reviewer sign-off;
- implementation and QA matrices;
- client approvals, acceptance and exceptions;
- launch/rollback/handoff/offboarding record; and
- claim release and substantiation, if public proof is authorized.
