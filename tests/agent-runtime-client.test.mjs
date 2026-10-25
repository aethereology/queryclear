import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadTs(relPath) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const { AgentRuntimeError, parseAuditReport, runAudit } = loadTs("lib/agent-runtime.ts");

const validReport = {
  domain_url: "https://example.com/",
  page_title: "Example",
  findings: [
    {
      code: "missing_meta",
      severity: "medium",
      title: "Missing description",
      detail: "No description was found.",
      recommendation: "Add one.",
      url: "https://example.com/",
    },
  ],
  queries: [
    {
      engine: "chatgpt",
      query: "best example",
      cited_count: 0,
      samples: 1,
      citation_frequency: 0,
      confidence_low: 0,
      confidence_high: 0.79,
      measured: false,
    },
  ],
  recommendations: [
    {
      rank: 1,
      priority: 1,
      kind: "technical",
      title: "Add a description",
      rationale: "It is absent.",
      action: "Write a concise description.",
      provenance: "measured",
      evidence: "HTML crawl",
    },
  ],
  sample_draft: null,
  detected_voice: null,
  methodology: {
    version: "free-readiness-preview-v1",
    crawled_page_limit: 5,
    visibility_method: "modeled-scenario",
    samples_per_query: 1,
  },
};

test("runtime client authenticates, disables redirects, and validates the response", async () => {
  const savedFetch = global.fetch;
  const savedEnv = { ...process.env };
  let seen;
  try {
    process.env.AGENT_RUNTIME_URL = "https://runtime.example";
    process.env.AGENT_RUNTIME_SHARED_SECRET = "test-secret-0123456789-0123456789";
    global.fetch = async (url, init) => {
      seen = { url, init };
      return new Response(JSON.stringify(validReport), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const report = await runAudit({
      orgId: "org_public",
      domainId: "domain_public",
      domainUrl: "https://example.com/",
      samples: 1,
    });

    assert.equal(seen.url, "https://runtime.example/api/audit");
    assert.equal(
      seen.init.headers["x-queryclear-runtime-key"],
      "test-secret-0123456789-0123456789"
    );
    assert.equal(seen.init.redirect, "error");
    assert.equal(seen.init.cache, "no-store");
    assert.equal(report.domain_url, "https://example.com/");
    assert.equal(report.queries[0].measured, false);
  } finally {
    global.fetch = savedFetch;
    process.env = savedEnv;
  }
});

test("runtime client fails closed when its shared secret is missing", async () => {
  const saved = process.env.AGENT_RUNTIME_SHARED_SECRET;
  delete process.env.AGENT_RUNTIME_SHARED_SECRET;
  try {
    await assert.rejects(
      runAudit({ orgId: "o", domainId: "d", domainUrl: "https://example.com/" }),
      (error) => error instanceof AgentRuntimeError && error.status === 503
    );
  } finally {
    if (saved === undefined) delete process.env.AGENT_RUNTIME_SHARED_SECRET;
    else process.env.AGENT_RUNTIME_SHARED_SECRET = saved;
  }
});

test("runtime response validation rejects a report for another website", () => {
  assert.throws(
    () => parseAuditReport({ ...validReport, domain_url: "https://attacker.example/" }, "https://example.com/"),
    (error) => error instanceof AgentRuntimeError && error.status === 502
  );
});

test("runtime response validation never treats a truthy string as measured", () => {
  const report = parseAuditReport(
    {
      ...validReport,
      queries: [{ ...validReport.queries[0], measured: "true" }],
    },
    "https://example.com/"
  );
  assert.equal(report.queries[0].measured, false);
});

test("runtime client does not expose upstream exception details", async () => {
  const savedFetch = global.fetch;
  const savedEnv = { ...process.env };
  try {
    process.env.AGENT_RUNTIME_URL = "https://runtime.example";
    process.env.AGENT_RUNTIME_SHARED_SECRET = "test-secret-0123456789-0123456789";
    global.fetch = async () =>
      new Response(JSON.stringify({ error: "SecretInternalError: token=abc" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });

    await assert.rejects(
      runAudit({ orgId: "o", domainId: "d", domainUrl: "https://example.com/" }),
      (error) =>
        error instanceof AgentRuntimeError &&
        error.status === 503 &&
        !error.message.includes("SecretInternalError") &&
        !error.message.includes("token=abc")
    );
  } finally {
    global.fetch = savedFetch;
    process.env = savedEnv;
  }
});


test("runtime report preserves actual crawl coverage and UTC timestamp", () => {
  const report = parseAuditReport({ ...validReport, crawled_urls: ["https://example.com/about"], audited_at: "2026-10-25T00:00:00+00:00" }, "https://example.com/");
  assert.deepEqual(report.crawled_urls, ["https://example.com/about"]);
  assert.equal(report.audited_at, "2026-10-25T00:00:00.000Z");
});
for (const fields of [{ crawled_urls: ["javascript:alert(1)"] }, { crawled_urls: ["https://user:password@example.com"] }, { audited_at: "not-a-date" }]) {
  test("runtime report rejects unsafe or malformed evidence " + JSON.stringify(fields), () => {
    assert.throws(() => parseAuditReport({ ...validReport, ...fields }, "https://example.com/"), AgentRuntimeError);
  });
}
