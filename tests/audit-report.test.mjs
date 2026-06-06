import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Transpile a pure-ish .ts module and eval it. `requireMap` resolves any runtime
// (value) imports by specifier; type-only imports are erased by transpile.
function loadTs(relPath, requireMap = {}) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    if (spec in requireMap) return requireMap[spec];
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const scorecard = loadTs("lib/scorecard.ts");
const ar = loadTs("lib/audit-report.ts", { "@/lib/scorecard": scorecard });
const { goldleafDemo } = loadTs("lib/reports/goldleaf-demo.ts");
const registry = loadTs("lib/reports/index.ts");

const LAYER_IDS = [
  "entity-clarity",
  "service-specificity",
  "proof-density",
  "local-relevance",
  "answer-coverage",
  "machine-readability",
  "conversion-path",
];

test("scoreFromLayers: Goldleaf demo sums to 33 (matches original SCORE_NOW)", () => {
  assert.equal(ar.scoreFromLayers(goldleafDemo.scorecard), 33);
});

test("scoreFromLayers: all layers at 10 → 100", () => {
  const full = LAYER_IDS.map((layer) => ({ layer, score: 10, finding: "" }));
  assert.equal(ar.scoreFromLayers(full), 100);
});

test("scoreFromLayers: all layers at 0 → 0", () => {
  const none = LAYER_IDS.map((layer) => ({ layer, score: 0, finding: "" }));
  assert.equal(ar.scoreFromLayers(none), 0);
});

test("scoreFromLayers: empty scorecard → 0 (no divide-by-zero)", () => {
  assert.equal(ar.scoreFromLayers([]), 0);
});

test("sevRank orders Critical < High < Medium", () => {
  assert.ok(ar.sevRank("Critical") < ar.sevRank("High"));
  assert.ok(ar.sevRank("High") < ar.sevRank("Medium"));
});

test("sortedFixes: biggest impact first, stable within ties", () => {
  const input = [
    { sev: "Medium", title: "m1" },
    { sev: "Critical", title: "c1" },
    { sev: "High", title: "h1" },
    { sev: "Critical", title: "c2" },
    { sev: "Medium", title: "m2" },
  ];
  const order = ar.sortedFixes(input).map((f) => f.title);
  assert.deepEqual(order, ["c1", "c2", "h1", "m1", "m2"]);
});

test("sortedFixes does not mutate its input", () => {
  const input = [{ sev: "Medium", title: "m" }, { sev: "Critical", title: "c" }];
  const before = input.map((f) => f.title);
  ar.sortedFixes(input);
  assert.deepEqual(input.map((f) => f.title), before);
});

test("layerMeta returns stack metadata for a known id, throws on unknown", () => {
  const meta = ar.layerMeta("machine-readability");
  assert.equal(meta.name, "Machine Readability");
  assert.equal(meta.n, "06");
  assert.throws(() => ar.layerMeta("nope"));
});

test("Goldleaf demo scores all seven layers exactly once", () => {
  const ids = goldleafDemo.scorecard.map((s) => s.layer).sort();
  assert.deepEqual(ids, [...LAYER_IDS].sort());
});

test("every registered report scores all seven layers exactly once", () => {
  for (const [slug, report] of Object.entries(registry.reports)) {
    const ids = report.scorecard.map((s) => s.layer).sort();
    assert.deepEqual(ids, [...LAYER_IDS].sort(), `report ${slug} must cover all 7 layers`);
  }
});

test("the seeded example report is flagged fictional (demo:true)", () => {
  // Real clients are demo:false; the bundled example must stay clearly fictional.
  const example = registry.getReport("example-rivermark-dental");
  assert.ok(example, "expected the fictional example report to exist");
  assert.equal(example.demo, true);
});

test("getReport / reportSlugs resolve the registry", () => {
  const slugs = registry.reportSlugs();
  assert.ok(slugs.length >= 1);
  assert.equal(registry.getReport(slugs[0]).slug, slugs[0]);
  assert.equal(registry.getReport("does-not-exist"), undefined);
});
