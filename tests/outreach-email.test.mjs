import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Transpile + eval lib/email.ts (self-contained: only a type-only import, elided).
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

const {
  renderOutreachAuditEmail,
  renderOutreachViewNotifyEmail,
  renderWarmLeadAlertEmail,
  renderOutreachDigestEmail,
} = loadTs("lib/email.ts");

const site = { name: "queryclear", url: "https://www.queryclear.com", email: "hello@queryclear.com" };
const POSTAL = "SparkCreatives Inc., 6120 Caladesi Court, Jacksonville, FL 32258";
const REPORT_URL = "https://www.queryclear.com/r/abc123token";

function report({ measured }) {
  return {
    domain_url: "hellosmooth.com",
    page_title: "Hello Smooth",
    findings: [
      { code: "schema", severity: "high", title: "Missing schema", detail: "", recommendation: "", url: null },
      { code: "title", severity: "medium", title: "Weak title", detail: "", recommendation: "", url: null },
    ],
    queries: [
      { engine: "chatgpt", query: "best med spa in Jacksonville", cited_count: 0, samples: 3, citation_frequency: 0, confidence_low: 0, confidence_high: 0.2, measured },
      { engine: "chatgpt", query: "botox near St Johns", cited_count: 0, samples: 3, citation_frequency: 0, confidence_low: 0, confidence_high: 0.2, measured },
      { engine: "chatgpt", query: "facials Jacksonville", cited_count: 2, samples: 3, citation_frequency: 0.66, confidence_low: 0.3, confidence_high: 0.9, measured },
    ],
    recommendations: [
      { rank: 1, priority: 1, kind: "technical", title: "Add Organization schema", rationale: "r", action: "Add JSON-LD.", provenance: "measured", evidence: "" },
    ],
    sample_draft: null,
    detected_voice: "warm, expert, approachable",
  };
}

const opts = { siteUrl: site.url, postalAddress: POSTAL, reportUrl: REPORT_URL, businessName: "Hello Smooth Med Spa" };

test("cold email links to the pre-unlocked report and personalizes by business", () => {
  const html = renderOutreachAuditEmail(report({ measured: false }), opts, site);
  assert.ok(html.includes(REPORT_URL), "contains the unique report link");
  assert.ok(html.includes("Hello Smooth Med Spa"), "personalized with the business name");
  assert.ok(html.includes("hellosmooth.com"), "names the domain");
});

test("cold email carries CAN-SPAM footer (postal address + opt-out) and no offer buttons", () => {
  const html = renderOutreachAuditEmail(report({ measured: false }), opts, site);
  assert.ok(html.includes(POSTAL), "physical postal address present");
  assert.ok(/unsubscribe/i.test(html), "opt-out present");
  // Offers live on the report page now — NOT in the cold email.
  assert.ok(!/\$497/.test(html), "no price/offer in the email");
  assert.ok(!/Get the full/i.test(html), "no offer buttons in the email");
});

test("honesty: estimated findings use soft phrasing, never a measured claim", () => {
  const html = renderOutreachAuditEmail(report({ measured: false }), opts, site);
  assert.ok(/set up to be the answer assistants like/i.test(html), "soft estimated phrasing");
  assert.ok(!/When I checked/i.test(html), "must NOT claim a live measured check for an estimate");
});

test("a genuinely measured uncited query may be stated as fact", () => {
  const html = renderOutreachAuditEmail(report({ measured: true }), opts, site);
  assert.ok(/When I checked ChatGPT for/i.test(html), "measured query stated factually");
});

test("view-notify email names the domain and links the report", () => {
  const html = renderOutreachViewNotifyEmail({ domainUrl: "hellosmooth.com", reportUrl: REPORT_URL }, site);
  assert.ok(html.includes("hellosmooth.com"), "names the prospect domain");
  assert.ok(html.includes(REPORT_URL), "links the report");
  assert.ok(/opened/i.test(html), "frames it as an open signal");
});

test("warm-lead alert carries the reply snippet, a one-paste mailto reply, and confirms the cadence stopped", () => {
  const html = renderWarmLeadAlertEmail(
    {
      business: "Hello Smooth Med Spa",
      email: "owner@hellosmooth.com",
      domain: "hellosmooth.com",
      city: "Jacksonville",
      vertical: "med-spa",
      signal: "replied",
      snippet: "Sure, let's talk!",
      reportUrl: REPORT_URL,
      touchCount: 2,
    },
    site,
  );
  assert.ok(html.includes("Hello Smooth Med Spa"));
  assert.ok(html.includes("Sure, let&#39;s talk!") || html.includes("Sure, let's talk!"), "carries the reply snippet");
  assert.ok(/mailto:owner@hellosmooth\.com/.test(html), "one-paste reply mailto link");
  assert.ok(/cadence/i.test(html) && /stop/i.test(html), "confirms the autonomous cadence stopped");
});

test("outreach digest surfaces sent/cap/queue/quarantine counts", () => {
  const html = renderOutreachDigestEmail(
    {
      sentToday: 12,
      warmToday: [{ email: "owner@hellosmooth.com", business: "Hello Smooth Med Spa" }],
      dueTomorrow: 5,
      queueDepth: 40,
      quarantineCount: 2,
      quarantineSample: [{ email: "bad@nope.example", business: undefined, reasons: ["deliverability: no MX record for nope.example"] }],
      sentTodayCount: 12,
      cap: 25,
    },
    site,
  );
  assert.ok(html.includes("12"), "sent count present");
  assert.ok(html.includes("12 / 25"), "cap fraction present");
  assert.ok(html.includes("Hello Smooth Med Spa"), "warm contact named");
  assert.ok(/no MX record/.test(html), "quarantine reason surfaced");
});
