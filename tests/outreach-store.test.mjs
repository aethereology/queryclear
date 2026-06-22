import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Transpile + eval a lib .ts file. lib/outreach-store.ts has one runtime import
// (the Redis impl) which we stub — the tests only exercise the in-memory store.
function loadTs(relPath, stubs = {}) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    if (spec in stubs) return stubs[spec];
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const { InMemoryOutreachStore, normalizeEmail, isDue } = loadTs("lib/outreach-store.ts", {
  "./outreach-store-redis": { RedisOutreachStore: class {} },
});

const FIXED = Date.parse("2026-06-22T12:00:00.000Z");
const newStore = () => new InMemoryOutreachStore(() => FIXED);

test("normalizeEmail trims + lowercases", () => {
  assert.equal(normalizeEmail("  Info@MacFlorida.com "), "info@macflorida.com");
});

test("dedup: a contacted email is found regardless of case", async () => {
  const s = newStore();
  await s.upsertContact({ email: "Hello@BizFL.com", domain: "bizfl.com", status: "cold" });
  assert.ok(await s.getContact("hello@bizfl.com"), "found by normalized key");
  assert.equal(await s.getContact("someone-else@x.com"), null, "unknown is null");
});

test("upsert merges fields without resetting status/touches/createdAt", async () => {
  const s = newStore();
  const first = await s.upsertContact({ email: "a@b.com", domain: "b.com", status: "cold" });
  await s.recordTouch("a@b.com", { n: 1, type: "cold-audit", at: new Date(FIXED).toISOString() });
  await s.setStatus("a@b.com", "opened");
  const merged = await s.upsertContact({ email: "a@b.com", business: "Acme" }); // re-ingest from another CSV
  assert.equal(merged.business, "Acme", "new field applied");
  assert.equal(merged.status, "opened", "status NOT reset");
  assert.equal(merged.touches.length, 1, "touches preserved");
  assert.equal(merged.createdAt, first.createdAt, "createdAt preserved");
});

test("recordTouch appends + sets lastTouchAt and nextDueAt", async () => {
  const s = newStore();
  await s.upsertContact({ email: "a@b.com", status: "cold" });
  const c = await s.recordTouch("a@b.com", { n: 1, type: "cold-audit", at: "2026-06-22T12:00:00.000Z" }, "2026-06-26T12:00:00.000Z");
  assert.equal(c.touches.length, 1);
  assert.equal(c.lastTouchAt, "2026-06-22T12:00:00.000Z");
  assert.equal(c.nextDueAt, "2026-06-26T12:00:00.000Z");
});

test("dueForTouch returns active contacts past their nextDueAt, skips terminal/future", async () => {
  const s = newStore();
  // due: cold + nextDueAt in the past
  await s.upsertContact({ email: "due@x.com", status: "cold" });
  await s.recordTouch("due@x.com", { n: 1, type: "cold-audit", at: "2026-06-10T00:00:00.000Z" }, "2026-06-14T00:00:00.000Z");
  // not due: future nextDueAt
  await s.upsertContact({ email: "future@x.com", status: "cold" });
  await s.recordTouch("future@x.com", { n: 1, type: "cold-audit", at: "2026-06-20T00:00:00.000Z" }, "2026-07-20T00:00:00.000Z");
  // not due: terminal status even though past
  await s.upsertContact({ email: "replied@x.com", status: "replied" });
  await s.recordTouch("replied@x.com", { n: 1, type: "cold-audit", at: "2026-06-10T00:00:00.000Z" }, "2026-06-14T00:00:00.000Z");

  const due = await s.dueForTouch("2026-06-22T12:00:00.000Z");
  const emails = due.map((c) => c.email);
  assert.deepEqual(emails, ["due@x.com"]);
});

test("isDue: opened graduates into the due queue; unsubscribed never does", () => {
  const base = { email: "x@y.com", touches: [], createdAt: "", nextDueAt: "2026-06-01T00:00:00.000Z" };
  assert.equal(isDue({ ...base, status: "opened" }, "2026-06-22T00:00:00.000Z"), true);
  assert.equal(isDue({ ...base, status: "unsubscribed" }, "2026-06-22T00:00:00.000Z"), false);
  assert.equal(isDue({ ...base, status: "cold", nextDueAt: undefined }, "2026-06-22T00:00:00.000Z"), false);
});

test("linkToken / emailForToken round-trips and expires", async () => {
  const s = newStore();
  await s.linkToken("tok-123", "Lead@Biz.com", 60_000);
  assert.equal(await s.emailForToken("tok-123"), "lead@biz.com");
  // expired token (set with a tiny ttl relative to the fixed clock)
  const s2 = new InMemoryOutreachStore(() => FIXED);
  await s2.linkToken("old", "a@b.com", 0);
  assert.equal(await s2.emailForToken("old"), null);
});
