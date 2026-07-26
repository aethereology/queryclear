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

const { InMemoryProspectQueue, MAX_SEND_ATTEMPTS } = loadTs("lib/prospect-queue.ts", {
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

// ── bounded retry (added 2026-07-26) ────────────────────────────────────────
// 17 real prospects were silently deleted by audit failures before this existed:
// popBatch removes them and enqueue() refuses anything in pq:seen, so a single
// transient audit blip lost the lead for good.

test("requeue puts a failed prospect back for another try", async () => {
  const q = newQueue();
  await q.enqueue({ email: "a@biz.com", domainUrl: "biz.com" });
  const [p] = await q.popBatch(1);
  assert.equal(await q.depth(), 0, "popped off the queue");

  assert.equal(await q.requeue(p), true, "first retry granted");
  assert.equal(await q.depth(), 1, "back in the queue");

  const [again] = await q.popBatch(1);
  assert.equal(again.attempts, 1, "attempt counted");
  assert.equal(again.email, "a@biz.com");
});

test("requeue gives up after MAX_SEND_ATTEMPTS instead of looping forever", async () => {
  const q = newQueue();
  await q.enqueue({ email: "b@biz.com", domainUrl: "biz.com" });
  let [p] = await q.popBatch(1);

  let granted = 0;
  for (let i = 0; i < 10; i++) {
    if (!(await q.requeue(p))) break;
    granted++;
    [p] = await q.popBatch(1);
  }

  assert.equal(granted, MAX_SEND_ATTEMPTS - 1, `retries are bounded at ${MAX_SEND_ATTEMPTS - 1}`);
  assert.equal(await q.depth(), 0, "exhausted prospect is not left in the queue");
});

test("enqueue still refuses a duplicate after a requeue cycle", async () => {
  const q = newQueue();
  await q.enqueue({ email: "c@biz.com", domainUrl: "biz.com" });
  const [p] = await q.popBatch(1);
  await q.requeue(p);
  assert.equal(await q.enqueue({ email: "c@biz.com", domainUrl: "biz.com" }), false, "seen-guard intact");
});
