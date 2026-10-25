// CI-only real Redis checks. Uses the ephemeral GitHub Actions service, never production.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import ts from 'typescript';
import test from 'node:test';
const container = process.env.REDIS_TEST_CONTAINER;
if (!container) throw Error('Ephemeral Redis test container required');
const command = (...args) => execFileSync('docker', ['exec', container, 'redis-cli', '--raw', ...args.map(String)], { encoding: 'utf8' }).trimEnd();
const redis = {
  async set(key, value, options) { return command('SET', key, JSON.stringify(value), ...(options.nx ? ['NX'] : []), 'PX', options.px); },
  async get(key) { const raw = command('GET', key); return raw ? JSON.parse(raw) : null; },
  async eval(script, keys, args) { return command('EVAL', script, keys.length, ...keys, ...args); },
  async lrange(key, start, end) { return command('LRANGE', key, start, end).split('\n').filter(Boolean).map(raw => JSON.parse(raw)); },
};
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} }; new Function('module', 'exports', 'require', source)(m, m.exports, id => {
    if (id === '@upstash/redis') return { Redis: class {} };
    if (id === 'node:crypto') return { createHash };
    throw Error(id);
  }); return m.exports;
}
const { RedisPublicAuditStore } = load('lib/public-audit-redis.ts');
const { OwnerAuditHistory } = load('lib/owner-audits.ts');
test('real Redis allows one winner and preserves ownership across recovery/expiry', async () => {
  const store = new RedisPublicAuditStore(redis);
  const results = await Promise.all(Array.from({ length: 8 }, (_, i) => store.claimAttempt('integration', 'owner-' + i)));
  assert.equal(results.filter(result => result === 'claimed').length, 1);
  const owner = 'owner-' + results.indexOf('claimed');
  const remaining = Number(command('PTTL', 'pa:attempt:integration')); assert.ok(remaining > 0 && remaining <= 120000);
  await store.releaseAttempt('integration', 'wrong');
  await store.finishAttempt('integration', 'wrong', 'bad', 1000);
  assert.equal(await store.claimAttempt('integration', 'new'), 'pending');
  await store.finishAttempt('integration', owner, 'completed-report', 600000);
  assert.deepEqual(await store.claimAttempt('integration', 'new'), { token: 'completed-report' });
  command('PEXPIRE', 'pa:attempt:integration', 0);
  assert.equal(await store.claimAttempt('integration', 'new'), 'claimed');
  await store.releaseAttempt('integration', owner);
  assert.equal(await store.claimAttempt('integration', 'third'), 'pending');
  await store.releaseAttempt('integration', 'new');
  assert.equal(await store.claimAttempt('integration', 'third'), 'claimed');
});
test('owner history retries do not duplicate reports and remain bounded', async () => {
  const history = new OwnerAuditHistory(redis);
  const entry = { token: 'same', domainUrl: 'https://example.com', createdAt: Date.now(), expiresAt: Date.now() + 60000 };
  await history.add(entry); await history.add({ ...entry, createdAt: Date.now() + 1 });
  assert.equal((await history.list()).length, 1);
  for (let i = 0; i < 45; i++) await history.add({ ...entry, token: 'item-' + i });
  assert.equal((await history.list()).length, 40);
});
