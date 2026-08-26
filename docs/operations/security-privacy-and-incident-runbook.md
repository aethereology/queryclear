# QueryClear security, privacy and incident runbook
Version: 2026-08-25. Owners: technical owner and privacy/operating lead. Counsel decides legal notification obligations; the CPA decides accounting-record requirements.

## Data minimization and approved flows

| Data/process | Typical fields | Approved purpose | Default retention target |
|---|---|---|---|
| Public-audit transient cache | Normalized public URL, technical observations, generated result, abuse counters | Deliver and protect the free snapshot | No more than 24 hours |
| Inquiry/CRM | Business contact, company/domain, service/message, source, lifecycle and consent/suppression | Respond, qualify, contract and document relationship | Declined/abandoned: 24 months after last interaction |
| Client/project | Contract, facts, access register, delivery evidence, approvals and communications | Deliver, support and defend services | 7 years after project/relationship end, subject to professional advice |
| Transaction/accounting | Customer/order IDs, fees, invoices, refund/dispute and webhook audit state | Payment, accounting, tax, fraud and dispute control | 7 years, subject to CPA/counsel instructions |
| B2B outreach activity | Business contact/source, messages, responses and status | Lawful business development and compliance | 18 months after last interaction when no active relationship |
| Suppression | Minimum email/domain/token, reason and date | Honor opt-out and prevent re-import | Retain the minimum needed while suppression must be honored |
| Security logs | Timestamp, event/account/request metadata, status and risk details | Detect, investigate and demonstrate control | 12 months online unless risk/law requires more; document exceptions |
| Case-study substantiation | Release, source metrics, dates, disclosure and approved assets | Support public proof | While claim is used plus applicable claims limitation period |

These are management defaults for professional approval. A legal hold overrides routine deletion. Do not retain data merely because storage is inexpensive.

## Subprocessor register

Complete and verify this register against live accounts and contracts before publishing or attaching it to a DPA.

| Provider/system | Role | Data expected | Public/client data? | Account owner | Contract/DPA and region | Exit/deletion check |
|---|---|---|---|---|---|---|
| Vercel | Web hosting/deployment/function logs | Requests, limited logs, deployed code/config | Both | ______ | ______ | ______ |
| Cloudflare | DNS/CDN/security controls if active | Request/network metadata | Both | ______ | ______ | ______ |
| Upstash/Vercel KV-compatible Redis | Durable operations, audit and abuse state | Business contacts, URLs, event state | Both | ______ | ______ | ______ |
| Stripe | Checkout, payment and subscriptions | Customer/business contact and transaction data | Client | ______ | ______ | ______ |
| Resend | Transactional email | Business contact and message content | Client | ______ | ______ | ______ |
| Microsoft Graph/Microsoft 365 | Approved mailbox workflows if enabled | Email/message metadata and content | Client | ______ | ______ | ______ |
| Apify | Approved public-web collection if enabled | Public pages/listings and run metadata | Public | ______ | ______ | ______ |
| OpenAI | Approved social/drafting or other configured workflows | Minimized prompt/content only | Depends | ______ | ______ | ______ |
| External audit runtime | Public page retrieval/analysis | Submitted public URL and observations | Public | ______ | ______ | ______ |
| GA4 / Search Console / Bing | Client measurement/search administration | Site events/search performance | Client | ______ | ______ | ______ |

Remove providers not active in production. Add monitoring, error, CRM, support, analytics, contractor or storage tools before they receive data. Record link to current terms/DPA, processing region, security review, access owner, retention/deletion and replacement plan.

## Access and change controls

- Require unique named accounts and MFA where supported; no shared credentials in email, chat, source control or client documents.
- Prefer client invitations and least-privilege roles. Record grant, owner, purpose, review date and removal.
- Keep production, preview/test and client environments separated. Use test-mode payment resources for tests.
- Store secrets in the approved deployment secret manager. Scan commits and rotate immediately after suspected exposure.
- Protect main/release changes with review and passing tests. Record emergency changes and review them afterward.
- Maintain client/source backups or exports and a tested rollback procedure proportionate to the change.
- Remove access at handoff, personnel departure, vendor exit and when no longer necessary.

Review privileged access quarterly and every client-project close. Review production dependencies and platform advisories at least monthly and before a material release.

## Public endpoint and report controls

- Normalize and validate public URLs server-side; allow only `http/https` and reject credentials, fragments where irrelevant, nonstandard destinations and redirect escapes.
- Resolve/check every destination and redirect against loopback, link-local, private, reserved and metadata networks; protect against DNS rebinding.
- Apply connection/response timeouts, redirect limits, response-size limits and supported content-type checks.
- Rate-limit using a durable store and cost cap. Production fails closed when the control store is unavailable.
- Treat fetched content as hostile input. Do not execute it with privileged network access or expose internal error details.
- Private reports require authenticated access or signed expiring tokens; use `Cache-Control: private, no-store` and prevent indexing.
- Webhooks require signature verification over the raw body, timestamp tolerance where supported, durable idempotency and observable retries.

## Backup, recovery and continuity

For each production component record recovery owner, export/backup method, retention, restore instructions, recovery-time objective and acceptable data-loss window. Test at least annually and after material architecture changes.

Minimum release recovery evidence:

- last known-good source revision/deployment;
- configuration/secrets owner without exposing secret values;
- database/KV export or provider recovery method;
- DNS/CDN rollback steps;
- form/checkout alternative contact path; and
- communication owner for client-impacting downtime.

## Incident severity

- `SEV-1`: confirmed sensitive-data exposure, active account takeover, payment/checkout compromise, destructive production event, or widespread critical outage.
- `SEV-2`: material client-data risk, unauthorized privileged access, sustained lead/payment loss, major production outage or report-access exposure.
- `SEV-3`: contained low-sensitivity event, limited availability defect, suspicious activity without confirmed impact or recoverable notification backlog.
- `SEV-4`: control weakness or near miss with no known unauthorized access or material service effect.

When uncertain, start at the higher plausible severity and downgrade with evidence.

## Incident response procedure

### 1. Detect and open record

Record incident ID, reporter, discovery time/timezone, systems, initial facts, severity and incident commander. Preserve logs and do not edit evidence in place.

### 2. Contain

Revoke/limit affected access, rotate exposed secrets, pause compromised endpoints/automation, isolate unsafe deployments and preserve a safe client contact/checkout path. Avoid destructive cleanup until evidence and recovery needs are understood.

### 3. Assess

Determine what happened, earliest/latest time, data and people affected, source, persistence, integrity/availability impact, vendors/jurisdictions/contracts and whether the event is ongoing. Separate confirmed facts from hypotheses.

### 4. Escalate and notify

Notify the president/operating lead and technical owner for SEV-1/2 immediately. Contact counsel, insurer/breach coach, affected client and relevant provider according to contracts/policy. Counsel determines regulator/individual notice duties and timing. Do not promise confidentiality, privilege, cause or scope before review.

### 5. Eradicate and recover

Remove the cause, patch/reconfigure, validate credentials and dependencies, restore from known-good state, test primary journeys and monitor for recurrence. Obtain owner approval before resuming paused automation or checkout.

### 6. Close and improve

Within five business days for SEV-1/2, document timeline, root/contributing causes, impact, decisions, notifications, recovery evidence and corrective actions with owner/due date. Conduct a blameless review while retaining accountability for control completion.

## Incident contact sheet

Complete this offline and in an access-controlled location:

- Incident commander primary/backup: ______________________________
- Technical containment primary/backup: __________________________
- President/Board contact: _______________________________________
- Outside counsel/breach counsel: _________________________________
- Cyber/GL/E&O insurer and policy hotline: ________________________
- Vercel/Cloudflare/Upstash support path: _________________________
- Stripe emergency/support path: _________________________________
- Resend/mail provider support path: ______________________________
- Client notification owner/template location: ____________________

## Data request and deletion procedure

1. Log request and verify requester authority without collecting excessive identity data.
2. Identify QueryClear’s role: independent controller/business record or processor acting for a client.
3. Preserve legal holds and route client-controlled requests to the client where appropriate.
4. Search the documented systems, export/correct/delete as approved, and record exceptions and completion.
5. Retain only the minimum suppression, security, tax, legal-claim or backup record allowed by policy/law.
6. Confirm completion through the approved channel without exposing another person’s data.
