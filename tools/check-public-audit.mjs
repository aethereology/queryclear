// Cost-free production health check. Never submits a valid audit or sends email.
import assert from 'node:assert/strict';
const origin = new URL(process.env.QUERYCLEAR_SMOKE_URL || 'https://www.queryclear.com');
assert.equal(origin.protocol, 'https:');
const page = await fetch(new URL('/free-audit', origin), { signal: AbortSignal.timeout(20000) });
assert.equal(page.status, 200, 'Audit page must load');
assert.match(await page.text(), /Run free preview/, 'Audit form must render');
const invalid = await fetch(new URL('/api/public/audit', origin), {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ domainUrl: 'http://127.0.0.1' }), signal: AbortSignal.timeout(20000),
});
assert.equal(invalid.status, 400, 'Private targets must be rejected');
const body = await invalid.json();
assert.equal(typeof body.error, 'string');
assert.match(body.requestId, /^[a-f\d-]{36}$/);
assert.equal(invalid.headers.get('cache-control'), 'no-store');
console.log('PASS: audit page, public API validation, support ID, no-store. No AI or email invoked.');
// Reach the Python function without a credential, valid target, model call or email.
// A 401 proves that the runtime loaded and its authentication boundary is active.
const runtime = new URL(process.env.QUERYCLEAR_SMOKE_RUNTIME_URL || 'https://agent-runtime-eta.vercel.app/api/audit');
assert.equal(runtime.protocol, 'https:');
const denied = await fetch(runtime, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  signal: AbortSignal.timeout(20000),
});
assert.equal(denied.status, 401, 'Runtime must be reachable and reject unauthenticated requests');
assert.equal((await denied.json()).error, 'Unauthorized.');
console.log('PASS: Python runtime reachable and authentication enforced. No model or email invoked.');
