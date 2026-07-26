// Guards automatic sourcing keeping pace with sending. The queue ran dry at a
// 45/day send cap because topup started exactly ONE scrape below a hardcoded
// watermark of 30 — a threshold sized for the old 10/day cap.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadTs(relPath, stubs = {}) {
  const modPath = path.join(projectRoot, relPath);
  const output = ts.transpileModule(fs.readFileSync(modPath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, (s) => {
    if (s in stubs) return stubs[s];
    throw new Error(`Unexpected import in ${relPath}: ${s}`);
  });
  return moduleObj.exports;
}

const {
  SOURCING_TARGETS,
  ROTATION_LENGTH,
  MAX_RUNS_PER_TOPUP,
  targetAt,
  planTopupRuns,
} = loadTs("lib/prospect-targets.ts");

// ── rotation ────────────────────────────────────────────────────────────────

test("rotation is long enough to outlast a sustained topup rate", () => {
  // At the max burn (MAX_RUNS_PER_TOPUP/day) the rotation must last well beyond
  // a couple of weeks; otherwise it wraps and pays to re-scrape cities whose
  // businesses are already in pq:seen, enqueuing ~nobody.
  const daysOfRunway = ROTATION_LENGTH / MAX_RUNS_PER_TOPUP;
  assert.ok(daysOfRunway >= 21, `only ${daysOfRunway.toFixed(0)} days of distinct targets`);
});

test("no (vertical, city) pair is scraped twice in one rotation", () => {
  const keys = SOURCING_TARGETS.map((t) => `${t.vertical}|${t.city}`);
  assert.equal(new Set(keys).size, keys.length, "duplicate target in the rotation");
});

test("already-swept pairs are excluded so we never pay to re-scrape them", () => {
  const keys = new Set(SOURCING_TARGETS.map((t) => `${t.vertical}|${t.city}`));
  for (const covered of [
    "med-spa|Jacksonville, FL",
    "med-spa|Fort Lauderdale, FL",
    "med-spa|Atlanta, GA",
    "med-spa|St. Augustine, FL",
    "dental|Jacksonville, FL",
  ]) {
    assert.ok(!keys.has(covered), `${covered} should be excluded`);
  }
});

test("every target carries usable search terms", () => {
  for (const t of SOURCING_TARGETS) {
    assert.ok(t.searchTerms?.length > 0, `${t.vertical}@${t.city} has no search terms`);
    assert.ok(t.city.includes(","), `${t.city} should be "City, ST"`);
  }
});

test("targetAt wraps instead of running off the end", () => {
  assert.deepEqual(targetAt(ROTATION_LENGTH), targetAt(0));
  assert.deepEqual(targetAt(ROTATION_LENGTH * 3 + 5), targetAt(5));
});

// ── deficit sizing ──────────────────────────────────────────────────────────

test("a full queue starts nothing", () => {
  const p = planTopupRuns({ depth: 200, watermark: 90, targetDepth: 135, estYieldPerRun: 20 });
  assert.equal(p.shouldRun, false);
  assert.equal(p.runsWanted, 0);
});

test("a big shortfall starts several scrapes, not one", () => {
  // The exact regression: 45/day cap, queue nearly empty.
  const p = planTopupRuns({ depth: 5, watermark: 90, targetDepth: 135, estYieldPerRun: 20 });
  assert.equal(p.shouldRun, true);
  assert.equal(p.deficit, 130);
  assert.ok(p.runsWanted > 1, "one run cannot refill 130 prospects");
  assert.equal(p.runsWanted, Math.min(MAX_RUNS_PER_TOPUP, Math.ceil(130 / 20)));
});

test("a small shortfall starts exactly one scrape", () => {
  const p = planTopupRuns({ depth: 85, watermark: 90, targetDepth: 95, estYieldPerRun: 20 });
  assert.equal(p.runsWanted, 1, "don't burn four cities to top up ten prospects");
});

test("run count is bounded however deep the hole", () => {
  const p = planTopupRuns({ depth: 0, watermark: 90, targetDepth: 100_000, estYieldPerRun: 1 });
  assert.equal(p.runsWanted, MAX_RUNS_PER_TOPUP, "must not become a runaway spend");
});

test("a nonsense yield estimate cannot cause a divide-by-zero blowup", () => {
  const p = planTopupRuns({ depth: 0, watermark: 90, targetDepth: 135, estYieldPerRun: 0 });
  assert.ok(Number.isFinite(p.runsWanted));
  assert.ok(p.runsWanted >= 1 && p.runsWanted <= MAX_RUNS_PER_TOPUP);
});

test("thresholds scale with the send cap rather than a fixed number", () => {
  // Same queue depth, two different caps: the low cap is comfortable, the high
  // cap is starving. A hardcoded watermark cannot express that difference —
  // which is precisely why the queue drained after the cap moved 10 -> 45.
  const depth = 60;
  const atCap10 = planTopupRuns({ depth, watermark: 10 * 2, targetDepth: 10 * 3, estYieldPerRun: 20 });
  const atCap45 = planTopupRuns({ depth, watermark: 45 * 2, targetDepth: 45 * 3, estYieldPerRun: 20 });

  assert.equal(atCap10.shouldRun, false, "60 queued is plenty at 10/day");
  assert.equal(atCap45.shouldRun, true, "60 queued is under two days at 45/day");
  assert.ok(atCap45.runsWanted >= 3, "and it needs a real refill, not one city");
});
