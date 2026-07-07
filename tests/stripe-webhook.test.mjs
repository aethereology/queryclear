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

function loadEmailModule() {
  const source = fs.readFileSync(emailModulePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: emailModulePath,
  }).outputText;

  const emailModule = { exports: {} };
  const mockRequire = (id) => {
    throw new Error(`Unexpected email module import: ${id}`);
  };
  const run = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    output,
  );
  run(emailModule.exports, mockRequire, emailModule, emailModulePath, path.dirname(emailModulePath));

  return emailModule.exports;
}

function loadRoute() {
  const source = fs.readFileSync(routePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: routePath,
  }).outputText;

  const sent = [];
  const logs = [];

  class MockStripe {
    constructor(key) {
      this.key = key;
      this.webhooks = {
        // "good" signature → parse body as the event; anything else → throw.
        constructEvent: (body, signature, secret) => {
          if (signature === "good" && secret === "whsec_test") {
            return JSON.parse(body);
          }
          throw new Error("Webhook signature verification failed");
        },
      };
    }
  }

  class MockResend {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.emails = {
        send: async (message) => {
          sent.push(message);
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
    if (id === "@/lib/site") {
      return {
        site: {
          email: "hello@queryclear.com",
          stackKit: { name: "The Local AI Visibility Stack", currency: "usd", unitAmount: 9700, shipDays: 30 },
          carePlan: { name: "AI Search Care Plan", currency: "usd", unitAmount: 99700, interval: "month" },
        },
      };
    }
    throw new Error(`Unexpected import: ${id}`);
  };

  const testConsole = { ...console, error: (...a) => logs.push(["error", ...a]), log: (...a) => logs.push(["log", ...a]) };
  const run = new Function("exports", "require", "module", "__filename", "__dirname", "console", output);
  run(routeModule.exports, mockRequire, routeModule, routePath, path.dirname(routePath), testConsole);

  return { logs, route: routeModule.exports, sent };
}

const completedEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_1",
      amount_total: 9700,
      currency: "usd",
      customer_details: { email: "buyer@example.com", name: "Sam Buyer" },
    },
  },
};

test("returns 503 when not configured", async () => {
  clearEnv();
  const { route } = loadRoute();
  const res = await route.POST(makeRequest(completedEvent, { signature: "good" }));
  assert.equal(res.status, 503);
});

test("returns 400 when signature header is missing", async () => {
  setEnv();
  const { route } = loadRoute();
  const res = await route.POST(makeRequest(completedEvent));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /signature/i);
});

test("returns 400 when signature is invalid", async () => {
  setEnv();
  const { route, sent } = loadRoute();
  const res = await route.POST(makeRequest(completedEvent, { signature: "bad" }));
  assert.equal(res.status, 400);
  assert.equal(sent.length, 0);
});

test("on checkout.session.completed sends an order email and returns received:true", async () => {
  setEnv();
  const { route, sent } = loadRoute();
  const res = await route.POST(makeRequest(completedEvent, { signature: "good" }));

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { received: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "hello@queryclear.com");
  assert.equal(sent[0].replyTo, "buyer@example.com");
  assert.match(sent[0].html, /Sam Buyer/);
  assert.match(sent[0].html, /97\.00/);
});

const auditEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_audit",
      amount_total: 49700,
      currency: "usd",
      metadata: { product: "ai-search-audit" },
      customer_details: { email: "buyer@example.com", name: "Sam Buyer" },
      custom_fields: [{ key: "website", text: { value: "https://example.com" } }],
    },
  },
};

test("on an ai-search-audit purchase sends the audit order email with amount + website", async () => {
  setEnv();
  const { route, sent } = loadRoute();
  const res = await route.POST(makeRequest(auditEvent, { signature: "good" }));

  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /AI Search Audit purchase/i);
  assert.match(sent[0].html, /497\.00/);
  assert.match(sent[0].html, /example\.com/);
});

const carePlanEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_care",
      mode: "subscription",
      amount_total: 99700,
      currency: "usd",
      metadata: { product: "care-plan" },
      subscription: "sub_test_123",
      customer_details: { email: "owner@example.com", name: "Pat Owner" },
      custom_fields: [{ key: "website", text: { value: "https://owner.example" } }],
    },
  },
};

test("on a care-plan subscription sends the Care Plan email (amount + cancel-anytime)", async () => {
  setEnv();
  const { route, sent } = loadRoute();
  const res = await route.POST(makeRequest(carePlanEvent, { signature: "good" }));

  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /Care Plan subscriber/i);
  assert.match(sent[0].html, /997\.00/);
  assert.match(sent[0].html, /owner\.example/);
  assert.match(sent[0].html, /sub_test_123/);
  assert.match(sent[0].html, /[Cc]ancel anytime/);
});

test("a care-plan with a $0 first invoice still reports the configured monthly price", async () => {
  setEnv();
  const { route, sent } = loadRoute();
  const trialEvent = JSON.parse(JSON.stringify(carePlanEvent));
  trialEvent.data.object.amount_total = 0;
  const res = await route.POST(makeRequest(trialEvent, { signature: "good" }));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  // Falls back to site.carePlan.unitAmount / 100.
  assert.match(sent[0].html, /997\.00/);
});

test("ignores non-checkout events without sending email", async () => {
  setEnv();
  const { route, sent } = loadRoute();
  const res = await route.POST(
    makeRequest({ type: "payment_intent.created", data: { object: {} } }, { signature: "good" }),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { received: true });
  assert.equal(sent.length, 0);
});
