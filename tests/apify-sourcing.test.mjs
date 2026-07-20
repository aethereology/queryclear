import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadTs(relPath, mocks = {}) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    if (spec in mocks) return mocks[spec];
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

// --- lib/apify-spend.ts (daily Apify cost cap) --------------------------------

const { InMemoryApifySpendGuard } = loadTs("lib/apify-spend.ts", {
  "@upstash/redis": { Redis: class {} },
});

test("apify spend guard enforces the daily cap and resets on UTC day rollover", async () => {
  let now = Date.UTC(2026, 6, 20, 12);
  const guard = new InMemoryApifySpendGuard(() => now);
  assert.equal((await guard.reserveSpend(1, 2)).allowed, true);
  assert.equal((await guard.reserveSpend(1, 2)).allowed, true);
  assert.equal((await guard.reserveSpend(1, 2)).allowed, false, "third $1 run exceeds the $2 cap");
  now = Date.UTC(2026, 6, 21, 0, 1);
  assert.equal((await guard.reserveSpend(1, 2)).allowed, true, "resets the next UTC day");
});

// --- lib/apify-runs.ts (rotation index + pending Apify run tracking) ----------

const { InMemoryApifyRunTracker } = loadTs("lib/apify-runs.ts", {
  "@upstash/redis": { Redis: class {} },
});

test("rotation index increments once per call, starting at 0", async () => {
  const tracker = new InMemoryApifyRunTracker();
  assert.equal(await tracker.nextRotationIndex(), 0);
  assert.equal(await tracker.nextRotationIndex(), 1);
  assert.equal(await tracker.nextRotationIndex(), 2);
});

test("pending runs round-trip: record, list, remove", async () => {
  const tracker = new InMemoryApifyRunTracker();
  await tracker.recordPendingRun({ runId: "run-1", vertical: "med-spa", city: "Orlando, FL", startedAt: "2026-07-20T10:00:00.000Z" });
  await tracker.recordPendingRun({ runId: "run-2", vertical: "dental", city: "Jacksonville, FL", startedAt: "2026-07-20T10:00:00.000Z" });

  const pending = await tracker.listPendingRuns();
  assert.equal(pending.length, 2);
  assert.ok(pending.some((r) => r.runId === "run-1"));

  await tracker.removePendingRun("run-1");
  const after = await tracker.listPendingRuns();
  assert.equal(after.length, 1);
  assert.equal(after[0].runId, "run-2");
});

// --- lib/prospect-targets.ts (rotation config) --------------------------------

const { SOURCING_TARGETS, targetAt } = loadTs("lib/prospect-targets.ts");

test("rotation covers all four locked verticals", () => {
  const verticals = new Set(SOURCING_TARGETS.map((t) => t.vertical));
  assert.deepEqual([...verticals].sort(), ["chiropractic", "dental", "law", "med-spa"]);
});

test("med-spa targets exclude already-covered metros (Jacksonville, Fort Lauderdale, Atlanta)", () => {
  const medSpaCities = SOURCING_TARGETS.filter((t) => t.vertical === "med-spa").map((t) => t.city);
  for (const covered of ["Jacksonville", "Fort Lauderdale", "Atlanta"]) {
    assert.ok(!medSpaCities.some((c) => c.includes(covered)), `${covered} should not be re-targeted`);
  }
});

test("targetAt wraps around the list (round-robin never throws past the end)", () => {
  const n = SOURCING_TARGETS.length;
  assert.deepEqual(targetAt(0), SOURCING_TARGETS[0]);
  assert.deepEqual(targetAt(n), SOURCING_TARGETS[0], "wraps back to the start");
  assert.deepEqual(targetAt(n + 1), SOURCING_TARGETS[1]);
});
