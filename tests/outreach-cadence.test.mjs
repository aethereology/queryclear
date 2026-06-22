import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// lib/outreach-cadence.ts only has a type-only import (elided) → self-contained.
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

const { nextStep, computeNextDueAt, MAX_TOUCHES } = loadTs("lib/outreach-cadence.ts");

// Build a contact with `count` touches and a given status.
function contact(status, count) {
  return {
    email: "x@y.com",
    status,
    createdAt: "2026-06-01T00:00:00.000Z",
    lastTouchAt: "2026-06-10T00:00:00.000Z",
    touches: Array.from({ length: count }, (_, i) => ({ n: i + 1, type: "t", at: "2026-06-10T00:00:00.000Z" })),
  };
}

test("touch 1 is owned by send-cold (count 0 → no cadence step)", () => {
  assert.equal(nextStep(contact("cold", 0)), null);
});

test("cold arm: progresses bump → tip → last-note, then STOPS", () => {
  assert.equal(nextStep(contact("cold", 1)).type, "bump");
  assert.equal(nextStep(contact("cold", 1)).n, 2);
  assert.equal(nextStep(contact("cold", 2)).type, "tip");
  assert.equal(nextStep(contact("cold", 3)).type, "last-note");
  assert.equal(nextStep(contact("cold", 4)), null, "cold arm stops after the 3 follow-ups");
});

test("graduation: an opened contact enters the nurture arm", () => {
  const step = nextStep(contact("opened", 1));
  assert.equal(step.arm, "nurture");
  assert.equal(step.type, "nurture-tip");
  assert.equal(step.n, 2);
});

test("nurture is capped at MAX_TOUCHES", () => {
  assert.equal(MAX_TOUCHES, 10);
  assert.equal(nextStep(contact("opened", 10)), null, "no touch beyond the cap");
  assert.ok(nextStep(contact("opened", 9)), "touch 10 is allowed");
});

test("terminal statuses get no further touches", () => {
  for (const s of ["unsubscribed", "bounced", "customer"]) {
    assert.equal(nextStep(contact(s, 1)), null, `${s} → no step`);
  }
});

test("computeNextDueAt adds afterDays to the last touch", () => {
  const due = computeNextDueAt("2026-06-10T00:00:00.000Z", { type: "bump", afterDays: 4, arm: "cold" });
  assert.equal(due, "2026-06-14T00:00:00.000Z");
});
