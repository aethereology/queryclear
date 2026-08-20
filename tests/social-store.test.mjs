import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

class FakeRedis {
  values = new Map();
  sorted = new Map();
  lists = new Map();

  async get(key) { return this.values.get(key) ?? null; }
  async set(key, value, options = {}) {
    if (options.nx && this.values.has(key)) return null;
    this.values.set(key, value);
    return "OK";
  }
  async del(key) { this.values.delete(key); return 1; }
  async expire() { return 1; }
  async incrby(key, amount) {
    const next = Number(this.values.get(key) ?? 0) + Number(amount);
    this.values.set(key, next);
    return next;
  }
  async zadd(key, item) {
    const values = this.sorted.get(key) ?? new Map();
    values.set(item.member, Number(item.score));
    this.sorted.set(key, values);
    return 1;
  }
  async zrem(key, member) { return this.sorted.get(key)?.delete(member) ? 1 : 0; }
  async zrange(key, start, end, options = {}) {
    let items = [...(this.sorted.get(key) ?? new Map()).entries()].sort((a, b) => a[1] - b[1]);
    if (options.byScore) {
      items = items.filter(([, score]) => score >= Number(start) && score <= Number(end));
      if (options.offset) items = items.slice(options.offset);
      if (options.count) items = items.slice(0, options.count);
    } else {
      if (options.rev) items.reverse();
      items = items.slice(start, end + 1);
    }
    return items.map(([member]) => member);
  }
  async lpush(key, value) {
    const list = this.lists.get(key) ?? [];
    list.unshift(value);
    this.lists.set(key, list);
    return list.length;
  }
  async ltrim(key, start, end) {
    this.lists.set(key, (this.lists.get(key) ?? []).slice(start, end + 1));
  }
  async lrange(key, start, end) { return (this.lists.get(key) ?? []).slice(start, end + 1); }
}

function loadStore() {
  const file = path.join(root, "lib/social/store.ts");
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const moduleObj = { exports: {} };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, (specifier) => {
    if (specifier === "node:crypto") return { randomUUID };
    if (specifier === "@upstash/redis") return { Redis: class {} };
    if (specifier === "./config") {
      return {
        configuredSocialAccounts: () => [],
        DEFAULT_SOCIAL_SETTINGS: {
          globalPaused: true,
          monthlyBudgetUsd: 90,
          redditAllowlist: [],
          updatedAt: new Date(0).toISOString(),
        },
      };
    }
    throw new Error(`Unexpected import: ${specifier}`);
  });
  return moduleObj.exports;
}

const { SocialStore } = loadStore();

test("idempotency key makes duplicate enqueue return the same external action", async () => {
  const store = new SocialStore(new FakeRedis());
  const input = {
    kind: "publish",
    accountId: "x-brand",
    postId: "post-1",
    idempotencyKey: "publish:post-1",
    dueAt: "2026-07-26T12:00:00.000Z",
  };
  const [first, duplicate] = await Promise.all([store.enqueueAction(input), store.enqueueAction(input)]);
  assert.ok(first);
  assert.ok(duplicate);
  assert.equal(first.id, duplicate.id);
  assert.equal((await store.listActions()).length, 1);
});

test("leases allow only one worker to claim a due action", async () => {
  const store = new SocialStore(new FakeRedis());
  await store.enqueueAction({
    kind: "publish",
    accountId: "x-brand",
    postId: "post-2",
    idempotencyKey: "publish:post-2",
    dueAt: "2026-07-26T12:00:00.000Z",
  });
  const [a, b] = await Promise.all([store.claimDueActions(5), store.claimDueActions(5)]);
  assert.equal(a.length + b.length, 1);
  assert.equal((a[0] ?? b[0]).status, "leased");
});

test("monthly spend reservation rolls back the amount that crosses the cap", async () => {
  const store = new SocialStore(new FakeRedis());
  assert.equal((await store.reserveSpend(89)).allowed, true);
  const blocked = await store.reserveSpend(2);
  assert.equal(blocked.allowed, false);
  assert.equal(await store.spendThisMonth(), 89);
});
