import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.resolve(__dirname, "..", "lib", "public-audit-redis.ts");
const output = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: modulePath,
}).outputText;
const moduleObj = { exports: {} };
const mockRequire = (id) => {
  if (id === "@upstash/redis") return { Redis: class UnusedRedis {} };
  if (id === "node:crypto") return { createHash };
  throw new Error(`Unexpected import: ${id}`);
};
new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, mockRequire);
const { RedisPublicAuditStore } = moduleObj.exports;

test("public-audit rate limit uses one TTL-setting script and hashes the IP", async () => {
  const calls = [];
  const store = new RedisPublicAuditStore({
    eval: async (script, keys, args) => {
      calls.push({ script, keys, args });
      return [6, 12_000];
    },
  });
  const result = await store.rateLimit("203.0.113.10", 5, 60_000);
  assert.deepEqual(result, { allowed: false, retryAfterMs: 12_000 });
  assert.equal(calls.length, 1);
  assert.match(calls[0].script, /INCR/);
  assert.match(calls[0].script, /PEXPIRE/);
  assert.doesNotMatch(calls[0].keys[0], /203\.0\.113\.10/);
});

test("public-audit spend reservation performs increment, rollback, and expiry atomically", async () => {
  const calls = [];
  const store = new RedisPublicAuditStore({
    eval: async (script, keys, args) => {
      calls.push({ script, keys, args });
      return [0, "4.5"];
    },
  });
  assert.deepEqual(await store.reserveSpend(1, 5), { allowed: false, spentUsd: 4.5, capUsd: 5 });
  assert.equal(calls.length, 1);
  assert.match(calls[0].script, /INCRBYFLOAT/);
  assert.match(calls[0].script, /EXPIRE/);
});
