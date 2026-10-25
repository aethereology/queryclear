import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(new URL(`../lib/${file}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} }; new Function('exports', 'module', source)(mod.exports, mod); return mod.exports;
}
const { reportAsText, reportFilename } = load('audit-workspace');
const { trackAnalyticsEvent, readAnalyticsConsent, isPrivateAnalyticsPath } = load('analytics');
test('portable report preserves sources and separates hypotheses from observations', () => {
  const result = reportAsText({ domain_url: 'https://example.com', page_title: 'Example', audited_at: '2026-10-25', crawled_urls: ['https://example.com/services'], recommendations: [{ rank: 1, title: 'Heading', provenance: 'measured', rationale: 'Missing H1', action: 'Add H1', evidence: 'source HTML' }], findings: [{ severity: 'medium', title: 'Heading', detail: 'Missing H1', recommendation: 'Add H1', url: 'https://example.com/services' }], queries: [{ query: 'Service?', cited_count: 0, samples: 1, measured: false }], sample_draft: { body: 'Verify this claim.' } });
  for (const expected of ['Page: https://example.com/services', 'Source: https://example.com/services', 'Evidence: source HTML', '[measured]', 'modeled; not a live engine test', 'VERIFY EVERY BUSINESS CLAIM', 'Verify this claim.']) assert.ok(result.includes(expected), expected);
});
test('download names cannot contain paths or URL credentials', () => {
  assert.equal(reportFilename('https://user:password@example.com/path?secret=x'), 'queryclear-example.com.txt');
  assert.equal(reportFilename('not a URL'), 'queryclear-report.txt');
});
test('analytics cannot interrupt forms when browser storage or scripts are blocked', () => {
  const previous = globalThis.window;
  try {
    globalThis.window = { location: { pathname: "/free-audit" }, get localStorage() { throw new Error('blocked'); } };
    assert.doesNotThrow(() => trackAnalyticsEvent('submit'));
    globalThis.window = { location: { pathname: "/free-audit" }, localStorage: { getItem: () => 'granted' }, gtag: () => { throw new Error('blocked'); } };
    assert.doesNotThrow(() => trackAnalyticsEvent('submit'));
    let called = false;
    globalThis.window = { location: { pathname: "/free-audit" }, localStorage: { getItem: () => 'denied' }, gtag: () => { called = true; } };
    trackAnalyticsEvent('submit'); assert.equal(called, false);
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; }
});

test('private report and administration URLs are excluded from analytics', () => {
  for (const path of ['/r/token', '/reports/client', '/admin/social', '/outreach', '/ai-visibility-audit/success']) assert.equal(isPrivateAnalyticsPath(path), true);
  for (const path of ['/', '/free-audit', '/resources']) assert.equal(isPrivateAnalyticsPath(path), false);
  const previous = globalThis.window;
  try {
    let events = 0;
    globalThis.window = { location: { pathname: '/r/secret-token' }, localStorage: { getItem: () => 'granted' }, gtag: () => { events++; } };
    trackAnalyticsEvent('page_view'); assert.equal(events, 0);
    globalThis.window = { get localStorage() { throw new Error('blocked'); } };
    assert.equal(readAnalyticsConsent(), null);
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; }
});
