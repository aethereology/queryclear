import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Transpile + eval a TS module, resolving runtime imports from a stub map.
// Same pattern as tests/public-audit-email.test.mjs, extended with `mocks`.
function loadTs(relPath, mocks = {}) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    if (spec in mocks) return mocks[spec];
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const publicAudit = loadTs("lib/public-audit.ts", {
  "./public-audit-redis": { RedisPublicAuditStore: class {} },
});
const { InMemoryPublicAuditStore, publicAuditConfig, summarize } = publicAudit;

const stubReport = {
  domain_url: "example.com",
  page_title: "Example",
  findings: [
    { code: "a", severity: "high", title: "Finding A", detail: "", recommendation: "", url: null },
    { code: "b", severity: "medium", title: "Finding B", detail: "", recommendation: "", url: null },
    { code: "c", severity: "low", title: "Finding C", detail: "", recommendation: "", url: null },
    { code: "d", severity: "low", title: "Finding D", detail: "", recommendation: "", url: null },
  ],
  queries: [
    { engine: "chatgpt", query: "q1", cited_count: 0, samples: 1, citation_frequency: 0, confidence_low: 0, confidence_high: 0.3, measured: false },
    { engine: "chatgpt", query: "q2", cited_count: 1, samples: 1, citation_frequency: 1, confidence_low: 0.3, confidence_high: 1, measured: false },
  ],
  recommendations: [
    { rank: 1, priority: 1, kind: "technical", title: "Fix A", rationale: "", action: "", provenance: "measured", evidence: "" },
  ],
  sample_draft: null,
  detected_voice: null,
};

// --- Store guard logic -------------------------------------------------------

test("rateLimit allows up to the limit, then blocks with a retry hint", async () => {
  let now = 1_000_000;
  const store = new InMemoryPublicAuditStore(() => now);
  for (let i = 0; i < 3; i++) {
    const r = await store.rateLimit("1.2.3.4", 3, 60_000);
    assert.equal(r.allowed, true, `request ${i + 1} should pass`);
  }
  const blocked = await store.rateLimit("1.2.3.4", 3, 60_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0, "should tell the caller when to retry");
  // A different IP is unaffected.
  assert.equal((await store.rateLimit("5.6.7.8", 3, 60_000)).allowed, true);
});

test("rateLimit window resets after it elapses", async () => {
  let now = 1_000_000;
  const store = new InMemoryPublicAuditStore(() => now);
  await store.rateLimit("1.2.3.4", 1, 60_000);
  assert.equal((await store.rateLimit("1.2.3.4", 1, 60_000)).allowed, false);
  now += 60_001;
  assert.equal((await store.rateLimit("1.2.3.4", 1, 60_000)).allowed, true);
});

test("reserveSpend enforces the daily cap and releaseSpend refunds a failed audit", async () => {
  let now = Date.UTC(2026, 0, 1, 12);
  const store = new InMemoryPublicAuditStore(() => now);
  // Cap $0.03 at $0.01/audit → three reservations pass, the fourth is gated.
  for (let i = 0; i < 3; i++) {
    assert.equal((await store.reserveSpend(0.01, 0.03)).allowed, true);
  }
  assert.equal((await store.reserveSpend(0.01, 0.03)).allowed, false);
  // A failed audit releases its reservation, reopening capacity.
  await store.releaseSpend(0.01);
  assert.equal((await store.reserveSpend(0.01, 0.03)).allowed, true);
});

test("reserveSpend resets on UTC day rollover", async () => {
  let now = Date.UTC(2026, 0, 1, 23, 59);
  const store = new InMemoryPublicAuditStore(() => now);
  assert.equal((await store.reserveSpend(0.01, 0.01)).allowed, true);
  assert.equal((await store.reserveSpend(0.01, 0.01)).allowed, false);
  now = Date.UTC(2026, 0, 2, 0, 1);
  assert.equal((await store.reserveSpend(0.01, 0.01)).allowed, true);
});

test("report cache round-trips within TTL and expires after it", async () => {
  let now = 1_000_000;
  const store = new InMemoryPublicAuditStore(() => now);
  await store.putReport("tok", stubReport, 10_000);
  assert.deepEqual(await store.getReport("tok"), stubReport);
  now += 10_001;
  assert.equal(await store.getReport("tok"), null);
  assert.equal(await store.getReport("never-stored"), null);
});

test("summarize counts invisible queries and caps top findings at 3", () => {
  const s = summarize("tok", stubReport);
  assert.equal(s.token, "tok");
  assert.equal(s.technicalIssues, 4);
  assert.equal(s.invisibleQueries, 1); // only cited_count === 0
  assert.equal(s.recommendations, 1);
  assert.equal(s.topFindings.length, 3);
  assert.equal(s.topFindings[0].title, "Finding A");
});

test("publicAuditConfig falls back to defaults on missing or garbage env", () => {
  const saved = { ...process.env };
  try {
    delete process.env.PUBLIC_AUDIT_DAILY_CAP_USD;
    process.env.PUBLIC_AUDIT_IP_LIMIT = "not-a-number";
    process.env.PUBLIC_AUDIT_COST_USD = "-1";
    const cfg = publicAuditConfig();
    assert.equal(cfg.dailyCapUsd, 5);
    assert.equal(cfg.ipLimit, 5);
    assert.equal(cfg.costPerAuditUsd, 0.01);
  } finally {
    process.env = saved;
  }
});

// --- Route gates (the order that keeps the endpoint from burning money) ------

function fakeRequest(body, ip = "9.9.9.9") {
  return {
    headers: { get: (name) => (name === "x-forwarded-for" ? ip : null) },
    json: async () => body,
  };
}

function loadAuditRoute({ store, runAudit }) {
  class AgentRuntimeError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  const route = loadTs("app/api/public/audit/route.ts", {
    "node:crypto": { randomUUID: () => "fixed-token" },
    "next/server": {
      NextResponse: {
        json: (body, init) => ({ body, status: init?.status ?? 200 }),
      },
    },
    "@/lib/agent-runtime": { runAudit, AgentRuntimeError },
    "@/lib/public-audit": {
      publicAuditConfig,
      publicAuditStore: () => store,
      summarize,
    },
  });
  return { POST: route.POST, AgentRuntimeError };
}

test("route: rate-limited IP gets 429 and the runtime is never called", async () => {
  let now = 1_000_000;
  const store = new InMemoryPublicAuditStore(() => now);
  let runtimeCalls = 0;
  const { POST } = loadAuditRoute({
    store,
    runAudit: async () => {
      runtimeCalls += 1;
      return stubReport;
    },
  });
  for (let i = 0; i < 5; i++) await POST(fakeRequest({ domainUrl: "example.com" }));
  const res = await POST(fakeRequest({ domainUrl: "example.com" }));
  assert.equal(res.status, 429);
  assert.equal(runtimeCalls, 5, "the 6th request must not reach the runtime");
});

test("route: daily cap hit returns gated capture instead of calling the runtime", async () => {
  const store = new InMemoryPublicAuditStore(() => Date.UTC(2026, 0, 1, 12));
  // Exhaust the cap directly (cheaper than 500 requests).
  while ((await store.reserveSpend(0.01, 5)).allowed) {
    /* drain */
  }
  let runtimeCalls = 0;
  const { POST } = loadAuditRoute({
    store,
    runAudit: async () => {
      runtimeCalls += 1;
      return stubReport;
    },
  });
  const res = await POST(fakeRequest({ domainUrl: "example.com" }));
  assert.equal(res.status, 200);
  assert.equal(res.body.gated, true);
  assert.equal(runtimeCalls, 0, "a gated request must never call the runtime");
});

test("route: failed audit releases its spend reservation", async () => {
  const store = new InMemoryPublicAuditStore(() => Date.UTC(2026, 0, 1, 12));
  const { POST, AgentRuntimeError } = loadAuditRoute({
    store,
    runAudit: async () => {
      throw new AgentRuntimeError("Audit service unreachable.", 503);
    },
  });
  // Cap fits exactly one audit; the failed one must refund so a retry passes gate 2.
  process.env.PUBLIC_AUDIT_DAILY_CAP_USD = "0.01";
  try {
    const failed = await POST(fakeRequest({ domainUrl: "example.com" }));
    assert.equal(failed.status, 503);
    const spend = await store.reserveSpend(0.01, 0.01);
    assert.equal(spend.allowed, true, "failed audit should not consume the cap");
  } finally {
    delete process.env.PUBLIC_AUDIT_DAILY_CAP_USD;
  }
});

test("route: successful audit caches the full report and returns only the summary", async () => {
  const store = new InMemoryPublicAuditStore(() => Date.UTC(2026, 0, 1, 12));
  const { POST } = loadAuditRoute({ store, runAudit: async () => stubReport });
  const res = await POST(fakeRequest({ domainUrl: "example.com" }));
  assert.equal(res.status, 200);
  assert.equal(res.body.summary.token, "fixed-token");
  assert.equal(res.body.summary.technicalIssues, 4);
  assert.equal(res.body.report, undefined, "full report must stay behind the email gate");
  assert.deepEqual(await store.getReport("fixed-token"), stubReport, "full report cached for unlock");
});

test("route: blank URL is rejected before any gate", async () => {
  const store = new InMemoryPublicAuditStore();
  const { POST } = loadAuditRoute({
    store,
    runAudit: async () => {
      throw new Error("should not be called");
    },
  });
  const res = await POST(fakeRequest({ domainUrl: "   " }));
  assert.equal(res.status, 400);
});
