# Owner audit console

The private workspace at `/admin/audits` runs the existing single-page audit and displays its evidence, action checklist, text download and print report. It sends no email and creates no customer accounts. The existing public workflow is unchanged.

## Access and deployment

Uses the existing signed `social_admin` HttpOnly, Secure production cookie (12-hour expiry), existing login rate limiter, and session-bound CSRF token. POST additionally checks same origin. Login redirects accept only the fixed `audits` target or existing social destination. Server authentication precedes report/history access and paid work. Missing administrator configuration denies access.

Production currently has no `SOCIAL_ADMIN_SECRET` configured. The owner must securely set a strong random value of at least 32 characters in Vercel's production environment, retain it in their password manager, then redeploy and sign in. Never put this credential in chat, source control or a public-prefixed environment variable. This activates the existing administrator identity, which also has access to the pre-existing social console; outreach pause settings are not changed. No secret was created or rotated in this release.

## Limits and storage

Runs reuse the public pipeline's URL/SSRF validation, IP limits, global daily spending reservations and Python runtime diagnostics. A bounded Redis list stores only metadata for the latest 40 owner-created reports. History and report API responses require administrator authentication and are never cached. History rows are filtered at expiry; list retention is 24 hours. Report retention uses the existing configured TTL capped at 24 hours. History write failures preserve the current report and explicitly prompt downloading it.

Underlying reports retain the existing unguessable, temporary bearer-token delivery semantics. This is not durable customer storage or an access-controlled document vault. No public report-sharing link is shown in the owner console. Download needed reports before expiry.

## Verification and limitations

Unit coverage checks authentication before storage/runtime, CSRF/origin rejection, rate/budget preservation, history failure, owner-history membership, expiry, bounded reads and redirect allowlisting. Browser cases use a synthetic test-only signed session and mocked audit data, covering mobile/tablet/desktop layout, accessibility, running/reopening/downloading reports and session expiry. These fixtures are isolated in Playwright configuration and tests; production has no test login bypass.

An authenticated production owner run remains pending credential configuration. Production unauthenticated API checks can be performed without credentials or paid model calls. The public paid-runtime journey has separate production smoke and prior end-to-end verification. Multi-user roles, durable history, scheduled audits, trend comparisons and comprehensive named-engine measurements remain future scope; modeled scenarios remain clearly labeled estimates.
