import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// lib/prospect-queue.ts has two runtime imports: the Redis client (unused by
// the in-memory impl this suite exercises) and normalizeEmail from
// outreach-store.ts (a one-liner, stubbed inline rather than dragging in the
// whole store module).
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

const { InMemoryProspectQueue } = loadTs("lib/prospect-queue.ts", {
  "@upstash/redis": { Redis: class {} },
  "./outreach-store": { normalizeEmail: (e) => e.trim().toLowerCase() },
});

const FIXED = Date.parse("2026-07-20T12:00:00.000Z");
const newQueue = () => new InMemoryProspectQueue(() => FIXED);

test("enqueue adds a new prospect and normalizes the email", async () => {
  const q = newQueue();
  const added = await q.enqueue({ email: "Owner@BizFL.com", domainUrl: "bizfl.com" });
  assert.equal(added, true);
  assert.equal(await q.depth(), 1);
});

test("enqueue is a no-op for an email already seen (regardless of case)", async () => {
  const q = newQueue();
  await q.enqueue({ email: "owner@bizfl.com", domainUrl: "bizfl.com" });
  const again = await q.enqueue({ email: "Owner@BizFL.com", domainUrl: "bizfl.com" });
  assert.equal(again, false);
  assert.equal(await q.depth(), 1, "must not double-queue the same prospect");
});

test("popBatch returns prospects FIFO and drains the queue", async () => {
  const q = newQueue();
  await q.enqueue({ email: "a@x.com", domainUrl: "x.com" });
  await q.enqueue({ email: "b@x.com", domainUrl: "x.com" });
  await q.enqueue({ email: "c@x.com", domainUrl: "x.com" });

  const first = await q.popBatch(2);
  assert.deepEqual(first.map((p) => p.email), ["a@x.com", "b@x.com"]);
  assert.equal(await q.depth(), 1);

  const rest = await q.popBatch(10);
  assert.deepEqual(rest.map((p) => p.email), ["c@x.com"]);
  assert.equal(await q.depth(), 0);
});

test("popBatch never returns more than what's queued", async () => {
  const q = newQueue();
  await q.enqueue({ email: "a@x.com", domainUrl: "x.com" });
  const popped = await q.popBatch(5);
  assert.equal(popped.length, 1);
});

test("quarantine stores failed sends for review without sending anything", async () => {
  const q = newQueue();
  await q.quarantine({
    prospect: { email: "bad@dead.example" },
    reasons: ["deliverability: no MX record for dead.example"],
    subject: "hi",
  });
  assert.equal(await q.quarantineCount(), 1);
  const items = await q.listQuarantine();
  assert.equal(items[0].prospect.email, "bad@dead.example");
  assert.deepEqual(items[0].reasons, ["deliverability: no MX record for dead.example"]);
  assert.equal(items[0].at, new Date(FIXED).toISOString());
});

test("listQuarantine returns most-recent-first and respects the limit", async () => {
  const q = newQueue();
  await q.quarantine({ prospect: { email: "one@x.com" }, reasons: ["r1"] });
  await q.quarantine({ prospect: { email: "two@x.com" }, reasons: ["r2"] });
  const items = await q.listQuarantine(1);
  assert.equal(items.length, 1);
  assert.equal(items[0].prospect.email, "two@x.com", "most recent first");
});
