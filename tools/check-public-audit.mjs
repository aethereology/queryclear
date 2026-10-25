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
