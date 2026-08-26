# QueryClear launch-control register

Status: operating baseline. Updated August 25, 2026.

This register is the source of truth for launch readiness. A repository change is not evidence that an external control is complete. Every gate below needs the named artifact or screenshot in the evidence folder before its status may change to `PASS`.

The cross-functional audit and category-by-category checklist are in
[`../launch-readiness-audit-2026-08-25.md`](../launch-readiness-audit-2026-08-25.md).

## Launch rule

- `P0` blocks paid acquisition, broad outbound, and high-ticket contracting.
- `P1` must be complete before the first affected client or production workflow.
- `P2` is a scale control and must be scheduled with an owner and due date.
- No owner may self-certify a professional opinion, insurance coverage, government filing, payment-settlement result, or third-party dashboard configuration.

## P0 — complete before scaled marketing

| Gate | Owner | Required evidence | Current status |
|---|---|---|---|
| Management facts certified | President/operating lead | Executed management representation and implementation certification | OPEN — signature required |
| Legal operating structure approved | Outside counsel | Counsel-signed concurrence selecting one structure and listing conditions | OPEN — signature required |
| Tax/accounting treatment approved | CPA | CPA-signed concurrence and written bookkeeping/filing instructions | OPEN — signature required |
| Board authorization complete | Board/secretary | Unanimous written consent plus attached counsel/CPA memoranda | OPEN — signatures required |
| QueryClear name legally cleared | Counsel/secretary | Current state search and filed fictitious-name/DBA evidence if required | OPEN — external filing check |
| Commercial agreements approved | Counsel | Approved MSA, SOWs, privacy/terms, DPA, proof release and version log | OPEN — counsel approval required |
| Insurance bound | President/broker | COI and policy declarations for applicable GL, professional/E&O and cyber coverage | OPEN — external procurement |
| Public-repo data incident closed | Security owner | Generated outreach artifacts removed from current tree, exposed tokens revoked, Git history purged or repository access restricted, incident decision retained | OPEN — 28 tokens revoked 2026-08-25; public Git history still requires owner-approved rewrite/restriction |
| AI crawler policy verified | Infrastructure owner | Cloudflare dashboard export/screenshot plus live robots/header tests for named crawlers | VERIFY — 2026-08-25 live robots/header check found no blanket block; dashboard/named-UA evidence still required |
| Production dependency/security audit clean | Technical owner | Lockfile audit, tests, build, headers and endpoint abuse tests dated for release | IN PROGRESS — repository verification required |
| Durable lead/payment records verified | Technical owner | Production-store health check, lead persistence test, signed Stripe webhook replay and reconciliation | IN PROGRESS — code plus production verification |
| Claims match fulfillment | Operating lead | Approved offer matrix, audit methodology, sample redacted deliverable, capacity sign-off, and controlled test proving `AUDIT_CHECKOUT_PAUSED=false` opens only the approved paid-audit window | IN PROGRESS — operating documents drafted; checkout defaults paused |
| Real proof policy enforced | Marketing owner | Evidence ledger and signed client release for every public outcome claim | OPEN — do not invent QueryClear results |

## P1 — complete before first affected client

| Gate | Owner | Required evidence | Status |
|---|---|---|---|
| Client intake and scope | Project owner | Signed MSA/SOW, decision-maker, access matrix, claim-risk flag and baseline | OPEN per client |
| Account security | Technical owner | Named accounts, MFA, least privilege, backup/rollback and offboarding owner | OPEN per client |
| Analytics ownership | Client/project owner | Client-owned GA4, GSC and Bing access; conversion-event test; baseline export | OPEN per client |
| Production release | Technical owner | Staging approval, QA matrix, backup, rollback test and post-launch smoke test | OPEN per client |
| Acceptance/handoff | Project owner | Written acceptance, credential/access return, training, deliverables and correction-window date | OPEN per client |
| Data processing | Privacy owner | Completed DPA schedule, approved subprocessors and deletion instructions where applicable | OPEN per client |
| Regulated claims | Client/counsel | Written approval from the client’s qualified reviewer before publication | OPEN when applicable |

## P2 — complete before volume creates operational risk

| Control | Trigger | Evidence |
|---|---|---|
| Capacity and margin review | Monthly and before adding a channel | Sold/delivered hours, contractor cost, gross margin, WIP and on-time delivery |
| Disaster-recovery exercise | At least annually and after material architecture change | Timed restore/rollback record and corrective actions |
| Vendor/security review | At least annually and before a material new subprocessor | Register, terms/DPA link, data map, access scope and exit plan |
| Claim and case-study revalidation | Quarterly | Evidence freshness, disclosure, release and presentation review |
| Tax/legal governance review | At least annually and after material offer/entity change | Board minutes and updated counsel/CPA instructions |
| Accessibility regression review | Each release plus quarterly journey test | Automated results and manual keyboard/screen-reader sample |
| Incident tabletop | At least annually | Scenario, decisions, notification analysis and follow-up owners |

## No-go conditions

Stop checkout or marketing for an affected offer if any of these is true:

- the seller/entity or tax treatment is unresolved;
- the contract describes more work than delivery capacity can support;
- `AUDIT_CHECKOUT_PAUSED` is not explicitly `false`, or the paid-audit capacity sign-off supporting that value is missing or expired;
- a public claim lacks dated evidence and permission;
- required production storage, webhook verification, report access control, backups, or rollback are unavailable;
- an engine result is presented as live when it is modeled, cached, inferred, or not reproducible;
- the client expects a ranking, lead, revenue, citation, or recommendation guarantee;
- sensitive or regulated data would enter a system not approved for it; or
- the assigned owner cannot state who receives the lead, payment, incident, cancellation, or deletion request.

## Operating documents

- `service-delivery-manual.md` — product boundaries and end-to-end fulfillment.
- `revenue-and-client-operations-runbook.md` — CRM, checkout, payment, cancellation and reconciliation.
- `security-privacy-and-incident-runbook.md` — data map, retention, subprocessors and incident response.
- `evidence-ledger-template.md` — substantiation for audits, public claims and case studies.
