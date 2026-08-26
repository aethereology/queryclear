import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const modulePath = path.join(projectRoot, "lib", "private-report-store.ts");

function validReport(overrides = {}) {
  return {
    slug: "client-report-123",
    business: "Example Co",
    market: "Jacksonville",
    scoreAfter: 80,
    variant: "client",
    demo: false,
    visibilityTests: [
      {
        prompt: "Who provides this service?",
        result: "Not surfaced",
        note: "No named provider appeared in the recorded answer.",
        engine: "Example engine",
        observedAt: "2026-08-25T14:30:00-04:00",
        accessMethod: "Logged-out browser session",
        observationType: "live",
      },
    ],
    scorecard: [
      "entity-clarity",
      "service-specificity",
      "proof-density",
      "local-relevance",
      "answer-coverage",
      "machine-readability",
      "conversion-path",
    ].map((layer) => ({ layer, score: 5, finding: "Finding" })),
    fixes: [],
    machineView: { before: [], beforeNote: "", after: [], afterNote: "" },
    ...overrides,
  };
}

function loadModule(blobValue) {
  const output = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modulePath,
  }).outputText;
  const moduleObj = { exports: {} };
  const mockRequire = (id) => {
    if (id === "@vercel/blob") {
      return {
        get: async () => {
          if (blobValue === null) return null;
          const raw = typeof blobValue === "string" ? blobValue : JSON.stringify(blobValue);
          return {
            stream: new Blob([raw]).stream(),
            blob: { size: Buffer.byteLength(raw) },
          };
        },
      };
    }
    throw new Error(`Unexpected import: ${id}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, mockRequire);
  return moduleObj.exports;
}

test("loads only a private client report whose slug matches the requested object", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "blob-test";
  const { getPrivateReport } = loadModule(validReport());
  assert.equal((await getPrivateReport("client-report-123")).business, "Example Co");
});

test("rejects mismatched, demo, malformed, and absent private report data", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "blob-test";
  assert.equal(await loadModule(validReport({ slug: "other" })).getPrivateReport("client-report-123"), null);
  assert.equal(await loadModule(validReport({ demo: true })).getPrivateReport("client-report-123"), null);
  assert.equal(await loadModule(validReport({ scoreAfter: 101 })).getPrivateReport("client-report-123"), null);
  assert.equal(await loadModule(validReport({ visibilityTests: [] })).getPrivateReport("client-report-123"), null);
  assert.equal(
    await loadModule(validReport({
      visibilityTests: [{
        prompt: "A prompt",
        result: "Unknown",
        note: "Missing provenance.",
        observationType: "live",
      }],
    })).getPrivateReport("client-report-123"),
    null,
  );
  assert.equal(await loadModule(validReport({ scorecard: [] })).getPrivateReport("client-report-123"), null);
  assert.equal(await loadModule("{bad json").getPrivateReport("client-report-123"), null);
  assert.equal(await loadModule(null).getPrivateReport("client-report-123"), null);
});

test("fails closed when private Blob credentials are absent", async () => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_STORE_ID;
  const { getPrivateReport } = loadModule(validReport());
  assert.equal(await getPrivateReport("client-report-123"), null);
});
