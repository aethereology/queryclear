import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const modulePath = path.join(projectRoot, "lib", "operations-store.ts");

function loadModule() {
  const output = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modulePath,
  }).outputText;
  const moduleObj = { exports: {} };
  const mockRequire = (id) => {
    if (id === "node:crypto") return { createHash };
    if (id === "@upstash/redis") return { Redis: class UnusedRedis {} };
    throw new Error(`Unexpected import: ${id}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, mockRequire);
  return moduleObj.exports;
}

const {
  InMemoryOperationsStore,
  OperationsStoreUnavailableError,
  RedisOperationsStore,
  operationsStore,
} = loadModule();

class FakeRedis {
  constructor() {
    this.values = new Map();
    this.lists = new Map();
  }

  async get(key) {
    return this.values.get(key) ?? null;
  }

  async set(key, value, options = {}) {
    if (options.nx && this.values.has(key)) return null;
    this.values.set(key, value);
    return "OK";
  }

  async del(key) {
    return this.values.delete(key) ? 1 : 0;
  }

  async eval(script, keys, args) {
    if (script.includes("stripe-order-projection")) {
      const incoming = JSON.parse(args[0]);
      const existingRaw = this.values.get(keys[0]);
      const existing = existingRaw ? JSON.parse(existingRaw) : null;
      if (existing?.ownerNotification === "sent") incoming.ownerNotification = "sent";
      if (existing?.buyerNotification === "sent") incoming.buyerNotification = "sent";
      if (existing?.createdAt) incoming.createdAt = existing.createdAt;
      if (
        existing?.amountRefunded &&
        (!incoming.amountRefunded || existing.amountRefunded > incoming.amountRefunded)
      ) {
        for (const field of [
          "amountRefunded",
          "refundEventId",
          "refundReason",
          "refundStatus",
        ]) incoming[field] = existing[field];
      }
      if (existing?.disputeEventId && !incoming.disputeEventId) {
        for (const field of [
          "disputeEventId",
          "disputeAmount",
          "disputeReason",
          "disputeStatus",
          "disputeEvidenceDueAt",
        ]) incoming[field] = existing[field];
      }
      if (existing?.lastFinancialEventId && !incoming.lastFinancialEventId) {
        incoming.lastFinancialEventId = existing.lastFinancialEventId;
      }
      if (incoming.disputeEventId) {
        incoming.orderStatus = "disputed";
        incoming.intakeStatus = "not_applicable";
        incoming.deliveryDueFrom = "not_applicable";
      } else if (incoming.amountRefunded >= incoming.amountTotal) {
        incoming.orderStatus = "refunded";
        incoming.intakeStatus = "not_applicable";
        incoming.deliveryDueFrom = "not_applicable";
      } else if (incoming.amountRefunded > 0) {
        incoming.orderStatus = "partially_refunded";
      }
      const encoded = JSON.stringify(incoming);
      this.values.set(keys[0], encoded);
      return encoded;
    }
    if (script.includes("stripe-refund-projection")) {
      const incoming = JSON.parse(args[0]);
      const existingRaw = this.values.get(keys[0]);
      const existing = existingRaw ? JSON.parse(existingRaw) : null;
      if (existing) {
        incoming.amountRefunded = Math.max(incoming.amountRefunded, existing.amountRefunded);
        if (
          existing.eventCreatedAt > incoming.eventCreatedAt ||
          (existing.eventCreatedAt === incoming.eventCreatedAt && existing.eventId > incoming.eventId)
        ) {
          incoming.eventId = existing.eventId;
          incoming.eventCreatedAt = existing.eventCreatedAt;
          incoming.reason = existing.reason;
          incoming.status = existing.status;
        }
      }
      const encoded = JSON.stringify(incoming);
      this.values.set(keys[0], encoded);
      return encoded;
    }
    if (script.includes("stripe-dispute-projection")) {
      const incoming = JSON.parse(args[0]);
      const existingRaw = this.values.get(keys[0]);
      const existing = existingRaw ? JSON.parse(existingRaw) : null;
      if (
        existing &&
        (existing.eventCreatedAt > incoming.eventCreatedAt ||
          (existing.eventCreatedAt === incoming.eventCreatedAt && existing.eventId > incoming.eventId))
      ) {
        return existingRaw;
      }
      const encoded = JSON.stringify(incoming);
      this.values.set(keys[0], encoded);
      return encoded;
    }
    throw new Error("Unexpected FakeRedis script.");
  }

  multi() {
    const operations = [];
    const chain = {};
    for (const operation of ["set", "del", "lrem", "lpush", "ltrim", "expire"]) {
      chain[operation] = (...args) => {
        operations.push([operation, args]);
        return chain;
      };
    }
    chain.exec = async () => {
      for (const [operation, args] of operations) {
        if (operation === "set") await this.set(...args);
        else if (operation === "del") await this.del(...args);
        else if (operation === "lpush") {
          const [key, value] = args;
          this.lists.set(key, [value, ...(this.lists.get(key) ?? [])]);
        } else if (operation === "lrem") {
          const [key, , value] = args;
          this.lists.set(key, (this.lists.get(key) ?? []).filter((item) => item !== value));
        } else if (operation === "ltrim") {
          const [key, start, end] = args;
          this.lists.set(key, (this.lists.get(key) ?? []).slice(start, end + 1));
        }
      }
      return operations;
    };
    return chain;
  }
}

function lead(id = "lead-1") {
  return {
    id,
    kind: "inquiry",
    receivedAt: "2026-08-25T12:00:00.000Z",
    websiteHost: "example.com",
    payload: { email: "owner@example.com" },
    delivery: {
      team: "pending",
      prospect: "pending",
      updatedAt: "2026-08-25T12:00:00.000Z",
    },
  };
}

function stripeEvent(id = "evt_1") {
  return {
    eventId: id,
    eventType: "checkout.session.completed",
    receivedAt: "2026-08-25T12:00:00.000Z",
    objectId: "cs_1",
    retentionClass: "transaction",
    processingStatus: "received",
    notification: "pending",
    updatedAt: "2026-08-25T12:00:00.000Z",
  };
}

function paidAuditEvent(id = "evt_checkout", paymentIntentId = "pi_order_12345678") {
  return {
    ...stripeEvent(id),
    eventType: "checkout.session.completed",
    objectId: "cs_test_order_12345678",
    product: "ai-search-audit",
    customerEmail: "buyer@example.com",
    customerId: "cus_order_1",
    website: "https://example.com",
    amountTotal: 49700,
    currency: "usd",
    paymentIntentId,
    checkoutRequestId: "10000000-0000-4000-8000-000000000001",
    termsAccepted: true,
    termsAcceptedAt: "2026-08-25T12:00:00.000Z",
    termsVersion: "2026-08-25",
    orderStatus: "pending_validation",
    validationStatus: "not_checked",
  };
}

function paidAuditOutcome() {
  return {
    orderStatus: "awaiting_intake",
    validationStatus: "verified_current_offer",
    intakeStatus: "awaiting_client",
    deliveryDueFrom: "intake_complete",
    deliveryWindowBusinessDays: 7,
    normalizedWebsite: "https://example.com/",
    ownerNotification: "sent",
    buyerNotification: "sent",
  };
}

async function completeEvent(store, event, outcome = {}) {
  await store.recordStripeEvent(event);
  assert.equal(await store.claimStripeEvent(event.eventId), "claimed");
  await store.completeStripeEvent(event.eventId, "sent", outcome);
}

test("durable lead state remains in the outbox until required notifications succeed", async () => {
  const store = new InMemoryOperationsStore();
  await store.saveLead(lead());
  assert.equal(store.leads.size, 1);
  assert.equal(store.leadOutbox.has("lead-1"), true);

  await store.updateLeadDelivery("lead-1", {
    team: "failed",
    prospect: "sent",
    updatedAt: "2026-08-25T12:01:00.000Z",
  });
  assert.equal(store.leadOutbox.has("lead-1"), true);

  await store.updateLeadDelivery("lead-1", {
    team: "sent",
    prospect: "sent",
    updatedAt: "2026-08-25T12:02:00.000Z",
  });
  assert.equal(store.leadOutbox.has("lead-1"), false);
});

test("report claim and durable lead save are one idempotent operation", async () => {
  const store = new InMemoryOperationsStore();
  assert.equal(
    await store.claimReportAndSaveLead("report-token", 86_400_000, lead("lead-report-1")),
    "saved",
  );
  assert.equal(
    await store.claimReportAndSaveLead("report-token", 86_400_000, lead("lead-report-2")),
    "already_claimed",
  );
  assert.equal(store.leads.has("lead-report-1"), true);
  assert.equal(store.leads.has("lead-report-2"), false);
});

test("rate limits are isolated by scope and reset after the window", async () => {
  let now = 0;
  const store = new InMemoryOperationsStore(() => now);
  assert.equal((await store.rateLimit("lead", "1.2.3.4", 1, 1_000)).allowed, true);
  assert.equal((await store.rateLimit("lead", "1.2.3.4", 1, 1_000)).allowed, false);
  assert.equal((await store.rateLimit("checkout", "1.2.3.4", 1, 1_000)).allowed, true);
  now = 1_001;
  assert.equal((await store.rateLimit("lead", "1.2.3.4", 1, 1_000)).allowed, true);
});

test("Redis rate limit atomically assigns and returns a TTL", async () => {
  const calls = [];
  const redis = {
    eval: async (script, keys, args) => {
      calls.push({ script, keys, args });
      return [2, 9_500];
    },
  };
  const store = new RedisOperationsStore(redis);
  const result = await store.rateLimit("lead", "1.2.3.4", 1, 10_000);
  assert.deepEqual(result, { allowed: false, retryAfterMs: 9_500 });
  assert.equal(calls.length, 1);
  assert.match(calls[0].script, /INCR/);
  assert.match(calls[0].script, /PEXPIRE/);
  assert.deepEqual(calls[0].args, [10_000]);
});

test("Redis lead persistence writes the record and both indexes in one script", async () => {
  const calls = [];
  const redis = {
    eval: async (script, keys, args) => {
      calls.push({ script, keys, args });
      return 1;
    },
  };
  const store = new RedisOperationsStore(redis);
  await store.saveLead(lead("lead-atomic"));
  assert.equal(calls.length, 1);
  assert.match(calls[0].script, /LPUSH/);
  assert.deepEqual(calls[0].keys, [
    "ops:lead:lead-atomic",
    "ops:lead:index",
    "ops:lead:outbox",
  ]);
});

test("Redis Stripe claim checks completion and acquires the lock atomically", async () => {
  const calls = [];
  const redis = {
    eval: async (script, keys, args) => {
      calls.push({ script, keys, args });
      return 2;
    },
  };
  const store = new RedisOperationsStore(redis);
  assert.equal(await store.claimStripeEvent("evt_atomic"), "completed");
  assert.equal(calls.length, 1);
  assert.match(calls[0].script, /EXISTS/);
  assert.match(calls[0].script, /NX/);
  assert.equal(calls[0].keys.length, 2);
});

test("Redis Stripe completion persists fulfillment outcome before marking done", async () => {
  const actions = [];
  const multi = {
    set: (...args) => {
      actions.push(["set", ...args]);
      return multi;
    },
    del: (...args) => {
      actions.push(["del", ...args]);
      return multi;
    },
    exec: async () => actions,
  };
  const redis = {
    get: async () => JSON.stringify(stripeEvent("evt_outcome")),
    multi: () => multi,
  };
  const store = new RedisOperationsStore(redis);
  await store.completeStripeEvent("evt_outcome", "sent", {
    orderStatus: "awaiting_intake",
    intakeStatus: "awaiting_client",
    deliveryDueFrom: "intake_complete",
    deliveryWindowBusinessDays: 7,
    ownerNotification: "sent",
    buyerNotification: "sent",
  });
  const recordWrite = actions.find(
    ([operation, key]) => operation === "set" && key === "ops:stripe:event:evt_outcome",
  );
  const persisted = JSON.parse(recordWrite[2]);
  assert.equal(persisted.processingStatus, "completed");
  assert.equal(persisted.orderStatus, "awaiting_intake");
  assert.equal(persisted.deliveryDueFrom, "intake_complete");
  assert.equal(persisted.buyerNotification, "sent");
  assert.ok(actions.some(
    ([operation, key]) => operation === "set" && key === "ops:stripe:done:evt_outcome",
  ));
});

test("partial Redis configuration fails closed instead of selecting memory", () => {
  const oldUrl = process.env.KV_REST_API_URL;
  const oldToken = process.env.KV_REST_API_TOKEN;
  delete globalThis.__qcOperationsStore;
  process.env.KV_REST_API_URL = "https://redis.example";
  delete process.env.KV_REST_API_TOKEN;
  try {
    assert.throws(() => operationsStore(), OperationsStoreUnavailableError);
  } finally {
    if (oldUrl === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = oldUrl;
    if (oldToken === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = oldToken;
    delete globalThis.__qcOperationsStore;
  }
});

test("Stripe event claim and completion are idempotent", async () => {
  const store = new InMemoryOperationsStore();
  await store.recordStripeEvent(stripeEvent());
  assert.equal(await store.claimStripeEvent("evt_1"), "claimed");
  assert.equal(await store.claimStripeEvent("evt_1"), "processing");
  await store.completeStripeEvent("evt_1", "sent", {
    orderStatus: "awaiting_intake",
    validationStatus: "verified_current_offer",
    intakeStatus: "awaiting_client",
    deliveryDueFrom: "intake_complete",
    deliveryWindowBusinessDays: 7,
    ownerNotification: "sent",
    buyerNotification: "sent",
  });
  assert.equal(await store.claimStripeEvent("evt_1"), "completed");
  assert.equal(store.stripeEvents.get("evt_1").processingStatus, "completed");
  assert.equal(store.stripeEvents.get("evt_1").orderStatus, "awaiting_intake");
  assert.equal(store.stripeEvents.get("evt_1").deliveryDueFrom, "intake_complete");
  assert.equal(store.stripeEvents.get("evt_1").deliveryWindowBusinessDays, 7);
  assert.equal(store.stripeEvents.get("evt_1").buyerNotification, "sent");
  await store.failStripeEvent("evt_1", "failed", {
    orderStatus: "manual_review",
    buyerNotification: "failed",
  });
  assert.equal(store.stripeEvents.get("evt_1").processingStatus, "completed");
  assert.equal(store.stripeEvents.get("evt_1").orderStatus, "awaiting_intake");
});

test("authoritative order aggregate moves from awaiting intake to refunded and disputed", async () => {
  const store = new InMemoryOperationsStore();
  const checkout = paidAuditEvent();
  await completeEvent(store, checkout, paidAuditOutcome());
  assert.equal((await store.getStripeOrder(checkout.objectId)).orderStatus, "awaiting_intake");

  await completeEvent(store, {
    ...stripeEvent("evt_refund_order"),
    eventType: "charge.refunded",
    objectId: "ch_order_1",
    paymentIntentId: checkout.paymentIntentId,
    amountRefunded: 49700,
    refundReason: "requested_by_customer",
    refundStatus: "succeeded",
    eventCreatedAt: "2026-08-26T12:00:00.000Z",
    orderStatus: "refunded",
  });
  let order = await store.getStripeOrder(checkout.objectId);
  assert.equal(order.orderStatus, "refunded");
  assert.equal(order.intakeStatus, "not_applicable");
  assert.equal(order.amountRefunded, 49700);

  await completeEvent(store, {
    ...stripeEvent("evt_dispute_order"),
    eventType: "charge.dispute.created",
    objectId: "dp_order_1",
    paymentIntentId: checkout.paymentIntentId,
    amountAffected: 49700,
    disputeReason: "fraudulent",
    disputeStatus: "needs_response",
    disputeEvidenceDueAt: "2026-09-02T12:00:00.000Z",
    eventCreatedAt: "2026-08-27T12:00:00.000Z",
    orderStatus: "disputed",
  });
  order = await store.getStripeOrder(checkout.objectId);
  assert.equal(order.orderStatus, "disputed");
  assert.equal(order.disputeEventId, "evt_dispute_order");
  assert.equal(order.lastFinancialEventId, "evt_dispute_order");
});

test("out-of-order refund and dispute replay reconcile when checkout arrives later", async () => {
  const store = new InMemoryOperationsStore();
  const checkout = paidAuditEvent("evt_checkout_late", "pi_order_late_12345678");
  await completeEvent(store, {
    ...stripeEvent("evt_refund_early"),
    eventType: "charge.refunded",
    objectId: "ch_order_early",
    paymentIntentId: checkout.paymentIntentId,
    amountRefunded: 49700,
    refundReason: "requested_by_customer",
    refundStatus: "succeeded",
    eventCreatedAt: "2026-08-26T12:00:00.000Z",
    orderStatus: "refunded",
  });
  await completeEvent(store, {
    ...stripeEvent("evt_dispute_early"),
    eventType: "charge.dispute.created",
    objectId: "dp_order_early",
    paymentIntentId: checkout.paymentIntentId,
    amountAffected: 49700,
    disputeReason: "fraudulent",
    disputeStatus: "needs_response",
    eventCreatedAt: "2026-08-27T12:00:00.000Z",
    orderStatus: "disputed",
  });
  assert.equal(await store.getStripeOrder(checkout.objectId), null);

  await completeEvent(store, checkout, paidAuditOutcome());
  const order = await store.getStripeOrder(checkout.objectId);
  assert.equal(order.orderStatus, "disputed");
  assert.equal(order.amountRefunded, 49700);
  assert.equal(order.refundEventId, "evt_refund_early");
  assert.equal(order.disputeEventId, "evt_dispute_early");
  assert.equal(order.deliveryDueFrom, "not_applicable");
});

test("Redis order projection also reconciles an out-of-order refund", async () => {
  const store = new RedisOperationsStore(new FakeRedis());
  const checkout = paidAuditEvent("evt_checkout_redis", "pi_order_redis_12345678");
  const refund = {
    ...stripeEvent("evt_refund_redis"),
    eventType: "charge.refunded",
    objectId: "ch_order_redis",
    paymentIntentId: checkout.paymentIntentId,
    amountRefunded: 49700,
    refundReason: "requested_by_customer",
    refundStatus: "succeeded",
    eventCreatedAt: "2026-08-26T12:00:00.000Z",
    orderStatus: "refunded",
  };
  await store.recordStripeEvent(refund);
  await store.completeStripeEvent(refund.eventId, "sent");
  await store.recordStripeEvent(checkout);
  await store.completeStripeEvent(checkout.eventId, "sent", paidAuditOutcome());
  const order = await store.getStripeOrder(checkout.objectId);
  assert.equal(order.orderStatus, "refunded");
  assert.equal(order.amountRefunded, 49700);
  assert.equal(order.refundEventId, refund.eventId);
});
