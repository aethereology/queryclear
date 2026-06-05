import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const routePath = path.join(projectRoot, "app", "api", "stripe", "webhook", "route.ts");

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
    if (id === "@/lib/site") {
      return {
        site: {
          email: "info@queryclear.com",
          stackKit: { name: "The Local AI Visibility Stack", currency: "usd", unitAmount: 9700, shipDays: 30 },
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
  assert.equal(sent[0].to, "info@queryclear.com");
  assert.equal(sent[0].replyTo, "buyer@example.com");
  assert.match(sent[0].html, /Sam Buyer/);
  assert.match(sent[0].html, /97\.00/);
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
