import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.resolve(__dirname, "..", "lib", "json-request.ts");
const output = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: modulePath,
}).outputText;
const moduleObj = { exports: {} };
new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, () => {});
const { readJsonRequest } = moduleObj.exports;

test("bounded JSON reader accepts JSON and structured JSON media types", async () => {
  for (const contentType of ["application/json", "application/problem+json; charset=utf-8"]) {
    const request = new Request("https://example.test", {
      method: "POST",
      headers: { "content-type": contentType },
      body: JSON.stringify({ ok: true }),
    });
    assert.deepEqual(await readJsonRequest(request, 100), { ok: true, value: { ok: true } });
  }
});

test("bounded JSON reader rejects wrong media types before parsing", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{\"ok\":true}",
  });
  const result = await readJsonRequest(request, 100);
  assert.equal(result.status, 415);
});

test("bounded JSON reader rejects a streamed payload above the local cap", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(200) }),
  });
  const result = await readJsonRequest(request, 50);
  assert.equal(result.status, 413);
});

test("bounded JSON reader rejects malformed JSON", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad",
  });
  const result = await readJsonRequest(request, 100);
  assert.equal(result.status, 400);
});
