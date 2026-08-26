import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.resolve(__dirname, "..", "lib", "checkout-session.ts");

function loadModule(session) {
  const output = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modulePath,
  }).outputText;
  class MockStripe {
    constructor() {
      this.checkout = { sessions: { retrieve: async () => structuredClone(session) } };
    }
  }
  const moduleObj = { exports: {} };
  const mockRequire = (id) => {
    if (id === "stripe") return MockStripe;
    if (id === "@/lib/site") {
      return {
        site: {
          legal: { termsVersion: "2026-08-25" },
          auditProduct: { unitAmount: 49700, currency: "usd" },
        },
      };
    }
    if (id === "@/lib/public-audit-url") {
      return {
        normalizePublicAuditUrl: (raw) => {
          const url = new URL(raw);
          if (!["http:", "https:"].includes(url.protocol) || url.hostname === "localhost") {
            throw new Error("not public");
          }
          return `${url.protocol}//${url.host}/`;
        },
      };
    }
    throw new Error(`Unexpected import: ${id}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, mockRequire);
  return moduleObj.exports;
}

function paidSession(overrides = {}) {
  const created = Math.floor((Date.now() - 30_000) / 1000);
  return {
    id: "cs_test_12345678",
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    amount_total: 49700,
    currency: "usd",
    created,
    metadata: {
      product: "ai-search-audit",
      terms_accepted: "true",
      terms_accepted_at: new Date(created * 1000 - 30_000).toISOString(),
      terms_version: "2026-08-25",
      checkout_request_id: "10000000-0000-4000-8000-000000000001",
    },
    payment_intent: "pi_test_12345678",
    customer_details: { email: "buyer@example.com", name: "Buyer" },
    custom_fields: [{ key: "website", text: { value: "https://example.com" } }],
    ...overrides,
  };
}

test("verifies a paid, complete Stripe session for the exact product and legal version", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const session = paidSession();
  const { validateCheckoutSession, verifyCheckoutSession } = loadModule(session);
  const direct = validateCheckoutSession(session, "ai-search-audit");
  assert.equal(direct.checkoutRequestId, "10000000-0000-4000-8000-000000000001");
  assert.equal(direct.termsAcceptedAt, session.metadata.terms_accepted_at);
  const result = await verifyCheckoutSession("cs_test_12345678", "ai-search-audit");
  assert.equal(result.product, "ai-search-audit");
  assert.equal(result.customerEmail, "buyer@example.com");
  assert.equal(result.website, "https://example.com/");
  assert.equal(result.amountTotal, 49700);
  assert.equal(result.paymentIntentId, "pi_test_12345678");
  const safeName = validateCheckoutSession(
    paidSession({ customer_details: { email: "buyer@example.com", name: "Buyer\r\nBcc: x" } }),
    "ai-search-audit",
  );
  assert.equal(safeName.customerName, "Buyer Bcc: x");
});

test("rejects spoofed, unpaid, wrong-product, wrong-price, and stale-terms sessions", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  for (const session of [
    paidSession({ payment_status: "unpaid" }),
    paidSession({ metadata: { ...paidSession().metadata, product: "stack-kit" } }),
    paidSession({ amount_total: 9700 }),
    paidSession({ payment_intent: null }),
    paidSession({ metadata: { ...paidSession().metadata, terms_version: "old" } }),
    paidSession({ metadata: { ...paidSession().metadata, checkout_request_id: "short" } }),
    paidSession({ customer_details: { email: "not-an-email", name: "Buyer" } }),
    paidSession({ custom_fields: [{ key: "website", text: { value: "http://localhost" } }] }),
    paidSession({ custom_fields: [] }),
  ]) {
    const { verifyCheckoutSession } = loadModule(session);
    assert.equal(await verifyCheckoutSession("cs_test_12345678", "ai-search-audit"), null);
  }
  assert.equal(
    await loadModule(paidSession()).verifyCheckoutSession("not-a-session", "ai-search-audit"),
    null,
  );
});
