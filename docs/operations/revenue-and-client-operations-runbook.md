# QueryClear revenue and client-operations runbook

Version: 2026-08-25. Owners: operating lead and technical owner. This is a procedure, not proof that production accounts are configured.

## System of record and minimum fields

The durable operations store is the intake and transaction control layer. Email is a notification channel, not the only record. A CRM may become the commercial system of record once its sync, deduplication and reconciliation are tested.

Every inquiry record needs:

- immutable record ID, created/updated timestamps and origin/source;
- name, work email, normalized website origin, company and selected service;
- message/intake details, lawful-contact context and privacy/terms version where applicable;
- lifecycle state, owner, next action/date, last interaction and disposition/loss reason;
- consent or suppression state; and
- linked Stripe customer/session/subscription and SOW/project IDs when created.

Do not put credentials, payment-card data, medical records, government identifiers or unnecessary sensitive data in lead notes.

## Lead lifecycle

`new → acknowledged → qualified → proposal/audit checkout → won/onboarding → active → accepted/closed`

Alternative terminal states are `nurture`, `not-fit`, `lost`, `duplicate`, `spam` and `suppressed`. Reopening creates a dated activity rather than erasing the prior state.

### Inbound handling SLA

1. The endpoint validates fields, normalizes the website, applies abuse limits and writes the durable record.
2. Only after the write succeeds may it return a success response. Notification failure is recorded for retry; it must not erase the lead.
3. Automated acknowledgment, if used, states what happens next and does not imply acceptance, guaranteed availability or a result.
4. Operating owner reviews legitimate new leads within one business day, assigns the next action and logs the outcome.
5. Duplicates merge by normalized email/domain under a documented rule while preserving all source/activity records.

Production must fail closed if durable storage is unavailable. An in-memory fallback is permitted only in development/test and must be visibly logged.

### Notification outbox

Accepted leads are written to Upstash before email. A lead stays in
`ops:lead:outbox` until both required delivery channels are marked sent; an
email outage therefore does not erase or falsely acknowledge the inquiry.

The operating owner checks the redacted queue at least every business day and
after any Resend/storage alert:

```sh
npm run operations:outbox
npm run operations:outbox -- --limit=200
```

Use `--full` only in an access-controlled terminal when the contact payload is
needed for manual recovery. Re-send from the approved mailbox/CRM and then close
the queue item only with delivery evidence:

```sh
npm run operations:reconcile-lead -- --id=<lead-uuid> --team=sent --prospect=sent --actor=<name> --note="Resent from approved mailbox; message ID recorded in CRM" --confirm
```

Use `--prospect=not_applicable` for capacity-gate records that never required a
prospect email. The command stores the reconciliation against the immutable lead
ID. Investigate any recurring failure.
The production release evidence must include a forced Resend failure, a visible
queued record, and successful manual reconciliation. Stripe state can be
inspected separately with `npm run operations:outbox -- --stripe`. Use
`npm run operations:outbox -- --orders` for the session-keyed current-order
view used for fulfillment, refund and dispute decisions; the event list remains
the immutable audit trail.

## Checkout controls

- Product/price is selected from a server-side allowlist; never accept an arbitrary client-provided price.
- The customer sees seller identity, exact offer, total/recurrence, material limits, cancellation/refund terms and links to Privacy/Terms before purchase.
- Required assent is recorded with `termsAccepted=true`, the exact terms version, product, timestamp, session/customer reference and request correlation ID.
- Success/cancel URLs use the approved site origin allowlist.
- Idempotency prevents duplicate sessions when a request is retried.
- Paid audit can use checkout only after operational capacity is confirmed and `AUDIT_CHECKOUT_PAUSED=false` is explicitly deployed. Missing, `true`, or invalid values fail closed with a 503 before Stripe session creation. Care Plan checkout remains gated until eligibility is approved.
- No project begins merely because a browser reached a success URL. Fulfillment begins from a verified payment event and matching durable record.

`AUDIT_CHECKOUT_PAUSED` defaults to `true`. Before opening a sales window, the
operating owner records available audit slots, named delivery/QA owners, current
work in progress, and the date the capacity decision expires. The technical owner
then deploys `false`, confirms a controlled checkout can create exactly one test
session, and confirms a retry reuses the idempotency key. To close the window, set
the value to `true`, deploy, and verify the route returns the capacity 503 without
creating a Stripe session. Do not use a missing value as an informal toggle.

The AI Search Audit is the only self-serve Stripe SKU. A webhook may create its
fulfillment state only after the shared checkout validator confirms the exact
current amount/currency, complete and paid state, current Terms assent/version,
request correlation ID, customer email and public website. Stack Kit is retired;
Care Plan is eligibility-reviewed and manually enrolled. A checkout event for
either SKU—or an unknown/malformed audit session—goes to `manual_review`, alerts
the owner and sends no buyer intake or fulfillment message.

## Stripe event lifecycle

Verify the raw webhook body against the configured endpoint secret before parsing or acting. Use the durable event ID as the idempotency key.

The Stripe endpoint must subscribe to the event set implemented by the handler:
`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`,
`invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`charge.refunded`, and `charge.dispute.created`. Reconcile this list after every
Stripe API or product-flow change.

| Event class | Required action |
|---|---|
| Valid current Audit checkout / payment succeeded | Persist event and transaction, link customer/product/terms version, send idempotent owner and buyer messages, set `awaiting_intake`, and record that delivery is due seven business days after intake completes |
| Disabled, unknown or invalid checkout | Persist `manual_review`, alert owner, send no buyer intake, and verify payment/refund obligations in Stripe |
| Async payment failed / checkout expired | Persist status, do not fulfill, assign follow-up only where lawful and appropriate |
| Subscription created/updated | Persist plan, period, status and cancellation state; reconcile eligibility |
| Invoice paid | Persist payment, extend active service period and issue receipt through approved channel |
| Invoice payment failed | Persist failure, notify owner/client using approved dunning flow, pause only under contract |
| Subscription canceled/deleted | Persist end date, stop future work at paid-period end, trigger access/data offboarding |
| Charge refunded | Persist amount/reason, update revenue/project status and send confirmation |
| Dispute/chargeback | Preserve contract, assent, delivery and communication evidence; assign response owner/deadline; notify insurer/counsel if required |

Processing sequence:

1. Verify signature and supported event type.
2. Acquire a short durable event lock.
3. If already marked processed, return a successful idempotent response.
4. Persist `received/processing` state before side effects.
5. Perform deterministic database state changes.
6. Queue or attempt notifications; record their result separately.
7. Mark processed only after required state changes succeed.
8. On failure, store error/attempt time, release/expire lock and return a retryable server error.

Never mark an event processed solely because an email was sent. Retain transaction/webhook audit records for seven years unless counsel/CPA direct otherwise.

The immutable event records are the audit trail. The session-keyed record under
`ops:stripe:order:<checkout-session-id>` is the authoritative current fulfillment
view for the paid Audit. It is linked through the PaymentIntent, so a refund or
dispute updates the same order even if Stripe delivers that financial event
before the checkout event. `refunded` and `disputed` stop the intake/delivery
clock; event records are never rewritten to simulate this current-state view.

Invoice and subscription events are lifecycle evidence and reconciliation cues,
not automatic Care Plan acceptance. The durable projection preserves invoice
amounts/status/period, subscription period/cancellation state, refund amount and
reason, and dispute amount/status/reason/evidence deadline. Only an approved Care
Plan agreement and manual enrollment may create or extend Care fulfillment.

## Daily reconciliation

Owner completes this on every business day with payment activity:

- compare Stripe successful charges, refunds, disputes and active subscriptions with durable operational records;
- resolve unlinked customer/session/event IDs;
- verify every paid order has an owner, intake status and delivery due date;
- verify canceled/ineligible Care Plans are not receiving new work;
- retry or manually address failed internal notifications without duplicating fulfillment;
- document differences, correction, owner and completion time.

Monthly, reconcile Stripe gross/fees/refunds/net and deposits to the accounting ledger using the CPA’s approved chart and tax treatment. The marketing, CRM and analytics numbers are not the accounting ledger.

## Refund, cancellation and change controls

- Apply the signed MSA/SOW and published checkout terms; do not improvise a different promise by email.
- Record requester, authority, reason, contract provision, amount/effective date, approver and Stripe reference.
- Care Plan cancellation is effective at the end of the paid period unless law or an approved exception requires otherwise.
- Scope additions use a signed change order with price and schedule effect before work.
- An approved goodwill exception must state it is an exception and must not alter future standard terms.
- Refunds never substitute for required correction, incident response or statutory rights.

## Proposal-to-project handoff

The project owner may mark `onboarding-ready` only when these reconcile:

- customer legal name and signer authority;
- approved MSA/SOW or recorded checkout assent;
- price, payment state and accounting reference;
- included/excluded scope and dates;
- decision-maker and claim/privacy risks;
- client-owned account/access plan; and
- delivery capacity and named QA reviewer.

Any conflict pauses the handoff and is corrected in the source record, not hidden in project notes.

## Notification failure and manual recovery

When Resend or another notification channel fails:

1. Confirm the durable lead/payment record exists.
2. Record provider error, attempt count and next retry.
3. Alert the operating owner through the independent incident channel if the SLA is at risk.
4. Retry with the same record/event idempotency key.
5. Do not resubmit checkout, recreate the lead or duplicate client mail.

## Production verification before launch

Use test-mode resources first, then a controlled production transaction approved by the owner.

Run `npm run launch:check -- --production` against an environment export before
deploying. It reports only variable names and validation outcomes, never secret
values; a pass validates presence/shape, not external account permissions or
deliverability.

- [ ] Production durable-store credentials configured and least-privilege tested.
- [ ] Capacity record names available paid-audit slots, delivery owner, QA owner, current WIP, approval timestamp, and expiry/review date.
- [ ] `AUDIT_CHECKOUT_PAUSED=true` returns the documented 503 and creates no Stripe session; the approved launch configuration explicitly sets it to `false`.
- [ ] Production route returns a service error when the store is deliberately unavailable; it does not claim success.
- [ ] One lead persists through notification failure and can be recovered.
- [ ] Same lead/request and same webhook event do not create duplicate state/fulfillment.
- [ ] Stripe signature rejection, supported success event, retry and out-of-order event are tested.
- [ ] Terms version/assent appears on the linked order record.
- [ ] Refund, cancellation and customer-portal paths are tested.
- [ ] Daily reconciliation can be completed by a second authorized person using this runbook.
- [ ] Alerts exist for endpoint failures, webhook backlog and repeated notification failure.

Store sanitized evidence with date, environment, tester and references. Never copy secrets or full personal data into screenshots.
