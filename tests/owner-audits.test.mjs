import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
function load(file, imports) {
  const output = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} };
  new Function('module', 'exports', 'require', output)(m, m.exports, id => { if (!(id in imports)) throw Error(id); return imports[id]; });
  return m.exports;
}
function fixture({ authenticated = true, csrf = true, stored = true, save = true, result } = {}) {
  const calls = [];
  const entry = { token: 'owner-token', domainUrl: 'https://example.com', createdAt: Date.now(), expiresAt: Date.now() + 10000 };
  const report = { domain_url: entry.domainUrl };
  const route = load('app/api/admin/audits/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    'next/server': { NextResponse: { json: Response.json } },
    '@/lib/social/security': { verifyAdminSession: () => authenticated, verifyCsrf: () => csrf },
    '@/lib/owner-audits': { ownerAuditHistory: () => ({ list: async () => { calls.push('history'); return [entry]; }, add: async () => { calls.push('save'); if (!save) throw Error('credentials'); } }) },
    '@/lib/public-audit': { publicAuditConfig: () => ({ reportTtlMs: 10000 }), publicAuditStore: () => ({ getReport: async () => { calls.push('report'); return stored ? report : null; } }) },
    '@/app/api/public/audit/route': { POST: async () => { calls.push('guarded-pipeline'); return result ?? Response.json({ summary: { token: entry.token }, requestId: 'trace' }); } },
  });
  const request = (method = 'POST', path = '', origin = 'https://queryclear.com') => new Request('https://queryclear.com/api/admin/audits' + path, { method, headers: { origin } });
  return { route, calls, request };
}
for (const method of ['GET', 'POST']) test(method + ' blocks unauthenticated access before storage/runtime', async () => {
  const f = fixture({ authenticated: false }); const response = await f.route[method](f.request(method));
  assert.equal(response.status, 401); assert.deepEqual(f.calls, []); assert.match(response.headers.get('cache-control'), /no-store/);
});
for (const [name, csrf, origin] of [['missing CSRF', false, 'https://queryclear.com'], ['foreign origin', true, 'https://evil.example']]) test(name + ' blocks paid work', async () => {
  const f = fixture({ csrf }); assert.equal((await f.route.POST(f.request('POST', '', origin))).status, 403); assert.deepEqual(f.calls, []);
});
test('owner audit reuses guarded pipeline and records history after obtaining report', async () => {
  const f = fixture(); const response = await f.route.POST(f.request()); assert.equal(response.status, 200);
  assert.equal((await response.json()).historySaved, true); assert.deepEqual(f.calls, ['guarded-pipeline', 'report', 'save']);
});
test('history failure preserves downloadable result without claiming persistence', async () => {
  const f = fixture({ save: false }); const body = await (await f.route.POST(f.request())).json();
  assert.equal(body.historySaved, false); assert.ok(body.report); assert.ok(!JSON.stringify(body).includes('credentials'));
});
test('daily cap never attempts to read a nonexistent report', async () => {
  const f = fixture({ result: Response.json({ gated: true, requestId: 'trace' }) }); assert.equal((await f.route.POST(f.request())).status, 429); assert.deepEqual(f.calls, ['guarded-pipeline']);
});
test('rate limit and Retry-After preserved', async () => {
  const f = fixture({ result: Response.json({ error: 'Rate limited' }, { status: 429, headers: { 'retry-after': '30' } }) });
  const response = await f.route.POST(f.request()); assert.equal(response.headers.get('retry-after'), '30'); assert.deepEqual(f.calls, ['guarded-pipeline']);
});
test('public report tokens not in owner history cannot be retrieved', async () => {
  const f = fixture(); assert.equal((await f.route.GET(f.request('GET', '?token=public-token'))).status, 404); assert.deepEqual(f.calls, ['history']);
});
test('expired owner report offers fresh audit', async () => {
  const f = fixture({ stored: false }); assert.equal((await f.route.GET(f.request('GET', '?token=owner-token'))).status, 404);
});
test('history reads are bounded and expired rows excluded', async () => {
  const { OwnerAuditHistory } = load('lib/owner-audits.ts', { '@upstash/redis': {} });
  const history = new OwnerAuditHistory({ lrange: async (key, start, end) => {
    assert.equal(start, 0); assert.equal(end, 39);
    return [{ token: 'expired', domainUrl: 'https://example.com', createdAt: 1, expiresAt: 2 }, { token: 'current', domainUrl: 'https://example.com', createdAt: Date.now(), expiresAt: Date.now() + 10000 }];
  } });
  assert.deepEqual((await history.list()).map(row => row.token), ['current']);
});
for (const [returnTo, expected] of [['audits', '/admin/audits'], ['https://evil.example', '/admin/social'], ['//evil.example', '/admin/social']]) test('login return target allowlist: ' + returnTo, async () => {
  const previous = process.env.SOCIAL_ADMIN_SECRET;
  delete process.env.SOCIAL_ADMIN_SECRET;
  try {
    const route = load('app/api/social/admin/session/route.ts', {
      'next/server': { NextResponse: { redirect: (url, status) => new Response(null, { status, headers: { location: String(url) } }) } },
      '@/lib/social/security': {}, '@/lib/secret': {}, '@/lib/operations-store': {},
    });
    const response = await route.POST(new Request('https://queryclear.com/api/social/admin/session?returnTo=' + encodeURIComponent(returnTo), { method: 'POST' }));
    assert.equal(new URL(response.headers.get('location')).pathname, expected);
  } finally { if (previous !== undefined) process.env.SOCIAL_ADMIN_SECRET = previous; }
});
