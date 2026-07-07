import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Transpile + eval lib/email.ts (self-contained: only a type-only import).
// Same pattern as tests/public-audit-email.test.mjs.
function loadTs(relPath) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const { renderCarePlanOrderEmail } = loadTs("lib/email.ts");

const site = { name: "queryclear", url: "https://www.queryclear.com", email: "hello@queryclear.com" };

const order = {
  planName: "AI Search Care Plan",
  amount: "997.00",
  currency: "USD",
  name: "Pat Owner",
  email: "owner@example.com",
  sessionId: "cs_test_care",
  subscriptionId: "sub_test_123",
  website: "https://owner.example",
};

test("care plan team email surfaces the subscriber, site, monthly amount, and subscription id", () => {
  const html = renderCarePlanOrderEmail(order, site);

  assert.ok(html.includes("Pat Owner"), "names the subscriber");
  assert.ok(html.includes("owner.example"), "includes the website to maintain");
  assert.ok(html.includes("997.00"), "includes the monthly amount");
  assert.ok(html.includes("sub_test_123"), "includes the Stripe subscription id");
  assert.ok(html.includes("AI Search Care Plan"), "names the plan");
});

test("care plan email is honest: recurring, cancel-anytime, no guarantees", () => {
  const html = renderCarePlanOrderEmail(order, site);

  assert.ok(/recurring/i.test(html), "states it is recurring");
  assert.ok(/cancel anytime/i.test(html), "states cancel anytime");
  // Never promise outcomes.
  assert.ok(
    !/guarantee[ds]? (rankings|citations|results)/i.test(html) ||
      /never guarantee|do not guarantee|don'?t guarantee/i.test(html),
    "must not promise rankings/citations",
  );
  assert.ok(/never guarantee/i.test(html), "explicitly disclaims guarantees");
});
