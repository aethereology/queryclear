import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Transpile + eval lib/email.ts (it's self-contained: only a type-only import,
// which is elided). Same pattern as tests/snapshot-overlay.test.mjs.
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

const { renderPublicAuditLeadEmail, renderPublicAuditReportEmail } = loadTs("lib/email.ts");

const stubReport = {
  domain_url: "example.com",
  page_title: "Example",
  findings: [{ code: "schema", severity: "high", title: "Missing schema", detail: "", recommendation: "", url: null }],
  queries: [
    { engine: "chatgpt", query: "best widget", cited_count: 0, samples: 3, citation_frequency: 0, confidence_low: 0, confidence_high: 0.3, measured: false },
    { engine: "chatgpt", query: "widget near me", cited_count: 2, samples: 3, citation_frequency: 0.66, confidence_low: 0.3, confidence_high: 0.9, measured: false },
  ],
  recommendations: [
    { rank: 1, priority: 1, kind: "technical", title: "Add Organization schema", rationale: "r", action: "Add JSON-LD Organization markup.", provenance: "measured", evidence: "" },
  ],
  sample_draft: null,
  detected_voice: null,
};

const site = { name: "queryclear", url: "https://www.queryclear.com", email: "hello@queryclear.com" };

test("prospect report email includes the domain, the fix list, and all three offer CTAs", () => {
  const html = renderPublicAuditReportEmail(stubReport, { siteUrl: site.url }, site);

  assert.ok(html.includes("example.com"), "should name the audited domain");
  assert.ok(html.includes("Add Organization schema"), "should include the prioritized recommendation");

  // The three clickable offers.
  assert.ok(html.includes("https://www.queryclear.com/ai-visibility-audit"), "$497 audit link");
  assert.ok(html.includes("https://www.queryclear.com/contact"), "upgrade/build inquiry link");

  // Honesty: the paid tier is framed as ADDING depth (scoring/roadmap), not as
  // paying for the free read.
  assert.ok(html.includes("$497"), "should reference the paid tier price");
  assert.ok(/prioritized roadmap/i.test(html), "should frame the $497 audit as added depth");
});

test("invisible-query count reflects only uncited queries", () => {
  // stub has 1 uncited (cited_count 0) of 2 — the headline must say one query.
  const html = renderPublicAuditReportEmail(stubReport, { siteUrl: site.url }, site);
  // (apostrophe in "didn't" is HTML-escaped in output, so match up to it)
  assert.ok(/1 query where AI answer engines/.test(html), "singular, count = 1");
});

test("team lead email includes free-audit attribution when present", () => {
  const html = renderPublicAuditLeadEmail(
    {
      email: "owner@example.com",
      domainUrl: "https://example.com",
      source: "report-unlock",
      attribution: {
        utmSource: "linkedin",
        utmCampaign: "5day_launch",
        landingPath: "/free-audit?utm_source=linkedin&utm_campaign=5day_launch",
      },
    },
    site,
  );

  assert.ok(html.includes("source=linkedin"), "attribution summary includes source");
  assert.ok(html.includes("campaign=5day_launch"), "attribution summary includes campaign");
  assert.ok(html.includes("utm_source"), "machine panel includes UTM details");
  assert.ok(html.includes("landing"), "machine panel includes landing path");
});
