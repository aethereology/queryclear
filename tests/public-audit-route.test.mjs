import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import ts from 'typescript';

function load(file, imports = {}) {
  const output = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleObj = { exports: {} };
  new Function('module', 'exports', 'require', 'console', output)(moduleObj, moduleObj.exports,
    id => { if (!(id in imports)) throw new Error(id); return imports[id]; }, { info() {} });
  return moduleObj.exports;
}
const runtime = load('lib/agent-runtime.ts');
function fixture(overrides = {}) {
  const calls = [];
  const store = Object.fromEntries(Object.entries({
    rateLimit: async () => ({ allowed: true }),
    reserveSpend: async () => ({ allowed: true }),
    claimAttempt: async () => 'claimed', finishAttempt: async () => {}, releaseAttempt: async () => {}, getReport: async () => ({ findings: [] }), putReport: async () => {}, releaseSpend: async () => {}, ...overrides,
  }).map(([key, fn]) => [key, async (...args) => { calls.push(key); return fn(...args); }]));
  const route = load('app/api/public/audit/route.ts', {
    'node:crypto': { createHash, randomUUID },
    'next/server': { NextResponse: { json: Response.json } },
    '@/lib/json-request': load('lib/json-request.ts'),
    '@/lib/public-audit-url': load('lib/public-audit-url.ts'),
    '@/lib/agent-runtime': { ...runtime, runAudit: async () => { calls.push('runtime'); return overrides.run ? overrides.run() : { findings: [] }; } },
    '@/lib/public-audit': {
      publicAuditConfig: () => ({ ipLimit: 5, ipWindowMs: 1000, costPerAuditUsd: .01, dailyCapUsd: 5, reportTtlMs: 1000 }),
      publicAuditStore: () => store, summarize: token => ({ token }),
    },
  });
  return { calls, route };
}
function request(body = JSON.stringify({ domainUrl: 'https://example.com' }), type = 'application/json') {
  return new Request('https://queryclear.com/api/public/audit', { method: 'POST', headers: { 'content-type': type }, body });
}
for (const [name, body, type, status] of [
  ['malformed JSON', '{', 'application/json', 400],
  ['oversized body', 'x'.repeat(8193), 'application/json', 413],
  ['wrong media type', '{}', 'text/plain', 415],
  ['private target', '{"domainUrl":"http://127.0.0.1"}', 'application/json', 400],
]) test(name + ' never reaches storage or runtime', async () => {
  const { route, calls } = fixture();
  const res = await route.POST(request(body, type));
  assert.equal(res.status, status); assert.deepEqual(calls, []);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal((await res.json()).requestId, res.headers.get('x-request-id'));
});
test('successful report persists before summary is returned', async () => {
  const { route, calls } = fixture();
  const res = await route.POST(request());
  assert.equal(res.status, 200); assert.ok((await res.json()).summary.token);
  assert.deepEqual(calls, ['rateLimit', 'reserveSpend', 'runtime', 'putReport']);
});
for (const operation of ['rateLimit', 'reserveSpend', 'putReport']) test(operation + ' failure returns sanitized JSON', async () => {
  const { route, calls } = fixture({ [operation]: async () => { throw new Error('secret database credentials'); } });
  const res = await route.POST(request());
  assert.equal(res.status, 503); const body = await res.json();
  assert.ok(body.requestId); assert.ok(!body.error.includes('secret'));
  assert.ok(!calls.includes('releaseSpend'));
  if (operation !== 'putReport') assert.ok(!calls.includes('runtime'));
});
test('rate limit carries retry time without spending', async () => {
  const { route, calls } = fixture({ rateLimit: async () => ({ allowed: false, retryAfterMs: 1500 }) });
  const res = await route.POST(request());
  assert.equal(res.status, 429); assert.equal(res.headers.get('retry-after'), '2');
  assert.deepEqual(calls, ['rateLimit']);
});
test('daily cap returns honest capacity gate without runtime call', async () => {
  const { route, calls } = fixture({ reserveSpend: async () => ({ allowed: false }) });
  const res = await route.POST(request());
  assert.equal((await res.json()).gated, true); assert.ok(!calls.includes('runtime'));
});
for (const incurred of [true, false]) test('runtime cost reservation: incurred=' + incurred, async () => {
  const { route, calls } = fixture({ run: () => { throw new runtime.AgentRuntimeError('Unavailable', 503, incurred); } });
  assert.equal((await route.POST(request())).status, 503);
  assert.equal(calls.includes('releaseSpend'), !incurred);
});

function retryRequest(key = '10000000-0000-4000-8000-000000000001') {
  const r = request(); r.headers.set('x-audit-attempt', key); return r;
}
test('malformed attempt IDs cannot allocate storage or invoke the runtime', async () => {
  const f = fixture(); assert.equal((await f.route.POST(retryRequest('bad'))).status, 400); assert.deepEqual(f.calls, []);
});
test('pending attempt returns Retry-After without spending or model work', async () => {
  const f = fixture({ claimAttempt: async () => 'pending' }); const res = await f.route.POST(retryRequest());
  assert.equal(res.status, 409); assert.equal(res.headers.get('retry-after'), '120');
  assert.deepEqual(f.calls, ['rateLimit', 'claimAttempt']);
});
test('completed attempt recovers its report without another spend reservation', async () => {
  const f = fixture({ claimAttempt: async () => ({ token: 'original' }) }); const res = await f.route.POST(retryRequest());
  assert.equal((await res.json()).summary.token, 'original'); assert.deepEqual(f.calls, ['rateLimit', 'claimAttempt', 'getReport']);
});
test('new attempt records recovery only after report persistence', async () => {
  const f = fixture(); assert.equal((await f.route.POST(retryRequest())).status, 200);
  assert.deepEqual(f.calls, ['rateLimit', 'claimAttempt', 'reserveSpend', 'runtime', 'putReport', 'finishAttempt']);
});
test('capacity gate releases the unused attempt', async () => {
  const f = fixture({ reserveSpend: async () => ({ allowed: false }) }); await f.route.POST(retryRequest());
  assert.ok(f.calls.includes('releaseAttempt')); assert.ok(!f.calls.includes('runtime'));
});
test('uncertain runtime failure retains the lock and spend reservation', async () => {
  const f = fixture({ run: () => { throw new runtime.AgentRuntimeError('Timed out', 504, true); } }); await f.route.POST(retryRequest());
  assert.ok(!f.calls.includes('releaseAttempt')); assert.ok(!f.calls.includes('releaseSpend'));
});
test('known pre-work runtime rejection permits a safe retry', async () => {
  const f = fixture({ run: () => { throw new runtime.AgentRuntimeError('Unavailable', 503, false); } }); await f.route.POST(retryRequest());
  assert.ok(f.calls.includes('releaseAttempt')); assert.ok(f.calls.includes('releaseSpend'));
});
test('recovery-cache outage does not hide an already persisted successful report', async () => {
  const f = fixture({ finishAttempt: async () => { throw Error('storage'); } });
  assert.equal((await f.route.POST(retryRequest())).status, 200);
});
test('missing cached report requests a fresh attempt instead of repeated paid work', async () => {
  const f = fixture({ claimAttempt: async () => ({ token: 'expired' }), getReport: async () => null });
  assert.equal((await f.route.POST(retryRequest())).status, 410); assert.ok(!f.calls.includes('runtime'));
});
test('attempt scope binds the caller, normalized target and nonce without storing raw identity', async () => {
  const keys = [];
  const f = fixture({ claimAttempt: async key => { keys.push(key); return 'pending'; } });
  await f.route.POST(retryRequest());
  const other = retryRequest(); other.headers.set('x-forwarded-for', '203.0.113.10'); await f.route.POST(other);
  assert.notEqual(keys[0], keys[1]); assert.match(keys[0], /^[a-f0-9]{64}$/);
});
