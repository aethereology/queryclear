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

// Transpile + eval a lib .ts file, resolving runtime imports from a stub map.
// Unmocked `node:*` specifiers fall through to the real builtin (safe — those
// are pure); everything else must be explicitly stubbed so a test can never
// accidentally hit the network (e.g. real DNS in lib/outreach-qa.ts).
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
    if (spec.startsWith("node:")) return nodeRequire(spec);
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const POSTAL_FALLBACK = "SparkCreatives Inc., [ADD POSTAL ADDRESS — set OUTREACH_POSTAL_ADDRESS]";
const REAL_ADDRESS = "SparkCreatives Inc., 6120 Caladesi Court, Jacksonville, FL 32258";

// Deterministic DNS stub — no real network calls in this suite.
function stubDns(mxByDomain) {
  return {
    promises: {
      resolveMx: async (domain) => {
        const records = mxByDomain[domain];
        if (!records) throw new Error("ENOTFOUND");
        return records;
      },
    },
  };
}

function loadQa(mxByDomain = {}) {
  return loadTs("lib/outreach-qa.ts", {
    "./outreach": { POSTAL_FALLBACK },
    "node:dns": stubDns(mxByDomain),
  });
}

function html({ address = REAL_ADDRESS, unsub = true, banned = "" } = {}) {
  return `<p>Hi there ${banned}</p><p>${unsub ? 'Reply "unsubscribe" and I will stop.' : ""}</p><p>${address}</p>`;
}

test("qaRenderedCopy passes clean, compliant copy", () => {
  const { qaRenderedCopy } = loadQa();
  const r = qaRenderedCopy({ subject: "a quick note", html: html() });
  assert.equal(r.pass, true);
  assert.deepEqual(r.reasons, []);
});

test("qaRenderedCopy fails when the postal address is still the unset placeholder", () => {
  const { qaRenderedCopy } = loadQa();
  const r = qaRenderedCopy({ subject: "hello", html: html({ address: POSTAL_FALLBACK }) });
  assert.equal(r.pass, false);
  assert.ok(r.reasons.some((x) => x.includes("postal address")));
});

test("qaRenderedCopy fails without an unsubscribe line", () => {
  const { qaRenderedCopy } = loadQa();
  const r = qaRenderedCopy({ subject: "hello", html: html({ unsub: false }) });
  assert.equal(r.pass, false);
  assert.ok(r.reasons.some((x) => x.includes("unsubscribe")));
});

test("qaRenderedCopy fails on guaranteed-ranking / hype language", () => {
  const { qaRenderedCopy } = loadQa();
  const r = qaRenderedCopy({ subject: "we guarantee #1 rankings", html: html() });
  assert.equal(r.pass, false);
  assert.ok(r.reasons.some((x) => x.startsWith("honesty:")));
});

test("qaRenderedCopy fails on leaked template placeholders", () => {
  const { qaRenderedCopy } = loadQa();
  const r = qaRenderedCopy({ subject: "hi {{name}}", html: html() });
  assert.equal(r.pass, false);
  assert.ok(r.reasons.some((x) => x.startsWith("placeholder:")));
});

test("mxOk is true for a domain with MX records, false for one without", async () => {
  const { mxOk } = loadQa({ "good.example": [{ exchange: "mx.good.example", priority: 10 }] });
  assert.equal(await mxOk("someone@good.example"), true);
  assert.equal(await mxOk("someone@dead.example"), false);
});

test("mxOk is false for a malformed email (no domain)", async () => {
  const { mxOk } = loadQa();
  assert.equal(await mxOk("not-an-email"), false);
});

test("qaSend fails closed on a dead domain even with otherwise-clean copy", async () => {
  const { qaSend } = loadQa();
  const r = await qaSend({ subject: "hello", html: html(), toEmail: "someone@dead.example" });
  assert.equal(r.pass, false);
  assert.ok(r.reasons.some((x) => x.includes("MX record")));
});

test("qaSend fails when the caller reports the report link is missing/expired", async () => {
  const { qaSend } = loadQa({ "good.example": [{ exchange: "mx.good.example", priority: 10 }] });
  const r = await qaSend({ subject: "hello", html: html(), toEmail: "someone@good.example", reportLinkOk: false });
  assert.equal(r.pass, false);
  assert.ok(r.reasons.some((x) => x.includes("report link")));
});

test("qaSend passes when copy is clean, MX resolves, and the report link is healthy", async () => {
  const { qaSend } = loadQa({ "good.example": [{ exchange: "mx.good.example", priority: 10 }] });
  const r = await qaSend({ subject: "hello", html: html(), toEmail: "someone@good.example", reportLinkOk: true });
  assert.equal(r.pass, true);
  assert.deepEqual(r.reasons, []);
});
