# Insurance and external launch actions

Version: 2026-08-25. These controls cannot be completed by a code or document draft. The named owner must obtain third-party evidence.

## Insurance placement brief

Give the broker the actual activities, not only the label “SEO consultant”:

- technical and content audits of public websites;
- website design/development, production deployment and maintenance;
- access to client hosting, CMS, domain, analytics and search-platform accounts;
- processing of business contacts, form submissions and limited visitor analytics;
- use of cloud hosting, Redis/KV, payment, email, public-web collection and AI providers;
- AI/search visibility analysis with explicit no-outcome-guarantee contracts;
- contractors, annual projected revenue, largest client/project, regulated-client exposure and geographic reach;
- incident response, MFA, backups, access control, contracts and subcontractor practices.

Ask the broker/counsel to determine appropriate limits, deductibles, retroactive dates and endorsements for:

- commercial general liability;
- technology/professional errors and omissions, including media/IP where appropriate;
- cyber/privacy/network security, incident response and payment/social-engineering coverage;
- crime/funds-transfer or social-engineering coverage if exposure warrants;
- workers’ compensation/employers’ liability when required; and
- hired/non-owned auto or umbrella only if the actual operations warrant them.

Required evidence before launch: policy declarations, COI, insurer claims hotline, exclusions/endorsements review, contract-required limits, renewal owner/date and confirmation the approved seller/entity and trade name are covered. A quote or application is not bound coverage.

## Government/entity actions

- [ ] Reverify SparkCreatives Inc. active status, document number, principal address and officers immediately before execution.
- [ ] Counsel confirms QueryClear’s approved operating structure and whether a Florida fictitious-name/DBA filing or other registration is required.
- [ ] File/renew the approved registration and retain receipt/certificate; update contracts, invoices, Stripe descriptors and public policies consistently.
- [ ] CPA supplies written revenue, expense allocation, sales-tax, unrelated-business-income and filing instructions.
- [ ] Board executes consent after professional conditions are incorporated.

## Cloudflare and crawler controls

Live verification on 2026-08-25 found no Cloudflare-managed blanket AI-crawler
block or `Content-Signal` response header. Treat that as a point-in-time symptom
check, not proof of the dashboard policy; retain the evidence steps below.

- [ ] Export current robots/AI crawler settings before change.
- [ ] Confirm named crawlers are allowed deliberately under the approved business policy; remediate any dashboard/WAF rule that contradicts it.
- [ ] Verify live `robots.txt`, `X-Robots-Tag`, HTML robots meta, WAF/bot responses and CDN cache for representative user agents.
- [ ] Confirm sitemap/canonical hosts and purge stale cache.
- [ ] Save dated dashboard evidence and external HTTP test output; repeat after Cloudflare rule changes.

Access permission does not guarantee indexing, training use, retrieval, citation or recommendation.

## Production account verification

- [ ] Vercel production environment variables and deployment protection reviewed; no secrets exposed to browser bundles.
- [ ] Durable Redis/KV production store available, monitored, backed by appropriate provider controls and tested fail-closed.
- [ ] Stripe live products/prices, statement descriptor, tax setting, portal, refund/cancel flow and signed webhook endpoint tested.
- [ ] Resend sending domain authentication, recipient routing, webhook and notification-failure recovery tested.
- [ ] GA4 property and client-side consent/measurement design approved; conversion events tested without collecting form contents or sensitive data.
- [ ] Search Console and Bing properties verified under client/company-owned access with backup owners.
- [ ] External audit runtime uses HTTPS/authentication, safe fetching, time/size/content limits, versioned methodology and observable failure alerts.
- [ ] Error/availability alerts have a human owner and independent notification path.
- [ ] `OUTREACH_PAUSED=true` remains set until counsel-approved outreach, suppression, sourcing and monitoring controls pass.

## Proof and go-to-market actions

- [ ] Create one redacted sample paid-audit deliverable using the production methodology and have a second reviewer reproduce the material findings.
- [ ] Complete controlled pilot engagements before making QueryClear outcome claims.
- [ ] For each case study, preserve baseline/after evidence, attribution caveats, material-relationship disclosure and signed release.
- [ ] Distinguish founder/operator/Aethelo portfolio work from QueryClear client outcomes everywhere it appears.
- [ ] Test the complete local and production journey: landing page → offer details → terms assent → paused-capacity 503/no Stripe session → approved `AUDIT_CHECKOUT_PAUSED=false` checkout/intake → durable record → notification → report access → cancellation/deletion.

## Final release authorization

The operating lead signs only after all P0 evidence in `README.md` is attached.

Release version/deployment: ______________________________________________

Open accepted risks (attach approvals): __________________________________

Operating lead: ________________________  Signature: ________________________  Date: __________

Technical owner: _______________________  Signature: ________________________  Date: __________

Board/counsel approval reference: _________________________________________
