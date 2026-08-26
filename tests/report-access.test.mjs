import assert from "node:assert/strict";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const modulePath = path.join(projectRoot, "lib", "report-access.ts");

function loadModule() {
  const output = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modulePath,
  }).outputText;
  const moduleObj = { exports: {} };
  const mockRequire = (id) => {
    if (id === "node:crypto") return { createHash, createHmac, timingSafeEqual };
    throw new Error(`Unexpected import: ${id}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, mockRequire);
  return moduleObj.exports;
}

const {
  createReportAccessToken,
  reportAccessCookieName,
  reportAccessTokenExpiresAt,
  verifyReportAccessToken,
} = loadModule();

test("report token is bound to the slug, signature, and expiration", () => {
  process.env.REPORT_ACCESS_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
  const expiresAt = 2_000_000_000;
  const token = createReportAccessToken("client-report-123", expiresAt);
  assert.equal(verifyReportAccessToken("client-report-123", token, expiresAt - 1), true);
  assert.equal(verifyReportAccessToken("other-report", token, expiresAt - 1), false);
  assert.equal(verifyReportAccessToken("client-report-123", `${token}x`, expiresAt - 1), false);
  assert.equal(verifyReportAccessToken("client-report-123", token, expiresAt), false);
  assert.equal(reportAccessTokenExpiresAt(token), expiresAt);
  assert.match(reportAccessCookieName("client-report-123"), /^qc_report_[0-9a-f]{24}$/);
});

test("report verification fails closed without a strong configured secret", () => {
  delete process.env.REPORT_ACCESS_SECRET;
  assert.equal(verifyReportAccessToken("client-report-123", "v1.2000000000.abc", 1), false);
  process.env.REPORT_ACCESS_SECRET = "short";
  assert.equal(verifyReportAccessToken("client-report-123", "v1.2000000000.abc", 1), false);
});
