import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const routePath = path.join(projectRoot, "app", "api", "stripe", "webhook", "route.ts");
const emailModulePath = path.join(projectRoot, "lib", "email.ts");
const checkoutModulePath = path.join(projectRoot, "lib", "checkout-session.ts");

const siteFixture = {
  name: "queryclear",
  url: "https://www.queryclear.com",
  email: "hello@queryclear.com",
  description: "Modern SEO for the AI search era.",
  legal: { termsVersion: "2026-08-25" },
  auditProduct: {
    name: "AI Search Audit",
    currency: "usd",
    unitAmount: 49700,
    deliveryBusinessDays: 7,
    pageLimit: 10,
    promptLimit: 12,
    engineLimit: 3,
    walkthroughMinutes: 45,
  },
};

function makeRequest(eventObj, { signature } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature) headers.set("stripe-signature", signature);
  return new Request("https://www.queryclear.com/api/stripe/webhook", {
    method: "POST",
    headers,
    body: typeof eventObj === "string" ? eventObj : JSON.stringify(eventObj),
  });
}

function setEnv() {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.RESEND_API_KEY = "test_key";
  delete process.env.LEAD_TO;
  delete process.env.LEAD_FROM;
}

function clearEnv() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.RESEND_API_KEY;
}

function transpile(modulePath) {
  return ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modulePath,
  }).outputText;
}

function loadEmailModule() {
  const emailModule = { exports: {} };
  const mockRequire = (id) => {
    throw new Error(`Unexpected email module import: ${id}`);
  };
  new Function("exports", "require", "module", transpile(emailModulePath))(
    emailModule.exports,
    mockRequire,
    emailModule,
  );
  return emailModule.exports;
}

function loadCheckoutModule(MockStripe) {
  const checkoutModule = { exports: {} };
  const mockRequire = (id) => {
    if (id === "stripe") return MockStripe;
    if (id === "@/lib/site") return { site: siteFixture };
    if (id === "@/lib/public-audit-url") {
      return {
        normalizePublicAuditUrl: (raw) => {
          const url = new URL(raw);
          if (
            !["http:", "https:"].includes(url.protocol) ||
            url.username ||
            url.password ||
            url.port ||
            ["localhost", "127.0.0.1"].includes(url.hostname)
          ) {
            throw new Error("Website is not public.");
          }
          return `${url.protocol}//${url.host}/`;
        },
      };
    }
    throw new Error(`Unexpected checkout module import: ${id}`);
  };
  new Function("exports", "require", "module", transpile(checkoutModulePath))(
    checkoutModule.exports,
    mockRequire,
    checkoutModule,
  );
  return checkoutModule.exports;
}

function loadRoute({ sendImpl, storeImpl } = {}) {
  const sent = [];
  const sendOptions = [];
  const logs = [];
  const events = new Map();
  const locks = new Set();
  const done = new Set();
  const store = {
    recordStripeEvent: async (event) => {
      if (!events.has(event.eventId)) events.set(event.eventId, structuredClone(event));
    },
    getStripeEvent: async (id) => {
      const event = events.get(id);
      return event ? structuredClone(event) : null;
    },
    claimStripeEvent: async (id) => {
      if (done.has(id)) return "completed";
      if (locks.has(id)) return "processing";
      locks.add(id);
      return "claimed";
    },
    completeStripeEvent: async (id, notification, outcome = {}) => {
      const event = events.get(id);
      events.set(id, { ...event, ...outcome, processingStatus: "completed", notification });
      locks.delete(id);
      done.add(id);
    },
    failStripeEvent: async (id, notification, outcome = {}) => {
      const event = events.get(id);
      events.set(id, { ...event, ...outcome, processingStatus: "failed", notification });
      locks.delete(id);
    },
    ...storeImpl,
  };

  class MockStripe {
    constructor(key) {
      this.key = key;
      this.webhooks = {
        constructEvent: (body, signature, secret) => {
          if (signature === "good" && secret === "whsec_test") return JSON.parse(body);
          throw new Error("Webhook signature verification failed");
        },
      };
    }
  }

  class MockResend {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.emails = {
        send: async (message, options) => {
          sent.push(message);
          sendOptions.push(options);
          if (sendImpl) return sendImpl(message, sent.length, options);
          return { data: { id: `email_${sent.length}` }, error: null };
        },
      };
    }
  }

  const routeModule = { exports: {} };
  const mockRequire = (id) => {
    if (id === "next/server") {
      return { NextResponse: { json: (body, init = {}) => Response.json(body, init) } };
    }
    if (id === "stripe") return MockStripe;
    if (id === "resend") return { Resend: MockResend };
    if (id === "@/lib/email") return loadEmailModule();
    if (id === "@/lib/checkout-session") return loadCheckoutModule(MockStripe);
    if (id === "@/lib/site") return { site: siteFixture };
    if (id === "@/lib/operations-store") return { operationsStore: () => store };
    throw new Error(`Unexpected import: ${id}`);
  };

  const testConsole = {
    ...console,
    error: (...args) => logs.push(["error", ...args]),
    log: (...args) => logs.push(["log", ...args]),
  };
  new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    "console",
    transpile(routePath),
  )(
    routeModule.exports,
    mockRequire,
    routeModule,
    routePath,
    path.dirname(routePath),
    testConsole,
  );

  return { events, logs, route: routeModule.exports, sendOptions, sent };
}

const acceptedAt = new Date(Date.now() - 60_000).toISOString();
const sessionCreated = Math.floor((Date.now() - 30_000) / 1000);
const auditEvent = {
  id: "evt_test_audit",
  type: "checkout.session.completed",
  created: 1_777_291_300,
  livemode: false,
  data: {
    object: {
      object: "checkout.session",
      id: "cs_test_audit_12345678",
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      amount_total: 49700,
      currency: "usd",
      created: sessionCreated,
      metadata: {
        product: "ai-search-audit",
        checkout_request_id: "10000000-0000-4000-8000-000000000001",
        terms_accepted: "true",
        terms_accepted_at: acceptedAt,
        terms_version: "2026-08-25",
      },
      customer: "cus_test_1",
      payment_intent: "pi_test_12345678",
      customer_details: { email: "buyer@example.com", name: "Sam Buyer" },
      custom_fields: [{ key: "website", text: { value: "https://example.com/about" } }],
    },
  },
};

const retiredStackEvent = {
  id: "evt_test_stack",
  type: "checkout.session.completed",
  data: {
    object: {
      object: "checkout.session",
      id: "cs_test_stack_12345678",
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      amount_total: 9700,
      currency: "usd",
      created: 1_777_291_200,
      metadata: { product: "stack-kit" },
      customer_details: { email: "buyer@example.com", name: "Sam Buyer" },
    },
  },
};

const carePlanEvent = {
  id: "evt_test_care",
  type: "checkout.session.completed",
  data: {
    object: {
      object: "checkout.session",
      id: "cs_test_care_12345678",
      mode: "subscription",
      status: "complete",
      payment_status: "paid",
      amount_total: 99700,
      currency: "usd",
      created: 1_777_291_200,
      metadata: { product: "care-plan" },
      subscription: "sub_test_123",
      customer_details: { email: "owner@example.com", name: "Pat Owner" },
    },
  },
};

test("requires configuration and a valid Stripe signature", async () => {
  clearEnv();
  assert.equal(
    (await loadRoute().route.POST(makeRequest(auditEvent, { signature: "good" }))).status,
    503,
  );

  setEnv();
  assert.equal((await loadRoute().route.POST(makeRequest(auditEvent))).status, 400);
  const invalid = loadRoute();
  assert.equal(
    (await invalid.route.POST(makeRequest(auditEvent, { signature: "bad" }))).status,
    400,
  );
  assert.equal(invalid.sent.length, 0);
});

test("a valid current audit sends distinct idempotent owner and buyer intake emails", async () => {
  setEnv();
  const { events, route, sendOptions, sent } = loadRoute();
  const response = await route.POST(makeRequest(auditEvent, { signature: "good" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true });
  assert.equal(sent.length, 2);

  const owner = sent.find((message) => message.to === "hello@queryclear.com");
  const buyer = sent.find((message) => message.to === "buyer@example.com");
  assert.match(owner.subject, /AI Search Audit purchase/i);
  assert.equal(owner.replyTo, "buyer@example.com");
  assert.match(owner.html, /497\.00/);
  assert.match(owner.html, /awaiting intake/i);
  assert.match(buyer.subject, /complete your AI Search Audit intake/i);
  assert.match(buyer.html, /delivery clock has not started/i);
  assert.match(buyer.html, /7 business days after complete intake/i);
  assert.match(buyer.text, /Reply with:/);
  assert.deepEqual(
    new Set(sendOptions.map((options) => options.idempotencyKey)),
    new Set([
      "stripe-order-cs_test_audit_12345678-owner",
      "stripe-order-cs_test_audit_12345678-buyer",
    ]),
  );

  const stored = events.get(auditEvent.id);
  assert.equal(stored.orderStatus, "awaiting_intake");
  assert.equal(stored.validationStatus, "verified_current_offer");
  assert.equal(stored.intakeStatus, "awaiting_client");
  assert.equal(stored.deliveryDueFrom, "intake_complete");
  assert.equal(stored.deliveryWindowBusinessDays, 7);
  assert.equal(stored.normalizedWebsite, "https://example.com/");
  assert.equal(stored.ownerNotification, "sent");
  assert.equal(stored.buyerNotification, "sent");
});

test("retired Stack Kit and gated Care Plan checkouts cannot trigger fulfillment", async () => {
  setEnv();
  const unpaidRetiredStack = structuredClone(retiredStackEvent);
  unpaidRetiredStack.id = "evt_test_stack_unpaid";
  unpaidRetiredStack.data.object.payment_status = "unpaid";
  for (const event of [retiredStackEvent, unpaidRetiredStack, carePlanEvent]) {
    const { events, route, sent } = loadRoute();
    const response = await route.POST(makeRequest(event, { signature: "good" }));
    assert.equal(response.status, 200);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "hello@queryclear.com");
    assert.match(sent[0].subject, /blocked from fulfillment/i);
    assert.doesNotMatch(sent[0].subject, /subscriber|order confirmed/i);
    assert.equal(events.get(event.id).orderStatus, "manual_review");
    assert.equal(events.get(event.id).validationStatus, "disabled_or_unknown_offer");
    assert.equal(events.get(event.id).buyerNotification, "not_applicable");
  }
});

test("wrong price, stale terms, invalid request ID, email, or website never fulfills", async () => {
  setEnv();
  const mutations = [
    (session) => { session.amount_total = 9700; },
    (session) => { session.payment_intent = null; },
    (session) => { session.metadata.terms_version = "old"; },
    (session) => { session.metadata.terms_accepted = "false"; },
    (session) => { session.metadata.checkout_request_id = "short"; },
    (session) => { session.customer_details.email = "invalid"; },
    (session) => { session.custom_fields[0].text.value = "http://127.0.0.1"; },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const event = structuredClone(auditEvent);
    event.id = `evt_invalid_audit_${index}`;
    mutate(event.data.object);
    const { events, route, sent } = loadRoute();
    const response = await route.POST(makeRequest(event, { signature: "good" }));
    assert.equal(response.status, 200);
    assert.equal(sent.length, 1);
    assert.match(sent[0].subject, /manual review/i);
    const stored = events.get(event.id);
    assert.equal(stored.orderStatus, "manual_review");
    assert.equal(stored.validationStatus, "invalid_current_offer");
    assert.equal(stored.buyerNotification, "not_applicable");
    if (index === 3) assert.equal(stored.termsAccepted, false);
  }
});

test("persists legal/order state and suppresses duplicate webhook delivery", async () => {
  setEnv();
  const { events, route, sent } = loadRoute();
  assert.equal(
    (await route.POST(makeRequest(auditEvent, { signature: "good" }))).status,
    200,
  );
  assert.equal(
    (await route.POST(makeRequest(auditEvent, { signature: "good" }))).status,
    200,
  );
  assert.equal(sent.length, 2);
  const stored = events.get(auditEvent.id);
  assert.equal(stored.processingStatus, "completed");
  assert.equal(stored.notification, "sent");
  assert.equal(stored.termsAccepted, true);
  assert.equal(stored.termsVersion, "2026-08-25");
  assert.equal(stored.termsAcceptedAt, acceptedAt);
  assert.equal(stored.checkoutRequestId, "10000000-0000-4000-8000-000000000001");
  assert.equal(stored.customerId, "cus_test_1");
  assert.equal(stored.paymentIntentId, "pi_test_12345678");
});

test("notification idempotency is order-scoped across distinct success event IDs", async () => {
  setEnv();
  const { route, sendOptions } = loadRoute();
  const asyncSuccess = structuredClone(auditEvent);
  asyncSuccess.id = "evt_test_audit_async_success";
  asyncSuccess.type = "checkout.session.async_payment_succeeded";
  assert.equal(
    (await route.POST(makeRequest(auditEvent, { signature: "good" }))).status,
    200,
  );
  assert.equal(
    (await route.POST(makeRequest(asyncSuccess, { signature: "good" }))).status,
    200,
  );
  assert.equal(sendOptions.length, 4);
  assert.equal(new Set(sendOptions.map((options) => options.idempotencyKey)).size, 2);
});

test("an in-flight claim remains retryable and durable-store failure prevents side effects", async () => {
  setEnv();
  const inFlight = loadRoute({ storeImpl: { claimStripeEvent: async () => "processing" } });
  const response = await inFlight.route.POST(
    makeRequest(auditEvent, { signature: "good" }),
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "300");
  assert.equal(inFlight.sent.length, 0);

  const unavailable = loadRoute({
    storeImpl: { recordStripeEvent: async () => { throw new Error("redis unavailable"); } },
  });
  assert.equal(
    (await unavailable.route.POST(makeRequest(auditEvent, { signature: "good" }))).status,
    503,
  );
  assert.equal(unavailable.sent.length, 0);
});

test("partial notification failure is persisted and retried with stable channel keys", async () => {
  setEnv();
  let buyerAttempts = 0;
  const harness = loadRoute({
    sendImpl: async (message, _count, options) => {
      if (message.to === "buyer@example.com" && buyerAttempts++ === 0) {
        return { data: null, error: { name: "rate_limit_exceeded" } };
      }
      return { data: { id: options.idempotencyKey }, error: null };
    },
  });
  const first = await harness.route.POST(makeRequest(auditEvent, { signature: "good" }));
  assert.equal(first.status, 500);
  assert.equal(harness.events.get(auditEvent.id).processingStatus, "failed");
  assert.equal(harness.events.get(auditEvent.id).ownerNotification, "sent");
  assert.equal(harness.events.get(auditEvent.id).buyerNotification, "failed");

  const retry = await harness.route.POST(makeRequest(auditEvent, { signature: "good" }));
  assert.equal(retry.status, 200);
  assert.equal(harness.events.get(auditEvent.id).processingStatus, "completed");
  assert.equal(harness.events.get(auditEvent.id).buyerNotification, "sent");
  const ownerKeys = harness.sendOptions
    .map((options) => options.idempotencyKey)
    .filter((key) => key.endsWith("-owner"));
  assert.deepEqual(ownerKeys, ["stripe-order-cs_test_audit_12345678-owner"]);
});

test("missing notification configuration fails closed for a valid paid order", async () => {
  setEnv();
  delete process.env.RESEND_API_KEY;
  const { events, route, sent } = loadRoute();
  const response = await route.POST(makeRequest(auditEvent, { signature: "good" }));
  assert.equal(response.status, 500);
  assert.equal(sent.length, 0);
  const stored = events.get(auditEvent.id);
  assert.equal(stored.processingStatus, "failed");
  assert.equal(stored.notification, "not_configured");
  assert.equal(stored.ownerNotification, "not_configured");
  assert.equal(stored.buyerNotification, "not_configured");
});

test("an unpaid completed session waits for the asynchronous success event", async () => {
  setEnv();
  const event = structuredClone(auditEvent);
  event.id = "evt_unpaid";
  event.data.object.payment_status = "unpaid";
  const { events, route, sent } = loadRoute();
  const response = await route.POST(makeRequest(event, { signature: "good" }));
  assert.equal(response.status, 200);
  assert.equal(sent.length, 0);
  assert.equal(events.get(event.id).notification, "not_applicable");
  assert.equal(events.get(event.id).orderStatus, "awaiting_payment");
  assert.equal(events.get(event.id).validationStatus, "awaiting_payment");
});

test("projects refund, dispute, invoice, and subscription lifecycle fields durably", async () => {
  setEnv();
  const { events, route, sent } = loadRoute();
  const lifecycle = [
    {
      id: "evt_refund",
      type: "charge.refunded",
      created: 1_777_300_000,
      livemode: true,
      data: { object: {
        object: "charge",
        id: "ch_1",
        amount_refunded: 49700,
        currency: "usd",
        customer: "cus_1",
        payment_intent: "pi_1",
        status: "succeeded",
        refunds: { data: [{
          id: "re_1",
          amount: 49700,
          reason: "requested_by_customer",
          status: "succeeded",
          created: 1_777_299_900,
        }] },
      } },
    },
    {
      id: "evt_dispute",
      type: "charge.dispute.created",
      created: 1_777_300_100,
      livemode: true,
      data: { object: {
        object: "dispute",
        id: "dp_1",
        amount: 49700,
        currency: "usd",
        charge: "ch_1",
        payment_intent: "pi_1",
        reason: "fraudulent",
        status: "needs_response",
        evidence_details: { due_by: 1_777_900_000 },
      } },
    },
    {
      id: "evt_invoice",
      type: "invoice.paid",
      created: 1_777_300_200,
      livemode: true,
      data: { object: {
        object: "invoice",
        id: "in_1",
        number: "QC-0001",
        customer: "cus_1",
        customer_email: "client@example.com",
        parent: {
          type: "subscription_details",
          subscription_details: { subscription: "sub_1", metadata: {} },
        },
        payments: {
          data: [{
            id: "inpay_1",
            status: "paid",
            payment: { type: "payment_intent", payment_intent: "pi_2" },
          }],
        },
        amount_due: 99700,
        amount_paid: 99700,
        amount_remaining: 0,
        currency: "usd",
        status: "paid",
        billing_reason: "subscription_cycle",
        collection_method: "charge_automatically",
        attempt_count: 1,
        next_payment_attempt: null,
        status_transitions: { paid_at: 1_777_300_190 },
        period_start: 1_777_000_000,
        period_end: 1_779_600_000,
      } },
    },
    {
      id: "evt_subscription",
      type: "customer.subscription.updated",
      created: 1_777_300_300,
      livemode: true,
      data: { object: {
        object: "subscription",
        id: "sub_1",
        customer: "cus_1",
        latest_invoice: "in_1",
        status: "active",
        collection_method: "charge_automatically",
        items: { data: [{
          id: "si_1",
          price: "price_care",
          quantity: 1,
          current_period_start: 1_777_000_000,
          current_period_end: 1_779_600_000,
        }] },
        cancel_at: 1_779_600_000,
        canceled_at: 1_777_300_250,
        cancel_at_period_end: true,
      } },
    },
  ];

  for (const event of lifecycle) {
    assert.equal(
      (await route.POST(makeRequest(event, { signature: "good" }))).status,
      200,
    );
  }
  assert.equal(sent.length, 2);

  const refund = events.get("evt_refund");
  assert.equal(refund.orderStatus, "refunded");
  assert.equal(refund.amountRefunded, 49700);
  assert.equal(refund.refundId, "re_1");
  assert.equal(refund.refundReason, "requested_by_customer");
  assert.equal(refund.refundStatus, "succeeded");
  assert.equal(refund.latestRefundAmount, 49700);
  assert.equal(refund.chargeId, "ch_1");
  assert.equal(refund.livemode, true);

  const dispute = events.get("evt_dispute");
  assert.equal(dispute.orderStatus, "disputed");
  assert.equal(dispute.amountAffected, 49700);
  assert.equal(dispute.disputeReason, "fraudulent");
  assert.equal(dispute.disputeStatus, "needs_response");
  assert.equal(dispute.disputeEvidenceDueAt, new Date(1_777_900_000_000).toISOString());

  const invoice = events.get("evt_invoice");
  assert.equal(invoice.invoiceId, "in_1");
  assert.equal(invoice.invoiceNumber, "QC-0001");
  assert.equal(invoice.amountDue, 99700);
  assert.equal(invoice.amountPaid, 99700);
  assert.equal(invoice.amountRemaining, 0);
  assert.equal(invoice.billingReason, "subscription_cycle");
  assert.equal(invoice.subscriptionId, "sub_1");
  assert.equal(invoice.paymentIntentId, "pi_2");
  assert.equal(invoice.invoiceAttemptCount, 1);
  assert.equal(invoice.invoicePaidAt, new Date(1_777_300_190_000).toISOString());
  assert.equal(invoice.periodEnd, new Date(1_779_600_000_000).toISOString());

  const subscription = events.get("evt_subscription");
  assert.equal(subscription.subscriptionId, "sub_1");
  assert.equal(subscription.latestInvoiceId, "in_1");
  assert.equal(subscription.cancelAtPeriodEnd, true);
  assert.equal(subscription.periodStart, new Date(1_777_000_000_000).toISOString());
  assert.equal(subscription.periodEnd, new Date(1_779_600_000_000).toISOString());
  assert.deepEqual(subscription.subscriptionItemPeriods, [{
    itemId: "si_1",
    priceId: "price_care",
    quantity: 1,
    periodStart: new Date(1_777_000_000_000).toISOString(),
    periodEnd: new Date(1_779_600_000_000).toISOString(),
  }]);
  assert.equal(subscription.cancelAt, new Date(1_779_600_000_000).toISOString());
  assert.equal(subscription.canceledAt, new Date(1_777_300_250_000).toISOString());
});

test("untracked Stripe events are acknowledged without storage or email", async () => {
  setEnv();
  const { events, route, sent } = loadRoute();
  const response = await route.POST(
    makeRequest(
      { id: "evt_ignored", type: "payment_intent.created", data: { object: {} } },
      { signature: "good" },
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(events.size, 0);
  assert.equal(sent.length, 0);
});
