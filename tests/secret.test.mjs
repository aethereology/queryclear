import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const nodeRequire = createRequire(import.meta.url);

// lib/secret.ts only imports node:crypto (pure, deterministic) — real passthrough is safe.
function loadTs(relPath) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    if (spec.startsWith("node:")) return nodeRequire(spec);
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const { secretOk, cronAuthOk } = loadTs("lib/secret.ts");

test("secretOk: matching secrets pass, wrong ones fail", () => {
  assert.equal(secretOk("hunter2", "hunter2"), true);
  assert.equal(secretOk("hunter2", "hunter3"), false);
});

test("secretOk: mismatched lengths never throw and still fail", () => {
  assert.equal(secretOk("short", "a-much-longer-secret-value"), false);
});

function fakeRequest(authHeader) {
  return { headers: { get: (name) => (name.toLowerCase() === "authorization" ? authHeader : null) } };
}

test("cronAuthOk: valid Bearer token matching CRON_SECRET passes", () => {
  const saved = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "cron-secret-value";
  try {
    assert.equal(cronAuthOk(fakeRequest("Bearer cron-secret-value")), true);
  } finally {
    process.env.CRON_SECRET = saved;
  }
});

test("cronAuthOk: wrong token, missing header, or unset env all fail closed", () => {
  const saved = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "cron-secret-value";
    assert.equal(cronAuthOk(fakeRequest("Bearer wrong")), false);
    assert.equal(cronAuthOk(fakeRequest(null)), false);
    assert.equal(cronAuthOk(fakeRequest("Basic cron-secret-value")), false);
    delete process.env.CRON_SECRET;
    assert.equal(cronAuthOk(fakeRequest("Bearer cron-secret-value")), false);
  } finally {
    process.env.CRON_SECRET = saved;
  }
});
