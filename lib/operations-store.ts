import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

// Published retention targets: sales inquiries up to 24 months; transaction
// records seven years. Suppression records live in the outreach store and are
// intentionally separate from these full lead payloads.
const LEAD_TTL_SECONDS = 730 * 24 * 60 * 60;
const STRIPE_EVENT_TTL_SECONDS = 7 * 365 * 24 * 60 * 60;
const STRIPE_LOCK_SECONDS = 5 * 60;
const MAX_INDEX_SIZE = 10_000;

export type DeliveryState = "pending" | "sent" | "failed" | "not_configured" | "not_applicable";

export type StripeOrderStatus =
  | "pending_validation"
  | "awaiting_payment"
  | "awaiting_intake"
  | "manual_review"
  | "payment_failed"
  | "expired"
  | "partially_refunded"
  | "refunded"
  | "disputed"
  | "not_applicable";

export type StripeValidationStatus =
  | "not_checked"
  | "verified_current_offer"
  | "awaiting_payment"
  | "invalid_current_offer"
  | "disabled_or_unknown_offer"
  | "not_applicable";

export interface StripeEventOutcome {
  orderStatus?: StripeOrderStatus;
  validationStatus?: StripeValidationStatus;
  intakeStatus?: "awaiting_client" | "not_applicable";
  deliveryDueFrom?: "intake_complete" | "not_applicable";
  deliveryWindowBusinessDays?: number;
  normalizedWebsite?: string;
  ownerNotification?: DeliveryState;
  buyerNotification?: DeliveryState;
}

export interface StripeSubscriptionItemPeriod {
  itemId: string;
  priceId?: string;
  quantity?: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface StoredStripeOrder {
  orderId: string;
  sessionId: string;
  product: "ai-search-audit";
  paymentIntentId: string;
  customerId?: string;
  customerEmail: string;
  website: string;
  amountTotal: number;
  currency: string;
  checkoutRequestId: string;
  termsAcceptedAt: string;
  termsVersion: string;
  orderStatus: StripeOrderStatus;
  validationStatus: "verified_current_offer";
  intakeStatus: "awaiting_client" | "not_applicable";
  deliveryDueFrom: "intake_complete" | "not_applicable";
  deliveryWindowBusinessDays: number;
  ownerNotification: DeliveryState;
  buyerNotification: DeliveryState;
  amountRefunded?: number;
  refundEventId?: string;
  refundReason?: string;
  refundStatus?: string;
  disputeEventId?: string;
  disputeAmount?: number;
  disputeReason?: string;
  disputeStatus?: string;
  disputeEvidenceDueAt?: string;
  lastCheckoutEventId: string;
  lastFinancialEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDelivery {
  team: DeliveryState;
  prospect: DeliveryState;
  updatedAt: string;
}

export interface StoredLead {
  id: string;
  kind: "inquiry" | "public-audit";
  receivedAt: string;
  websiteHost: string;
  payload: Record<string, unknown>;
  delivery: LeadDelivery;
}

export interface StoredStripeEvent {
  eventId: string;
  eventType: string;
  receivedAt: string;
  objectId: string;
  product?: string;
  customerEmail?: string;
  customerId?: string;
  website?: string;
  normalizedWebsite?: string;
  amountTotal?: number;
  amountDue?: number;
  amountPaid?: number;
  amountRemaining?: number;
  amountRefunded?: number;
  amountAffected?: number;
  currency?: string;
  paymentIntentId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  chargeId?: string;
  latestInvoiceId?: string;
  checkoutRequestId?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  objectStatus?: string;
  invoiceNumber?: string;
  invoiceAttemptCount?: number;
  nextPaymentAttemptAt?: string;
  invoicePaidAt?: string;
  billingReason?: string;
  collectionMethod?: string;
  refundId?: string;
  refundReason?: string;
  refundStatus?: string;
  latestRefundAmount?: number;
  refundCreatedAt?: string;
  disputeReason?: string;
  disputeStatus?: string;
  disputeEvidenceDueAt?: string;
  periodStart?: string;
  periodEnd?: string;
  cancelAt?: string;
  canceledAt?: string;
  endedAt?: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
  subscriptionItemPeriods?: StripeSubscriptionItemPeriod[];
  eventCreatedAt?: string;
  livemode?: boolean;
  orderStatus?: StripeOrderStatus;
  validationStatus?: StripeValidationStatus;
  intakeStatus?: "awaiting_client" | "not_applicable";
  deliveryDueFrom?: "intake_complete" | "not_applicable";
  deliveryWindowBusinessDays?: number;
  ownerNotification?: DeliveryState;
  buyerNotification?: DeliveryState;
  retentionClass: "inquiry" | "transaction";
  processingStatus: "received" | "completed" | "failed";
  notification: DeliveryState;
  attemptCount?: number;
  lastFailureAt?: string;
  updatedAt: string;
}

export type StripeEventClaim = "claimed" | "processing" | "completed";

export interface OperationsStore {
  rateLimit(
    scope: string,
    identity: string,
    limit: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; retryAfterMs: number }>;
  saveLead(lead: StoredLead): Promise<void>;
  claimReportAndSaveLead(
    reportToken: string,
    reportTtlMs: number,
    lead: StoredLead,
  ): Promise<"saved" | "already_claimed">;
  updateLeadDelivery(id: string, delivery: LeadDelivery): Promise<void>;
  recordStripeEvent(event: StoredStripeEvent): Promise<void>;
  getStripeEvent(eventId: string): Promise<StoredStripeEvent | null>;
  getStripeOrder(orderId: string): Promise<StoredStripeOrder | null>;
  claimStripeEvent(eventId: string): Promise<StripeEventClaim>;
  completeStripeEvent(
    eventId: string,
    notification: DeliveryState,
    outcome?: StripeEventOutcome,
  ): Promise<void>;
  failStripeEvent(
    eventId: string,
    notification: DeliveryState,
    outcome?: StripeEventOutcome,
  ): Promise<void>;
}

export class OperationsStoreUnavailableError extends Error {
  constructor(message = "Shared operational storage is not configured.") {
    super(message);
    this.name = "OperationsStoreUnavailableError";
  }
}

function identityHash(identity: string): string {
  return createHash("sha256").update(identity).digest("hex").slice(0, 32);
}

function parseStored<T>(value: T | string | null): T | null {
  if (!value) return null;
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function leadKey(id: string) {
  return `ops:lead:${id}`;
}

function stripeEventKey(id: string) {
  return `ops:stripe:event:${id}`;
}

function stripeDoneKey(id: string) {
  return `ops:stripe:done:${id}`;
}

function stripeLockKey(id: string) {
  return `ops:stripe:lock:${id}`;
}

function stripeOrderKey(id: string) {
  return `ops:stripe:order:${id}`;
}

function stripePaymentOrderKey(paymentIntentId: string) {
  return `ops:stripe:payment-order:${paymentIntentId}`;
}

function stripeRefundKey(paymentIntentId: string) {
  return `ops:stripe:refund:${paymentIntentId}`;
}

function stripeDisputeKey(paymentIntentId: string) {
  return `ops:stripe:dispute:${paymentIntentId}`;
}

type StripeRefundProjection = {
  eventId: string;
  eventCreatedAt: string;
  amountRefunded: number;
  reason?: string;
  status?: string;
};

type StripeDisputeProjection = {
  eventId: string;
  eventCreatedAt: string;
  amount?: number;
  reason?: string;
  status?: string;
  evidenceDueAt?: string;
};

function checkoutOrder(
  event: StoredStripeEvent,
  outcome: StripeEventOutcome,
  existing: StoredStripeOrder | null,
  now: string,
): StoredStripeOrder | null {
  if (
    outcome.validationStatus !== "verified_current_offer" ||
    event.product !== "ai-search-audit" ||
    !event.objectId.startsWith("cs_") ||
    !event.paymentIntentId ||
    !event.customerEmail ||
    !outcome.normalizedWebsite ||
    event.amountTotal === undefined ||
    !event.currency ||
    !event.checkoutRequestId ||
    !event.termsAcceptedAt ||
    !event.termsVersion ||
    outcome.deliveryWindowBusinessDays === undefined
  ) {
    return null;
  }

  return {
    ...existing,
    orderId: event.objectId,
    sessionId: event.objectId,
    product: "ai-search-audit",
    paymentIntentId: event.paymentIntentId,
    customerId: event.customerId,
    customerEmail: event.customerEmail,
    website: outcome.normalizedWebsite,
    amountTotal: event.amountTotal,
    currency: event.currency.toUpperCase(),
    checkoutRequestId: event.checkoutRequestId,
    termsAcceptedAt: event.termsAcceptedAt,
    termsVersion: event.termsVersion,
    orderStatus: "awaiting_intake",
    validationStatus: "verified_current_offer",
    intakeStatus: "awaiting_client",
    deliveryDueFrom: "intake_complete",
    deliveryWindowBusinessDays: outcome.deliveryWindowBusinessDays,
    ownerNotification:
      existing?.ownerNotification === "sent"
        ? "sent"
        : outcome.ownerNotification ?? existing?.ownerNotification ?? "pending",
    buyerNotification:
      existing?.buyerNotification === "sent"
        ? "sent"
        : outcome.buyerNotification ?? existing?.buyerNotification ?? "pending",
    lastCheckoutEventId: event.eventId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function mergeRefundProjection(
  existing: StripeRefundProjection | null,
  event: StoredStripeEvent,
): StripeRefundProjection | null {
  if (event.eventType !== "charge.refunded" || !event.paymentIntentId) return existing;
  const created = event.eventCreatedAt ?? event.receivedAt;
  const isNewer =
    !existing ||
    created > existing.eventCreatedAt ||
    (created === existing.eventCreatedAt && event.eventId >= existing.eventId);
  return {
    eventId: isNewer ? event.eventId : existing.eventId,
    eventCreatedAt: isNewer ? created : existing.eventCreatedAt,
    amountRefunded: Math.max(existing?.amountRefunded ?? 0, event.amountRefunded ?? 0),
    reason: isNewer ? event.refundReason : existing.reason,
    status: isNewer ? event.refundStatus : existing.status,
  };
}

function disputeProjection(event: StoredStripeEvent): StripeDisputeProjection | null {
  if (event.eventType !== "charge.dispute.created" || !event.paymentIntentId) return null;
  return {
    eventId: event.eventId,
    eventCreatedAt: event.eventCreatedAt ?? event.receivedAt,
    amount: event.amountAffected,
    reason: event.disputeReason,
    status: event.disputeStatus,
    evidenceDueAt: event.disputeEvidenceDueAt,
  };
}

function reconcileOrder(
  order: StoredStripeOrder,
  refund: StripeRefundProjection | null,
  dispute: StripeDisputeProjection | null,
  now: string,
): StoredStripeOrder {
  const updated: StoredStripeOrder = { ...order, updatedAt: now };
  if (refund) {
    updated.amountRefunded = refund.amountRefunded;
    updated.refundEventId = refund.eventId;
    updated.refundReason = refund.reason;
    updated.refundStatus = refund.status;
  }
  if (dispute) {
    updated.disputeEventId = dispute.eventId;
    updated.disputeAmount = dispute.amount;
    updated.disputeReason = dispute.reason;
    updated.disputeStatus = dispute.status;
    updated.disputeEvidenceDueAt = dispute.evidenceDueAt;
  }

  const latestFinancial = [
    refund && { id: refund.eventId, at: refund.eventCreatedAt },
    dispute && { id: dispute.eventId, at: dispute.eventCreatedAt },
  ]
    .filter((value): value is { id: string; at: string } => Boolean(value))
    .sort((a, b) => a.at.localeCompare(b.at))
    .at(-1);
  updated.lastFinancialEventId = latestFinancial?.id;

  if (dispute) {
    updated.orderStatus = "disputed";
  } else if ((refund?.amountRefunded ?? 0) >= order.amountTotal) {
    updated.orderStatus = "refunded";
  } else if ((refund?.amountRefunded ?? 0) > 0) {
    updated.orderStatus = "partially_refunded";
  } else {
    updated.orderStatus = "awaiting_intake";
  }
  if (["disputed", "refunded"].includes(updated.orderStatus)) {
    updated.intakeStatus = "not_applicable";
    updated.deliveryDueFrom = "not_applicable";
  }
  return updated;
}

function stripeEventTtl(event: StoredStripeEvent): number {
  return event.retentionClass === "inquiry" ? LEAD_TTL_SECONDS : STRIPE_EVENT_TTL_SECONDS;
}

export class RedisOperationsStore implements OperationsStore {
  private readonly redis: Redis;

  constructor(redis?: Redis) {
    const url = process.env.KV_REST_API_URL?.trim();
    const token = process.env.KV_REST_API_TOKEN?.trim();
    if (!redis && (!url || !token)) throw new OperationsStoreUnavailableError();
    this.redis = redis ?? new Redis({ url: url!, token: token! });
  }

  async rateLimit(scope: string, identity: string, limit: number, windowMs: number) {
    const key = `ops:rl:${scope}:${identityHash(identity)}`;
    // INCR and the first expiration must be one operation. A process dying
    // between separate INCR/EXPIRE calls would otherwise leave a permanent
    // rate-limit key. The PTTL branch also self-heals any legacy key without a
    // TTL while preserving the current counter.
    const [rawCount, rawTtl] = await this.redis.eval<[number], [number, number]>(
      `local count = redis.call("INCR", KEYS[1])
local ttl = redis.call("PTTL", KEYS[1])
if count == 1 or ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}`,
      [key],
      [windowMs],
    );
    const count = Number(rawCount);
    const ttl = Number(rawTtl);
    if (count > limit) {
      return { allowed: false, retryAfterMs: ttl > 0 ? ttl : windowMs };
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  async saveLead(lead: StoredLead): Promise<void> {
    const result = Number(
      await this.redis.eval<[string, number, string, number], number>(
        `if redis.call("EXISTS", KEYS[1]) == 1 then
  return 0
end
redis.call("SET", KEYS[1], ARGV[1], "EX", ARGV[2])
redis.call("LPUSH", KEYS[2], ARGV[3])
redis.call("LTRIM", KEYS[2], 0, ARGV[4] - 1)
redis.call("EXPIRE", KEYS[2], ARGV[2])
redis.call("LPUSH", KEYS[3], ARGV[3])
redis.call("LTRIM", KEYS[3], 0, ARGV[4] - 1)
redis.call("EXPIRE", KEYS[3], ARGV[2])
return 1`,
        [leadKey(lead.id), "ops:lead:index", "ops:lead:outbox"],
        [JSON.stringify(lead), LEAD_TTL_SECONDS, lead.id, MAX_INDEX_SIZE],
      ),
    );
    if (result !== 1) throw new Error("Lead identifier already exists.");
  }

  async claimReportAndSaveLead(
    reportToken: string,
    reportTtlMs: number,
    lead: StoredLead,
  ): Promise<"saved" | "already_claimed"> {
    const claimTtlMs = Math.max(1, Math.min(reportTtlMs, 24 * 60 * 60 * 1000));
    const result = Number(
      await this.redis.eval<
        [string, number, string, number, number],
        number
      >(
        `if redis.call("EXISTS", KEYS[1]) == 1 then
  return 0
end
if redis.call("EXISTS", KEYS[2]) == 1 then
  return -1
end
redis.call("SET", KEYS[2], ARGV[1], "EX", ARGV[2])
redis.call("LPUSH", KEYS[3], ARGV[3])
redis.call("LTRIM", KEYS[3], 0, ARGV[5] - 1)
redis.call("EXPIRE", KEYS[3], ARGV[2])
redis.call("LPUSH", KEYS[4], ARGV[3])
redis.call("LTRIM", KEYS[4], 0, ARGV[5] - 1)
redis.call("EXPIRE", KEYS[4], ARGV[2])
redis.call("SET", KEYS[1], "1", "PX", ARGV[4])
return 1`,
        [
          `pa:viewed:${reportToken}`,
          leadKey(lead.id),
          "ops:lead:index",
          "ops:lead:outbox",
        ],
        [JSON.stringify(lead), LEAD_TTL_SECONDS, lead.id, claimTtlMs, MAX_INDEX_SIZE],
      ),
    );
    if (result === 0) return "already_claimed";
    if (result !== 1) throw new Error("Lead identifier already exists.");
    return "saved";
  }

  async updateLeadDelivery(id: string, delivery: LeadDelivery): Promise<void> {
    const current = parseStored<StoredLead>(await this.redis.get(leadKey(id)));
    if (!current) throw new Error("Stored lead was not found.");
    await this.redis.set(leadKey(id), JSON.stringify({ ...current, delivery }), {
      ex: LEAD_TTL_SECONDS,
    });

    if (delivery.team === "sent" && ["sent", "not_applicable"].includes(delivery.prospect)) {
      await this.redis.lrem("ops:lead:outbox", 0, id);
    }
  }

  async recordStripeEvent(event: StoredStripeEvent): Promise<void> {
    const ttl = stripeEventTtl(event);
    await this.redis.set(stripeEventKey(event.eventId), JSON.stringify(event), {
      nx: true,
      ex: ttl,
    });
    // Always repair the discoverability index. A prior invocation may have
    // committed the event record but lost its response before indexing.
    await this.redis
      .multi()
      .lrem("ops:stripe:index", 0, event.eventId)
      .lpush("ops:stripe:index", event.eventId)
      .ltrim("ops:stripe:index", 0, MAX_INDEX_SIZE - 1)
      .expire("ops:stripe:index", STRIPE_EVENT_TTL_SECONDS)
      .exec();
  }

  async getStripeEvent(eventId: string): Promise<StoredStripeEvent | null> {
    return parseStored<StoredStripeEvent>(await this.redis.get(stripeEventKey(eventId)));
  }

  async getStripeOrder(orderId: string): Promise<StoredStripeOrder | null> {
    return parseStored<StoredStripeOrder>(await this.redis.get(stripeOrderKey(orderId)));
  }

  private async writeStripeOrder(order: StoredStripeOrder): Promise<void> {
    // Notification success is monotonic. A concurrent financial reconciliation
    // may never overwrite a channel already durably marked sent.
    await this.redis.eval<[string, number], string>(
      `-- stripe-order-projection
local incoming = cjson.decode(ARGV[1])
local raw = redis.call("GET", KEYS[1])
if raw then
  local existing = cjson.decode(raw)
  if existing.ownerNotification == "sent" then incoming.ownerNotification = "sent" end
  if existing.buyerNotification == "sent" then incoming.buyerNotification = "sent" end
  if existing.createdAt then incoming.createdAt = existing.createdAt end
  if existing.amountRefunded and (not incoming.amountRefunded or tonumber(existing.amountRefunded) > tonumber(incoming.amountRefunded)) then
    incoming.amountRefunded = existing.amountRefunded
    incoming.refundEventId = existing.refundEventId
    incoming.refundReason = existing.refundReason
    incoming.refundStatus = existing.refundStatus
  end
  if existing.disputeEventId and not incoming.disputeEventId then
    incoming.disputeEventId = existing.disputeEventId
    incoming.disputeAmount = existing.disputeAmount
    incoming.disputeReason = existing.disputeReason
    incoming.disputeStatus = existing.disputeStatus
    incoming.disputeEvidenceDueAt = existing.disputeEvidenceDueAt
  end
  if existing.lastFinancialEventId and not incoming.lastFinancialEventId then
    incoming.lastFinancialEventId = existing.lastFinancialEventId
  end
end
if incoming.disputeEventId then
  incoming.orderStatus = "disputed"
  incoming.intakeStatus = "not_applicable"
  incoming.deliveryDueFrom = "not_applicable"
elseif incoming.amountRefunded and tonumber(incoming.amountRefunded) >= tonumber(incoming.amountTotal) then
  incoming.orderStatus = "refunded"
  incoming.intakeStatus = "not_applicable"
  incoming.deliveryDueFrom = "not_applicable"
elseif incoming.amountRefunded and tonumber(incoming.amountRefunded) > 0 then
  incoming.orderStatus = "partially_refunded"
end
local encoded = cjson.encode(incoming)
redis.call("SET", KEYS[1], encoded, "EX", ARGV[2])
return encoded`,
      [stripeOrderKey(order.orderId)],
      [JSON.stringify(order), STRIPE_EVENT_TTL_SECONDS],
    );
  }

  private async reconcileStripeOrder(paymentIntentId: string): Promise<void> {
    const orderId = await this.redis.get<string>(stripePaymentOrderKey(paymentIntentId));
    if (typeof orderId !== "string" || !orderId) return;
    const [order, refund, dispute] = await Promise.all([
      this.getStripeOrder(orderId),
      this.redis.get<StripeRefundProjection>(stripeRefundKey(paymentIntentId)),
      this.redis.get<StripeDisputeProjection>(stripeDisputeKey(paymentIntentId)),
    ]);
    if (!order) return;
    const reconciled = reconcileOrder(
      order,
      parseStored<StripeRefundProjection>(refund),
      parseStored<StripeDisputeProjection>(dispute),
      new Date().toISOString(),
    );
    await this.writeStripeOrder(reconciled);
  }

  private async projectStripeOrder(
    event: StoredStripeEvent,
    outcome: StripeEventOutcome,
  ): Promise<void> {
    const now = new Date().toISOString();
    const order = checkoutOrder(
      event,
      outcome,
      await this.getStripeOrder(event.objectId),
      now,
    );
    if (order) {
      await this.writeStripeOrder(order);
      await this.redis
        .multi()
        .set(stripePaymentOrderKey(order.paymentIntentId), order.orderId, {
          ex: STRIPE_EVENT_TTL_SECONDS,
        })
        .lrem("ops:stripe:order:index", 0, order.orderId)
        .lpush("ops:stripe:order:index", order.orderId)
        .ltrim("ops:stripe:order:index", 0, MAX_INDEX_SIZE - 1)
        .expire("ops:stripe:order:index", STRIPE_EVENT_TTL_SECONDS)
        .exec();
    }

    if (event.eventType === "charge.refunded" && event.paymentIntentId) {
      const incoming = mergeRefundProjection(null, event);
      if (incoming) {
        await this.redis.eval<[string, number], string>(
          `-- stripe-refund-projection
local incoming = cjson.decode(ARGV[1])
local raw = redis.call("GET", KEYS[1])
if raw then
  local existing = cjson.decode(raw)
  incoming.amountRefunded = math.max(tonumber(incoming.amountRefunded) or 0, tonumber(existing.amountRefunded) or 0)
  if tostring(existing.eventCreatedAt) > tostring(incoming.eventCreatedAt) or
     (tostring(existing.eventCreatedAt) == tostring(incoming.eventCreatedAt) and tostring(existing.eventId) > tostring(incoming.eventId)) then
    incoming.eventId = existing.eventId
    incoming.eventCreatedAt = existing.eventCreatedAt
    incoming.reason = existing.reason
    incoming.status = existing.status
  end
end
local encoded = cjson.encode(incoming)
redis.call("SET", KEYS[1], encoded, "EX", ARGV[2])
return encoded`,
          [stripeRefundKey(event.paymentIntentId)],
          [JSON.stringify(incoming), STRIPE_EVENT_TTL_SECONDS],
        );
      }
    }

    if (event.eventType === "charge.dispute.created" && event.paymentIntentId) {
      const incoming = disputeProjection(event);
      if (incoming) {
        await this.redis.eval<[string, number], string>(
          `-- stripe-dispute-projection
local incoming = cjson.decode(ARGV[1])
local raw = redis.call("GET", KEYS[1])
if raw then
  local existing = cjson.decode(raw)
  if tostring(existing.eventCreatedAt) > tostring(incoming.eventCreatedAt) or
     (tostring(existing.eventCreatedAt) == tostring(incoming.eventCreatedAt) and tostring(existing.eventId) > tostring(incoming.eventId)) then
    return raw
  end
end
local encoded = cjson.encode(incoming)
redis.call("SET", KEYS[1], encoded, "EX", ARGV[2])
return encoded`,
          [stripeDisputeKey(event.paymentIntentId)],
          [JSON.stringify(incoming), STRIPE_EVENT_TTL_SECONDS],
        );
      }
    }

    if (event.paymentIntentId) await this.reconcileStripeOrder(event.paymentIntentId);
  }

  async claimStripeEvent(eventId: string): Promise<StripeEventClaim> {
    const result = Number(
      await this.redis.eval<[number], number>(
        `if redis.call("EXISTS", KEYS[1]) == 1 then
  return 2
end
if redis.call("SET", KEYS[2], "1", "NX", "EX", ARGV[1]) then
  return 1
end
return 0`,
        [stripeDoneKey(eventId), stripeLockKey(eventId)],
        [STRIPE_LOCK_SECONDS],
      ),
    );
    if (result === 2) return "completed";
    return result === 1 ? "claimed" : "processing";
  }

  async completeStripeEvent(
    eventId: string,
    notification: DeliveryState,
    outcome: StripeEventOutcome = {},
  ): Promise<void> {
    const current = parseStored<StoredStripeEvent>(await this.redis.get(stripeEventKey(eventId)));
    if (!current) throw new Error("Stored Stripe event was not found.");
    await this.projectStripeOrder(current, outcome);
    const updated: StoredStripeEvent = {
      ...current,
      ...outcome,
      processingStatus: "completed",
      notification,
      updatedAt: new Date().toISOString(),
    };
    const ttl = stripeEventTtl(updated);
    await this.redis
      .multi()
      .set(stripeEventKey(eventId), JSON.stringify(updated), { ex: ttl })
      .set(stripeDoneKey(eventId), "1", { ex: ttl })
      .del(stripeLockKey(eventId))
      .exec();
  }

  async failStripeEvent(
    eventId: string,
    notification: DeliveryState,
    outcome: StripeEventOutcome = {},
  ): Promise<void> {
    const current = parseStored<StoredStripeEvent>(await this.redis.get(stripeEventKey(eventId)));
    let payload = "";
    let ttl = STRIPE_EVENT_TTL_SECONDS;
    if (current) {
      const updated: StoredStripeEvent = {
        ...current,
        ...outcome,
        processingStatus: "failed",
        notification,
        attemptCount: (current.attemptCount ?? 0) + 1,
        lastFailureAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      payload = JSON.stringify(updated);
      ttl = stripeEventTtl(updated);
      await this.projectStripeOrder(current, outcome);
    }
    // A completion MULTI may have committed even if its client observed a
    // timeout. Never downgrade that committed record to failed: checking the
    // done marker, updating the event, and releasing the lock are one script.
    await this.redis.eval<[string, number], number>(
      `if redis.call("EXISTS", KEYS[1]) == 1 then
  return 0
end
if ARGV[1] ~= "" then
  redis.call("SET", KEYS[2], ARGV[1], "EX", ARGV[2])
end
redis.call("DEL", KEYS[3])
return 1`,
      [stripeDoneKey(eventId), stripeEventKey(eventId), stripeLockKey(eventId)],
      [payload, ttl],
    );
  }
}

/** Local/test implementation. Production deliberately fails closed without Redis. */
export class InMemoryOperationsStore implements OperationsStore {
  readonly leads = new Map<string, StoredLead>();
  readonly stripeEvents = new Map<string, StoredStripeEvent>();
  readonly stripeOrders = new Map<string, StoredStripeOrder>();
  readonly leadOutbox = new Set<string>();
  private readonly windows = new Map<string, { count: number; resetAt: number }>();
  private readonly stripeLocks = new Set<string>();
  private readonly stripeDone = new Set<string>();
  private readonly reportClaims = new Map<string, number>();
  private readonly stripePaymentOrders = new Map<string, string>();
  private readonly stripeRefunds = new Map<string, StripeRefundProjection>();
  private readonly stripeDisputes = new Map<string, StripeDisputeProjection>();

  constructor(private readonly now: () => number = Date.now) {}

  async rateLimit(scope: string, identity: string, limit: number, windowMs: number) {
    const key = `${scope}:${identityHash(identity)}`;
    const now = this.now();
    const current = this.windows.get(key);
    if (!current || now >= current.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }
    if (current.count >= limit) {
      return { allowed: false, retryAfterMs: current.resetAt - now };
    }
    current.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  async saveLead(lead: StoredLead): Promise<void> {
    if (this.leads.has(lead.id)) throw new Error("Lead identifier already exists.");
    this.leads.set(lead.id, structuredClone(lead));
    this.leadOutbox.add(lead.id);
  }

  async claimReportAndSaveLead(
    reportToken: string,
    reportTtlMs: number,
    lead: StoredLead,
  ): Promise<"saved" | "already_claimed"> {
    const now = this.now();
    const currentClaim = this.reportClaims.get(reportToken);
    if (currentClaim && currentClaim > now) return "already_claimed";
    if (this.leads.has(lead.id)) throw new Error("Lead identifier already exists.");
    this.leads.set(lead.id, structuredClone(lead));
    this.leadOutbox.add(lead.id);
    this.reportClaims.set(
      reportToken,
      now + Math.max(1, Math.min(reportTtlMs, 24 * 60 * 60 * 1000)),
    );
    return "saved";
  }

  async updateLeadDelivery(id: string, delivery: LeadDelivery): Promise<void> {
    const current = this.leads.get(id);
    if (!current) throw new Error("Stored lead was not found.");
    this.leads.set(id, { ...current, delivery: structuredClone(delivery) });
    if (delivery.team === "sent" && ["sent", "not_applicable"].includes(delivery.prospect)) {
      this.leadOutbox.delete(id);
    }
  }

  async recordStripeEvent(event: StoredStripeEvent): Promise<void> {
    if (!this.stripeEvents.has(event.eventId)) {
      this.stripeEvents.set(event.eventId, structuredClone(event));
    }
  }

  async getStripeEvent(eventId: string): Promise<StoredStripeEvent | null> {
    const event = this.stripeEvents.get(eventId);
    return event ? structuredClone(event) : null;
  }

  async getStripeOrder(orderId: string): Promise<StoredStripeOrder | null> {
    const order = this.stripeOrders.get(orderId);
    return order ? structuredClone(order) : null;
  }

  private projectStripeOrder(event: StoredStripeEvent, outcome: StripeEventOutcome): void {
    const now = new Date(this.now()).toISOString();
    const order = checkoutOrder(
      event,
      outcome,
      this.stripeOrders.get(event.objectId) ?? null,
      now,
    );
    if (order) {
      this.stripeOrders.set(order.orderId, structuredClone(order));
      this.stripePaymentOrders.set(order.paymentIntentId, order.orderId);
    }

    if (event.eventType === "charge.refunded" && event.paymentIntentId) {
      const refund = mergeRefundProjection(
        this.stripeRefunds.get(event.paymentIntentId) ?? null,
        event,
      );
      if (refund) this.stripeRefunds.set(event.paymentIntentId, structuredClone(refund));
    }
    if (event.eventType === "charge.dispute.created" && event.paymentIntentId) {
      const incoming = disputeProjection(event);
      const existing = this.stripeDisputes.get(event.paymentIntentId);
      if (
        incoming &&
        (!existing ||
          incoming.eventCreatedAt > existing.eventCreatedAt ||
          (incoming.eventCreatedAt === existing.eventCreatedAt &&
            incoming.eventId >= existing.eventId))
      ) {
        this.stripeDisputes.set(event.paymentIntentId, structuredClone(incoming));
      }
    }

    if (!event.paymentIntentId) return;
    const orderId = this.stripePaymentOrders.get(event.paymentIntentId);
    const currentOrder = orderId ? this.stripeOrders.get(orderId) : undefined;
    if (!orderId || !currentOrder) return;
    this.stripeOrders.set(
      orderId,
      reconcileOrder(
        currentOrder,
        this.stripeRefunds.get(event.paymentIntentId) ?? null,
        this.stripeDisputes.get(event.paymentIntentId) ?? null,
        now,
      ),
    );
  }

  async claimStripeEvent(eventId: string): Promise<StripeEventClaim> {
    if (this.stripeDone.has(eventId)) return "completed";
    if (this.stripeLocks.has(eventId)) return "processing";
    this.stripeLocks.add(eventId);
    return "claimed";
  }

  async completeStripeEvent(
    eventId: string,
    notification: DeliveryState,
    outcome: StripeEventOutcome = {},
  ): Promise<void> {
    const current = this.stripeEvents.get(eventId);
    if (!current) throw new Error("Stored Stripe event was not found.");
    this.projectStripeOrder(current, outcome);
    this.stripeEvents.set(eventId, {
      ...current,
      ...outcome,
      processingStatus: "completed",
      notification,
      updatedAt: new Date(this.now()).toISOString(),
    });
    this.stripeLocks.delete(eventId);
    this.stripeDone.add(eventId);
  }

  async failStripeEvent(
    eventId: string,
    notification: DeliveryState,
    outcome: StripeEventOutcome = {},
  ): Promise<void> {
    if (this.stripeDone.has(eventId)) return;
    const current = this.stripeEvents.get(eventId);
    if (current) {
      this.projectStripeOrder(current, outcome);
      this.stripeEvents.set(eventId, {
        ...current,
        ...outcome,
        processingStatus: "failed",
        notification,
        attemptCount: (current.attemptCount ?? 0) + 1,
        lastFailureAt: new Date(this.now()).toISOString(),
        updatedAt: new Date(this.now()).toISOString(),
      });
    }
    this.stripeLocks.delete(eventId);
  }
}

const globals = globalThis as typeof globalThis & { __qcOperationsStore?: OperationsStore };

export function operationsStore(): OperationsStore {
  if (globals.__qcOperationsStore) return globals.__qcOperationsStore;

  const hasUrl = Boolean(process.env.KV_REST_API_URL?.trim());
  const hasToken = Boolean(process.env.KV_REST_API_TOKEN?.trim());
  if (hasUrl !== hasToken) {
    throw new OperationsStoreUnavailableError(
      "Shared operational storage is partially configured; both Redis credentials are required.",
    );
  }

  if (hasUrl && hasToken) {
    globals.__qcOperationsStore = new RedisOperationsStore();
    return globals.__qcOperationsStore;
  }

  if (process.env.NODE_ENV === "production") throw new OperationsStoreUnavailableError();

  globals.__qcOperationsStore = new InMemoryOperationsStore();
  return globals.__qcOperationsStore;
}
