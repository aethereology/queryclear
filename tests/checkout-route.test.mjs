import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const routePath = path.join(projectRoot, "app", "api", "checkout", "route.ts");

let ipCounter = 0;

function makeRequest({ ip, origin, product } = {}) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": ip ?? `203.0.113.${++ipCounter}`,
  });
  if (origin) headers.set("origin", origin);
  const init = { method: "POST", headers };
  if (product) init.body = JSON.stringify({ product });
  return new Request("https://www.queryclear.com/api/checkout", init);
}

function clearEnv() {
  delete process.env.STRIPE_SECRET_KEY;
}

function loadRoute({ createImpl } = {}) {
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
  const logs = [];

  class MockStripe {
    constructor(key) {
      this.key = key;
      this.checkout = {
        sessions: {
          create: async (params) => {
            created.push(params);
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
          stackKit: { currency: "usd", unitAmount: 9700, shipDays: 30, name: "The Local AI Visibility Stack" },
          auditProduct: { currency: "usd", unitAmount: 49700, name: "AI Search Audit" },
        },
      };
    }
    throw new Error(`Unexpected import: ${id}`);
  };

  const testConsole = { ...console, error: (...a) => logs.push(["error", ...a]), log: (...a) => logs.push(["log", ...a]) };
  const run = new Function("exports", "require", "module", "__filename", "__dirname", "console", output);
  run(routeModule.exports, mockRequire, routeModule, routePath, path.dirname(routePath), testConsole);

  return { logs, route: routeModule.exports, created };
}

test("returns 503 when STRIPE_SECRET_KEY is not set", async () => {
  clearEnv();
  const { route } = loadRoute();
  const res = await route.POST(makeRequest());
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /isn't available|email/i);
});

test("creates a Checkout Session with the right amount, currency, and metadata", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route, created } = loadRoute();
  const res = await route.POST(makeRequest({ origin: "https://www.queryclear.com" }));

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { url: "https://checkout.stripe.test/cs_test_1" });
  assert.equal(created.length, 1);
  const params = created[0];
  assert.equal(params.mode, "payment");
  assert.equal(params.line_items[0].price_data.unit_amount, 9700);
  assert.equal(params.line_items[0].price_data.currency, "usd");
  assert.equal(params.metadata.product, "stack-kit");
  assert.match(params.success_url, /^https:\/\/www\.queryclear\.com\/stack-kit\/success/);
  assert.match(params.cancel_url, /\/stack-kit\?canceled=1$/);
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

test("returns 400 for an unknown product", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const { route } = loadRoute();
  const res = await route.POST(makeRequest({ product: "nope" }));
  assert.equal(res.status, 400);
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
