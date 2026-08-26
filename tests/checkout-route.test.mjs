import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const routePath = path.join(projectRoot, "app", "api", "checkout", "route.ts");
const jsonRequestModulePath = path.join(projectRoot, "lib", "json-request.ts");

let ipCounter = 0;
let requestCounter = 0;

test.beforeEach(() => {
  process.env.AUDIT_CHECKOUT_PAUSED = "false";
});

test.after(() => {
  delete process.env.AUDIT_CHECKOUT_PAUSED;
});

function makeRequest({
  ip,
  origin,
  product = "ai-search-audit",
  termsAccepted = true,
  termsVersion = "2026-08-25",
  requestId = `00000000-0000-4000-8000-${String(++requestCounter).padStart(12, "0")}`,
  contentType = "application/json",
  extraBody = {},
} = {}) {
  const headers = new Headers({ "x-forwarded-for": ip ?? `203.0.113.${++ipCounter}` });
  if (contentType !== null) headers.set("content-type", contentType);
  if (origin) headers.set("origin", origin);
  if (requestId) headers.set("idempotency-key", requestId);
  const init = { method: "POST", headers };
  init.body = JSON.stringify({ product, termsAccepted, termsVersion, ...extraBody });
  return new Request("https://www.queryclear.com/api/checkout", init);
}

function loadJsonRequestModule() {
  const output = ts.transpileModule(fs.readFileSync(jsonRequestModulePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: jsonRequestModulePath,
  }).outputText;
  const moduleObj = { exports: {} };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, () => {});
  return moduleObj.exports;
}

function clearEnv() {
  delete process.env.STRIPE_SECRET_KEY;
  process.env.AUDIT_CHECKOUT_PAUSED = "false";
}

function loadRoute({ createImpl, rateLimitImpl } = {}) {
  const source = fs.readFileSync(routePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: routePath,
  }).outputText;

  const created = [];
  const createdOptions = [];
  const logs = [];
  const rateLimits = new Map();
  const store = {
    rateLimit: async (scope, identity, limit, windowMs) => {
      if (rateLimitImpl) return rateLimitImpl(scope, identity, limit, windowMs);
      const key = `${scope}:${identity}`;
      const count = (rateLimits.get(key) ?? 0) + 1;
      rateLimits.set(key, count);
      return { allowed: count <= limit, retryAfterMs: windowMs };
    },
  };

  class MockStripe {
    constructor(key) {
      this.key = key;
      this.checkout = {
        sessions: {
          create: async (params, options) => {
            created.push(params);
            createdOptions.push(options);
            if (createImpl) return createImpl(params);
            return { id: "cs_test_1", url: "https://checkout.stripe.test/cs_test_1" };
          },
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
    if (id === "@/lib/site") {
      return {
        site: {
          email: "hello@queryclear.com",
          url: "https://www.queryclear.com",
          legal: { termsVersion: "2026-08-25" },
          stackKit: { currency: "usd", unitAmount: 9700, shipDays: 30, name: "The Local AI Visibility Stack" },
          auditProduct: { currency: "usd", unitAmount: 49700, name: "AI Search Audit" },
          carePlan: { currency: "usd", unitAmount: 99700, interval: "month", name: "AI Search Care Plan" },
        },
      };
    }
    if (id === "@/lib/operations-store") return { operationsStore: () => store };
    if (id === "@/lib/json-request") return loadJsonRequestModule();
    throw new Error(`Unexpected import: ${id}`);
  };

  const testConsole = { ...console, error: (...a) => logs.push(["error", ...a]), log: (...a) => logs.push(["log", ...a]) };
  const run = new Function("exports", "require", "module", "__filename", "__dirname", "console", output);
  run(routeModule.exports, mockRequire, routeModule, routePath, path.dirname(routePath), testConsole);

  return { logs, route: routeModule.exports, created, createdOptions };
}

test("returns 503 when STRIPE_SECRET_KEY is not set", async () => {
  clearEnv();
  const { route } = loadRoute();
  const res = await route.POST(makeRequest());
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /isn't available|email/i);
});

test("fails closed before Stripe when paid-audit capacity is not explicitly open", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();

  for (const value of [undefined, "true", "paused", "0", ""]) {
    if (value === undefined) delete process.env.AUDIT_CHECKOUT_PAUSED;
    else process.env.AUDIT_CHECKOUT_PAUSED = value;
    const response = await route.POST(makeRequest());
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /paused|capacity|opening/i);
  }

  assert.equal(created.length, 0);
  process.env.AUDIT_CHECKOUT_PAUSED = "false";
});

test("pins return URLs to the canonical site and records the accepted terms", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created, createdOptions } = loadRoute();
  const res = await route.POST(makeRequest({ origin: "https://www.queryclear.com" }));

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { url: "https://checkout.stripe.test/cs_test_1" });
  assert.equal(created.length, 1);
  const params = created[0];
  assert.equal(params.mode, "payment");
  assert.equal(params.line_items[0].price_data.unit_amount, 49700);
  assert.equal(params.line_items[0].price_data.currency, "usd");
  assert.match(
    params.line_items[0].price_data.product_data.description,
    /12 total prompt-engine observations/i,
  );
  assert.equal(params.metadata.product, "ai-search-audit");
  assert.equal(params.metadata.terms_accepted, "true");
  assert.equal(params.metadata.terms_version, "2026-08-25");
  assert.match(params.metadata.terms_accepted_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(params.metadata.checkout_request_id, createdOptions[0].idempotencyKey);
  assert.equal(params.payment_intent_data.metadata.terms_version, "2026-08-25");
  assert.match(params.success_url, /^https:\/\/www\.queryclear\.com\/ai-visibility-audit\/success/);
});

test("rejects a browser request from an origin outside the allowlist", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const response = await route.POST(makeRequest({ origin: "https://attacker.example" }));
  assert.equal(response.status, 403);
  assert.equal(created.length, 0);
});

test("creates an AI Search Audit session ($497) when product=ai-search-audit", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const res = await route.POST(
    makeRequest({ origin: "https://www.queryclear.com", product: "ai-search-audit" }),
  );

  assert.equal(res.status, 200);
  assert.equal(created.length, 1);
  const params = created[0];
  assert.equal(params.mode, "payment");
  assert.equal(params.line_items[0].price_data.unit_amount, 49700);
  assert.equal(params.metadata.product, "ai-search-audit");
  assert.match(params.success_url, /\/ai-visibility-audit\/success/);
  assert.match(params.cancel_url, /\/ai-visibility-audit\?canceled=1$/);
  // Must capture the buyer's site for fulfillment.
  assert.ok(params.custom_fields?.some((f) => f.key === "website"), "website custom field present");
});

test("blocks direct Care Plan checkout until eligibility is reviewed", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const res = await route.POST(
    makeRequest({ origin: "https://www.queryclear.com", product: "care-plan" }),
  );

  assert.equal(res.status, 403);
  assert.equal(created.length, 0);
  assert.match((await res.json()).error, /eligibility review/i);
});

test("returns 400 for an unknown product", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route } = loadRoute();
  const res = await route.POST(makeRequest({ product: "nope" }));
  assert.equal(res.status, 400);
});

test("returns 410 for the retired Stack Kit checkout", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const res = await route.POST(makeRequest({ product: "stack-kit" }));
  assert.equal(res.status, 410);
  assert.equal(created.length, 0);
});

test("requires affirmative assent to the current Terms version", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const missing = await route.POST(makeRequest({ termsAccepted: false }));
  const stale = await route.POST(makeRequest({ termsVersion: "2026-01-01" }));
  assert.equal(missing.status, 422);
  assert.equal(stale.status, 422);
  assert.equal(created.length, 0);
});

test("requires a stable idempotency key before creating a Stripe session", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const response = await route.POST(makeRequest({ requestId: "short" }));
  assert.equal(response.status, 400);
  assert.equal(created.length, 0);
  assert.match((await response.json()).error, /request ID/i);
});

test("rejects wrong content types and bodies above the checkout cap", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const wrongType = await route.POST(makeRequest({ contentType: "text/plain" }));
  const oversized = await route.POST(makeRequest({ extraBody: { padding: "x".repeat(3_000) } }));
  assert.equal(wrongType.status, 415);
  assert.equal(oversized.status, 413);
  assert.equal(created.length, 0);
});

test("returns 502 when Stripe throws", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route } = loadRoute({
    createImpl: () => {
      throw new Error("StripeError");
    },
  });
  const res = await route.POST(makeRequest());
  assert.equal(res.status, 502);
});

test("rate limiting blocks after the max for one IP", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route } = loadRoute();
  const ip = "198.51.100.55";
  for (let i = 0; i < 8; i += 1) {
    const res = await route.POST(makeRequest({ ip }));
    assert.equal(res.status, 200);
  }
  const blocked = await route.POST(makeRequest({ ip }));
  assert.equal(blocked.status, 429);
});

test("fails closed when distributed rate-limit storage is unavailable", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute({
    rateLimitImpl: async () => { throw new Error("redis unavailable"); },
  });
  const res = await route.POST(makeRequest());
  assert.equal(res.status, 503);
  assert.equal(created.length, 0);
});
