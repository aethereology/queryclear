import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import {
  renderAuditBuyerConfirmationEmail,
  renderAuditBuyerConfirmationText,
  renderAuditOrderEmail,
} from "@/lib/email";
import {
  validateCheckoutSession,
  type VerifiedCheckoutSession,
} from "@/lib/checkout-session";
import { site } from "@/lib/site";
import {
  operationsStore,
  type DeliveryState,
  type OperationsStore,
  type StoredStripeEvent,
  type StripeEventOutcome,
  type StripeSubscriptionItemPeriod,
} from "@/lib/operations-store";

// Stripe webhook. The AI Search Audit is the only enabled self-serve offer.
// Retired Stack Kit and eligibility-gated Care Plan sessions are retained for
// manual review but can never create fulfillment or a buyer onboarding message.
// Signature is verified against STRIPE_WEBHOOK_SECRET. Must read the raw body for
// verification, so do NOT parse JSON first.
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, LEAD_TO, LEAD_FROM.

export const runtime = "nodejs";

type OrderNotifications = {
  owner: DeliveryState;
  buyer: DeliveryState;
};

async function deliverOnce(
  previous: DeliveryState,
  send: () => Promise<{ error?: unknown }>,
): Promise<DeliveryState> {
  if (previous === "sent") return "sent";
  try {
    const result = await send();
    return result.error ? "failed" : "sent";
  } catch {
    return "failed";
  }
}

function combinedNotification({ owner, buyer }: OrderNotifications): DeliveryState {
  if (owner === "failed" || buyer === "failed") return "failed";
  if (owner === "not_configured" || buyer === "not_configured") return "not_configured";
  if (owner === "sent" || buyer === "sent") return "sent";
  return "not_applicable";
}

async function notifyAuditOrder(
  order: VerifiedCheckoutSession,
  previous: OrderNotifications,
): Promise<OrderNotifications> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { owner: "not_configured", buyer: "not_configured" };
  }

  const resend = new Resend(key);
  const ownerTo = process.env.LEAD_TO ?? site.email;
  const from = process.env.LEAD_FROM ?? `queryclear <${site.email}>`;
  const name = order.customerName ?? "—";
  const who = order.customerName ?? order.customerEmail;
  const amount = (order.amountTotal / 100).toFixed(2);
  const buyerEmail = {
    amount,
    currency: order.currency,
    name,
    email: order.customerEmail,
    sessionId: order.sessionId,
    website: order.website,
    deliveryWindowBusinessDays: site.auditProduct.deliveryBusinessDays,
    pageLimit: site.auditProduct.pageLimit,
    promptLimit: site.auditProduct.promptLimit,
    engineLimit: site.auditProduct.engineLimit,
    walkthroughMinutes: site.auditProduct.walkthroughMinutes,
    termsVersion: order.termsVersion,
  };

  const [owner, buyer] = await Promise.all([
    deliverOnce(previous.owner, () =>
      resend.emails.send(
      {
        from,
        to: ownerTo,
        replyTo: order.customerEmail,
        subject: `New AI Search Audit purchase — ${who}`.slice(0, 140),
        html: renderAuditOrderEmail(
          {
            amount,
            currency: order.currency,
            name,
            email: order.customerEmail,
            sessionId: order.sessionId,
            website: order.website,
          },
          site,
        ),
      },
      { idempotencyKey: `stripe-order-${order.sessionId}-owner` },
      ),
    ),
    deliverOnce(previous.buyer, () =>
      resend.emails.send(
      {
        from,
        to: order.customerEmail,
        replyTo: site.email,
        subject: "Payment confirmed — complete your AI Search Audit intake",
        html: renderAuditBuyerConfirmationEmail(buyerEmail, site),
        text: renderAuditBuyerConfirmationText(buyerEmail),
      },
      { idempotencyKey: `stripe-order-${order.sessionId}-buyer` },
      ),
    ),
  ]);

  return { owner, buyer };
}

async function notifyManualCheckoutReview(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<DeliveryState> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "not_configured";
  const resend = new Resend(key);
  const response = await resend.emails.send(
    {
      from: process.env.LEAD_FROM ?? `queryclear <${site.email}>`,
      to: process.env.LEAD_TO ?? site.email,
      subject: "Stripe checkout blocked from fulfillment — manual review required",
      text: [
        "A signed Stripe checkout event did not match the enabled fulfillment contract.",
        "No buyer intake or fulfillment message was sent.",
        `Event ID: ${event.id}`,
        `Session ID: ${session.id ?? "unknown"}`,
        `Product: ${session.metadata?.product ?? "missing/unknown"}`,
        `Mode: ${session.mode ?? "unknown"}`,
        `Session status: ${session.status ?? "unknown"}`,
        `Payment status: ${session.payment_status ?? "unknown"}`,
        `Amount: ${session.amount_total ?? "unknown"} ${session.currency ?? ""}`.trim(),
        "Review payment, terms assent, website, customer email, and refund obligations in Stripe.",
      ].join("\n"),
    },
    { idempotencyKey: `stripe-${event.id}-manual-review` },
  );
  return response.error ? "failed" : "sent";
}

const trackedEventTypes = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
  "charge.dispute.created",
]);

const alertEventTypes = new Set([
  "checkout.session.async_payment_failed",
  "invoice.payment_failed",
  "customer.subscription.deleted",
  "charge.refunded",
  "charge.dispute.created",
]);

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function unixTimestamp(value: unknown): string | undefined {
  const seconds = numberValue(value);
  if (seconds === undefined || seconds < 0) return undefined;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function expandableId(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (value && typeof value === "object") {
    return stringValue((value as Record<string, unknown>).id);
  }
  return undefined;
}

function initialOrderStatus(eventType: string): StoredStripeEvent["orderStatus"] {
  if (
    eventType === "checkout.session.completed" ||
    eventType === "checkout.session.async_payment_succeeded"
  ) {
    return "pending_validation";
  }
  if (eventType === "checkout.session.async_payment_failed" || eventType === "invoice.payment_failed") {
    return "payment_failed";
  }
  if (eventType === "checkout.session.expired") return "expired";
  if (eventType === "charge.refunded") return "refunded";
  if (eventType === "charge.dispute.created") return "disputed";
  return "not_applicable";
}

function storedStripeEvent(event: Stripe.Event): StoredStripeEvent {
  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata =
    object.metadata && typeof object.metadata === "object"
      ? (object.metadata as Record<string, unknown>)
      : {};
  const customerDetails =
    object.customer_details && typeof object.customer_details === "object"
      ? (object.customer_details as Record<string, unknown>)
      : {};
  const customFields = Array.isArray(object.custom_fields)
    ? (object.custom_fields as Array<Record<string, unknown>>)
    : [];
  const websiteField = customFields.find((field) => field.key === "website");
  const websiteText =
    websiteField?.text && typeof websiteField.text === "object"
      ? (websiteField.text as Record<string, unknown>).value
      : undefined;
  const evidenceDetails =
    object.evidence_details && typeof object.evidence_details === "object"
      ? (object.evidence_details as Record<string, unknown>)
      : {};
  const refunds =
    object.refunds && typeof object.refunds === "object"
      ? (object.refunds as Record<string, unknown>)
      : {};
  const refundData = Array.isArray(refunds.data)
    ? (refunds.data as Array<Record<string, unknown>>)
    : [];
  const firstRefund = refundData[0] ?? {};
  const parent =
    object.parent && typeof object.parent === "object"
      ? (object.parent as Record<string, unknown>)
      : {};
  const subscriptionDetails =
    parent.subscription_details && typeof parent.subscription_details === "object"
      ? (parent.subscription_details as Record<string, unknown>)
      : {};
  const subscriptionMetadata =
    subscriptionDetails.metadata && typeof subscriptionDetails.metadata === "object"
      ? (subscriptionDetails.metadata as Record<string, unknown>)
      : {};
  const invoicePayments =
    object.payments && typeof object.payments === "object"
      ? (object.payments as Record<string, unknown>)
      : {};
  const invoicePaymentData = Array.isArray(invoicePayments.data)
    ? (invoicePayments.data as Array<Record<string, unknown>>)
    : [];
  const invoicePayment =
    invoicePaymentData.find((payment) => payment.status === "paid") ??
    invoicePaymentData[0] ??
    {};
  const invoicePaymentSource =
    invoicePayment.payment && typeof invoicePayment.payment === "object"
      ? (invoicePayment.payment as Record<string, unknown>)
      : {};
  const statusTransitions =
    object.status_transitions && typeof object.status_transitions === "object"
      ? (object.status_transitions as Record<string, unknown>)
      : {};
  const subscriptionItems =
    object.items && typeof object.items === "object"
      ? (object.items as Record<string, unknown>)
      : {};
  const subscriptionItemData = Array.isArray(subscriptionItems.data)
    ? (subscriptionItems.data as Array<Record<string, unknown>>)
    : [];
  const subscriptionItemPeriods = subscriptionItemData
    .map((item): StripeSubscriptionItemPeriod | null => {
      const itemId = stringValue(item.id);
      if (!itemId) return null;
      return {
        itemId,
        priceId: expandableId(item.price),
        quantity: numberValue(item.quantity),
        periodStart: unixTimestamp(item.current_period_start),
        periodEnd: unixTimestamp(item.current_period_end),
      };
    })
    .filter((item): item is StripeSubscriptionItemPeriod => item !== null);
  const itemPeriodStarts = subscriptionItemData
    .map((item) => numberValue(item.current_period_start))
    .filter((value): value is number => value !== undefined);
  const itemPeriodEnds = subscriptionItemData
    .map((item) => numberValue(item.current_period_end))
    .filter((value): value is number => value !== undefined);
  const orderStatus = initialOrderStatus(event.type);

  return {
    eventId: event.id,
    eventType: event.type,
    receivedAt: new Date().toISOString(),
    objectId: stringValue(object.id) ?? "unknown",
    product: stringValue(metadata.product) || stringValue(subscriptionMetadata.product),
    checkoutRequestId: stringValue(metadata.checkout_request_id),
    termsAccepted:
      metadata.terms_accepted === "true"
        ? true
        : metadata.terms_accepted === "false"
          ? false
          : undefined,
    termsAcceptedAt: stringValue(metadata.terms_accepted_at),
    termsVersion: stringValue(metadata.terms_version),
    customerEmail:
      stringValue(customerDetails.email) ||
      stringValue(object.customer_email) ||
      stringValue(object.receipt_email),
    customerId: expandableId(object.customer),
    website: stringValue(websiteText),
    amountTotal:
      numberValue(object.amount_total) ?? numberValue(object.amount_due),
    amountDue: numberValue(object.amount_due),
    amountPaid: numberValue(object.amount_paid),
    amountRemaining: numberValue(object.amount_remaining),
    amountRefunded: numberValue(object.amount_refunded),
    amountAffected:
      event.type === "charge.dispute.created" ? numberValue(object.amount) : undefined,
    currency: stringValue(object.currency),
    paymentIntentId:
      expandableId(object.payment_intent) ||
      expandableId(invoicePaymentSource.payment_intent),
    subscriptionId:
      expandableId(object.subscription) ||
      expandableId(subscriptionDetails.subscription) ||
      (object.object === "subscription" ? stringValue(object.id) : undefined),
    invoiceId:
      expandableId(object.invoice) ||
      (object.object === "invoice" ? stringValue(object.id) : undefined),
    chargeId:
      expandableId(object.charge) ||
      expandableId(invoicePaymentSource.charge) ||
      (object.object === "charge" ? stringValue(object.id) : undefined),
    latestInvoiceId: expandableId(object.latest_invoice),
    objectStatus: stringValue(object.status) || stringValue(object.payment_status),
    invoiceNumber: stringValue(object.number),
    invoiceAttemptCount: numberValue(object.attempt_count),
    nextPaymentAttemptAt: unixTimestamp(object.next_payment_attempt),
    invoicePaidAt: unixTimestamp(statusTransitions.paid_at),
    billingReason: stringValue(object.billing_reason),
    collectionMethod: stringValue(object.collection_method),
    refundId: stringValue(firstRefund.id),
    refundReason: stringValue(firstRefund.reason),
    refundStatus: stringValue(firstRefund.status),
    latestRefundAmount: numberValue(firstRefund.amount),
    refundCreatedAt: unixTimestamp(firstRefund.created),
    disputeReason:
      event.type === "charge.dispute.created" ? stringValue(object.reason) : undefined,
    disputeStatus:
      event.type === "charge.dispute.created" ? stringValue(object.status) : undefined,
    disputeEvidenceDueAt: unixTimestamp(evidenceDetails.due_by),
    periodStart:
      unixTimestamp(object.period_start) ||
      unixTimestamp(object.current_period_start) ||
      unixTimestamp(itemPeriodStarts.length ? Math.min(...itemPeriodStarts) : undefined),
    periodEnd:
      unixTimestamp(object.period_end) ||
      unixTimestamp(object.current_period_end) ||
      unixTimestamp(itemPeriodEnds.length ? Math.max(...itemPeriodEnds) : undefined),
    cancelAt: unixTimestamp(object.cancel_at),
    canceledAt: unixTimestamp(object.canceled_at),
    endedAt: unixTimestamp(object.ended_at),
    trialEnd: unixTimestamp(object.trial_end),
    cancelAtPeriodEnd: booleanValue(object.cancel_at_period_end),
    subscriptionItemPeriods:
      subscriptionItemPeriods.length > 0 ? subscriptionItemPeriods : undefined,
    eventCreatedAt: unixTimestamp(event.created),
    livemode: event.livemode,
    orderStatus,
    validationStatus:
      orderStatus === "pending_validation" ? "not_checked" : "not_applicable",
    intakeStatus: "not_applicable",
    deliveryDueFrom: "not_applicable",
    ownerNotification: "pending",
    buyerNotification: "not_applicable",
    retentionClass: event.type === "checkout.session.expired" ? "inquiry" : "transaction",
    processingStatus: "received",
    notification: "pending",
    attemptCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

async function notifyLifecycleEvent(event: Stripe.Event): Promise<DeliveryState> {
  if (!alertEventTypes.has(event.type)) return "not_applicable";
  const key = process.env.RESEND_API_KEY;
  if (!key) return "not_configured";

  const object = event.data.object as unknown as { id?: string };
  const resend = new Resend(key);
  const response = await resend.emails.send(
    {
      from: process.env.LEAD_FROM ?? `queryclear <${site.email}>`,
      to: process.env.LEAD_TO ?? site.email,
      subject: `Stripe action required — ${event.type}`.slice(0, 140),
      text: [
        "A verified Stripe lifecycle event requires review.",
        `Event: ${event.type}`,
        `Event ID: ${event.id}`,
        `Object ID: ${object.id ?? "unknown"}`,
        "Review the event in Stripe before changing fulfillment or access.",
      ].join("\n"),
    },
    { idempotencyKey: `stripe-${event.id}` },
  );
  if (response.error) throw response.error;
  return "sent";
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    console.error("[stripe-webhook] not configured");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error(
      "[stripe-webhook] signature verification failed",
      err instanceof Error ? err.name : typeof err,
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!trackedEventTypes.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  let store: OperationsStore;
  try {
    store = operationsStore();
    await store.recordStripeEvent(storedStripeEvent(event));
  } catch {
    console.error("[stripe-webhook] durable event save failed");
    return NextResponse.json({ error: "Could not record event." }, { status: 503 });
  }

  const claim = await store.claimStripeEvent(event.id).catch(() => null);
  if (claim === "completed") {
    return NextResponse.json({ received: true });
  }
  if (claim === "processing") {
    // Never acknowledge an in-flight lock as final: if the first invocation
    // crashes, Stripe must retry after the short lock expires.
    return NextResponse.json(
      { error: "Event is already processing; retry later." },
      { status: 503, headers: { "Retry-After": "300" } },
    );
  }
  if (claim !== "claimed") {
    console.error("[stripe-webhook] event claim failed");
    return NextResponse.json({ error: "Could not claim event." }, { status: 503 });
  }

  let outcome: StripeEventOutcome = {};
  try {
    const persistedEvent = await store.getStripeEvent(event.id);
    if (!persistedEvent) throw new Error("Stored Stripe event was not found after claim.");
    let notification: DeliveryState;
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      // Delayed payment methods emit async_payment_succeeded later. Do not
      // announce fulfillment from an explicitly unpaid completed session.
      if (
        event.type === "checkout.session.completed" &&
        session.payment_status === "unpaid" &&
        session.metadata?.product === "ai-search-audit"
      ) {
        notification = "not_applicable";
        outcome = {
          orderStatus: "awaiting_payment",
          validationStatus: "awaiting_payment",
          intakeStatus: "not_applicable",
          deliveryDueFrom: "not_applicable",
          ownerNotification: "not_applicable",
          buyerNotification: "not_applicable",
        };
      } else {
        const verified = validateCheckoutSession(session, "ai-search-audit");
        if (verified) {
          outcome = {
            orderStatus: "awaiting_intake",
            validationStatus: "verified_current_offer",
            intakeStatus: "awaiting_client",
            deliveryDueFrom: "intake_complete",
            deliveryWindowBusinessDays: site.auditProduct.deliveryBusinessDays,
            normalizedWebsite: verified.website,
            ownerNotification: "pending",
            buyerNotification: "pending",
          };
          const deliveries = await notifyAuditOrder(verified, {
            owner: persistedEvent.ownerNotification ?? "pending",
            buyer: persistedEvent.buyerNotification ?? "pending",
          });
          notification = combinedNotification(deliveries);
          outcome = {
            ...outcome,
            ownerNotification: deliveries.owner,
            buyerNotification: deliveries.buyer,
          };
          if (deliveries.owner !== "sent" || deliveries.buyer !== "sent") {
            throw new Error("Required audit order notifications were not delivered.");
          }
        } else {
          outcome = {
            orderStatus: "manual_review",
            validationStatus:
              session.metadata?.product === "ai-search-audit"
                ? "invalid_current_offer"
                : "disabled_or_unknown_offer",
            intakeStatus: "not_applicable",
            deliveryDueFrom: "not_applicable",
            ownerNotification: "pending",
            buyerNotification: "not_applicable",
          };
          const ownerNotification =
            persistedEvent.ownerNotification === "sent"
              ? "sent"
              : await notifyManualCheckoutReview(event, session);
          notification = ownerNotification;
          outcome = {
            ...outcome,
            ownerNotification,
          };
          if (ownerNotification !== "sent") {
            throw new Error("Required manual-review notification was not delivered.");
          }
        }
      }
    } else {
      notification =
        alertEventTypes.has(event.type) && persistedEvent.ownerNotification === "sent"
          ? "sent"
          : await notifyLifecycleEvent(event);
      outcome = {
        ownerNotification: alertEventTypes.has(event.type)
          ? notification
          : "not_applicable",
        buyerNotification: "not_applicable",
      };
    }
    if (notification === "not_configured") {
      throw new Error("Required Stripe notification channel is not configured.");
    }
    await store.completeStripeEvent(event.id, notification, outcome);
  } catch (err) {
    console.error(
      "[stripe-webhook] fulfillment processing failed",
      err instanceof Error ? err.name : typeof err,
    );
    await store
      .failStripeEvent(
        event.id,
        process.env.RESEND_API_KEY ? "failed" : "not_configured",
        outcome,
      )
      .catch(() => undefined);
    // Non-2xx makes Stripe retry. Durable per-channel delivery state skips a
    // confirmed channel; the order-scoped Resend key covers ambiguous sends.
    return NextResponse.json({ error: "Event processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
