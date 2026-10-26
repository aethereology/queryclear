import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const output = ts.transpileModule(fs.readFileSync(new URL('../lib/owner-workspace.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} }; new Function('exports', 'module', output)(mod.exports, mod);
const { parseOwnerHistory, filterOwnerHistory } = mod.exports;
const row = { token: 'one', domainUrl: 'https://Example.com/services', createdAt: 100, expiresAt: 500 };
test('history validation removes expired and duplicate rows and orders newest first', () => {
  const entries = [row, row, { ...row, token: 'old', expiresAt: 150 }, { ...row, token: 'new', createdAt: 300 }];
  assert.deepEqual(parseOwnerHistory(entries, 400).map(r => r.token), ['new', 'one']);
});
for (const value of [null, {}, [null], [{ ...row, createdAt: 'yesterday' }], [{ ...row, expiresAt: 20 }], Array(41).fill(row)]) test('malformed history response fails safely: ' + JSON.stringify(value).slice(0, 80), () => {
  assert.throws(() => parseOwnerHistory(value, 400));
});
test('history search ignores case and whitespace and excludes entries that expire while open', () => {
  assert.equal(filterOwnerHistory([row], ' EXAMPLE ', 400).length, 1);
  assert.equal(filterOwnerHistory([row], 'other', 400).length, 0);
  assert.equal(filterOwnerHistory([row], '', 500).length, 0);
});
