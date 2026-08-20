import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "lib/social/state.ts");
const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleObj = { exports: {} };
new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, () => {
  throw new Error("State module must stay dependency-free at runtime.");
});
const { canTransitionCampaign, canTransitionAction } = moduleObj.exports;

test("campaign state machine allows the planned path and rejects unsafe skips", () => {
  assert.equal(canTransitionCampaign("researching", "drafted"), true);
  assert.equal(canTransitionCampaign("drafted", "passed"), true);
  assert.equal(canTransitionCampaign("passed", "scheduled"), true);
  assert.equal(canTransitionCampaign("scheduled", "publishing"), true);
  assert.equal(canTransitionCampaign("publishing", "published"), true);
  assert.equal(canTransitionCampaign("drafted", "published"), false);
  assert.equal(canTransitionCampaign("published", "scheduled"), false);
});

test("action state machine supports leases, retries, quarantine review, and terminal completion", () => {
  assert.equal(canTransitionAction("queued", "leased"), true);
  assert.equal(canTransitionAction("leased", "retryable"), true);
  assert.equal(canTransitionAction("retryable", "leased"), true);
  assert.equal(canTransitionAction("quarantined", "queued"), true);
  assert.equal(canTransitionAction("completed", "queued"), false);
});
