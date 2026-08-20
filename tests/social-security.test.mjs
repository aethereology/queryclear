import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadSecurity() {
  const file = path.join(root, "lib/social/security.ts");
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const moduleObj = { exports: {} };
  const crypto = { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual };
  const secretOk = (a, b) => {
    const left = createHash("sha256").update(a).digest();
    const right = createHash("sha256").update(b).digest();
    return timingSafeEqual(left, right);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, (specifier) => {
    if (specifier === "node:crypto") return crypto;
    if (specifier === "@upstash/qstash") return { Receiver: class {} };
    if (specifier === "@/lib/secret") return { secretOk };
    throw new Error(`Unexpected import: ${specifier}`);
  });
  return moduleObj.exports;
}

test("admin sessions expire, reject tampering, and bind CSRF to the session", () => {
  process.env.SOCIAL_ADMIN_SECRET = "unit-test-admin-secret";
  const { createAdminSession, verifyAdminSession, csrfForSession, verifyCsrf } = loadSecurity();
  const now = Date.parse("2026-07-26T12:00:00.000Z");
  const session = createAdminSession(now);
  assert.equal(verifyAdminSession(session, now + 1_000), true);
  assert.equal(verifyAdminSession(`${session}tampered`, now + 1_000), false);
  assert.equal(verifyAdminSession(session, now + 13 * 60 * 60 * 1000), false);
  assert.equal(verifyCsrf(session, csrfForSession(session)), true);
  assert.equal(verifyCsrf(session, csrfForSession(createAdminSession(now))), false);
});

test("stored OAuth tokens are encrypted with authenticated encryption", () => {
  process.env.SOCIAL_ENCRYPTION_KEY = "unit-test-encryption-secret";
  const { encryptSecret, decryptSecret } = loadSecurity();
  const encrypted = encryptSecret("platform-token-value");
  assert.equal(encrypted.includes("platform-token-value"), false);
  assert.equal(decryptSecret(encrypted), "platform-token-value");
  const parts = encrypted.split(".");
  parts[2] = `${parts[2].slice(0, -1)}A`;
  assert.throws(() => decryptSecret(parts.join(".")));
});
