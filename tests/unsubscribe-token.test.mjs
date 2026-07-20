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

// lib/unsubscribe-token.ts only imports node:crypto — real passthrough is safe.
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

const { makeUnsubscribeToken, verifyUnsubscribeToken } = loadTs("lib/unsubscribe-token.ts");

test("round-trips: a token made for an email verifies back to that (normalized) email", () => {
  const saved = process.env.OUTREACH_SECRET;
  process.env.OUTREACH_SECRET = "test-outreach-secret";
  try {
    const token = makeUnsubscribeToken("Owner@BizFL.com");
    assert.equal(verifyUnsubscribeToken(token), "owner@bizfl.com");
  } finally {
    process.env.OUTREACH_SECRET = saved;
  }
});

test("a tampered token (different email, same signature shape) fails verification", () => {
  const saved = process.env.OUTREACH_SECRET;
  process.env.OUTREACH_SECRET = "test-outreach-secret";
  try {
    const token = makeUnsubscribeToken("owner@bizfl.com");
    const [, sig] = token.split(".");
    const tampered = `${Buffer.from("attacker@evil.com", "utf8").toString("base64url")}.${sig}`;
    assert.equal(verifyUnsubscribeToken(tampered), null);
  } finally {
    process.env.OUTREACH_SECRET = saved;
  }
});

test("a token signed under a different secret fails verification", () => {
  const saved = process.env.OUTREACH_SECRET;
  try {
    process.env.OUTREACH_SECRET = "secret-a";
    const token = makeUnsubscribeToken("owner@bizfl.com");
    process.env.OUTREACH_SECRET = "secret-b";
    assert.equal(verifyUnsubscribeToken(token), null);
  } finally {
    process.env.OUTREACH_SECRET = saved;
  }
});

test("malformed tokens are rejected without throwing", () => {
  assert.equal(verifyUnsubscribeToken(""), null);
  assert.equal(verifyUnsubscribeToken("no-dot-here"), null);
  assert.equal(verifyUnsubscribeToken("not-base64!.sig"), null);
});
