import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const routePath = path.join(projectRoot, "app", "api", "public", "lead", "route.ts");
const jsonRequestModulePath = path.join(projectRoot, "lib", "json-request.ts");
const publicAuditUrlModulePath = path.join(projectRoot, "lib", "public-audit-url.ts");
const validToken = "10000000-0000-4000-8000-000000000001";

const report = {
  domain_url: "https://example.com/",
  page_title: "Example",
  findings: [],
  queries: [],
  recommendations: [],
};

function request(body, ip = "203.0.113.20", contentType = "application/json") {
  const headers = { "x-forwarded-for": ip };
  if (contentType !== null) headers["content-type"] = contentType;
  return new Request("https://www.queryclear.com/api/public/lead", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function loadPureModule(modulePath) {
  const output = ts.transpileModule(fs.readFileSync(modulePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modulePath,
  }).outputText;
  const moduleObj = { exports: {} };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, () => {});
  return moduleObj.exports;
}

function loadRoute({ reportForToken = null, getReportImpl, claimAndSaveImpl, saveImpl, rateLimitImpl, sendImpl } = {}) {
  const output = ts.transpileModule(fs.readFileSync(routePath, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: routePath,
  }).outputText;
  const moduleObj = { exports: {} };
  const stored = [];
  const deliveryUpdates = [];
  const sent = [];
  const timeline = [];
  let reportClaimed = false;
  let reportClaimInProgress = false;
  const store = {
    rateLimit: rateLimitImpl ?? (async () => ({ allowed: true, retryAfterMs: 0 })),
    saveLead: saveImpl ?? (async (lead) => { timeline.push("saved"); stored.push(lead); }),
    updateLeadDelivery: async (id, delivery) => deliveryUpdates.push({ id, delivery }),
  };
  store.claimReportAndSaveLead = claimAndSaveImpl ?? (async (_token, _ttlMs, lead) => {
    if (reportClaimed || reportClaimInProgress) return "already_claimed";
    reportClaimInProgress = true;
    try {
      if (saveImpl) await saveImpl(lead);
      else { timeline.push("saved"); stored.push(lead); }
      reportClaimed = true;
      return "saved";
    } finally {
      reportClaimInProgress = false;
    }
  });

  class MockResend {
    constructor() {
      this.emails = {
        send: async (message) => {
          timeline.push("email");
          sent.push(message);
          if (sendImpl) return sendImpl(message, sent.length);
          return { data: { id: `email_${sent.length}` }, error: null };
        },
      };
    }
  }

  const mockRequire = (id) => {
    if (id === "next/server") {
      return { NextResponse: { json: (body, init = {}) => Response.json(body, init) } };
    }
    if (id === "resend") return { Resend: MockResend };
    if (id === "node:crypto") return { createHash, randomUUID };
    if (id === "@/lib/public-audit") {
      return {
        publicAuditConfig: () => ({ reportTtlMs: 86_400_000 }),
        publicAuditStore: () => ({
          getReport: getReportImpl ?? (async () => reportForToken),
        }),
      };
    }
    if (id === "@/lib/email") {
      return {
        renderPublicAuditLeadEmail: () => "<p>team</p>",
        renderPublicAuditReportEmail: () => "<p>prospect</p>",
      };
    }
    if (id === "@/lib/site") {
      return { site: { email: "hello@queryclear.com", url: "https://www.queryclear.com" } };
    }
    if (id === "@/lib/operations-store") return { operationsStore: () => store };
    if (id === "@/lib/json-request") return loadPureModule(jsonRequestModulePath);
    if (id === "@/lib/public-audit-url") return loadPureModule(publicAuditUrlModulePath);
    throw new Error(`Unexpected import: ${id}`);
  };
  new Function("module", "exports", "require", "console", output)(
    moduleObj,
    moduleObj.exports,
    mockRequire,
    console,
  );
  return { deliveryUpdates, route: moduleObj.exports, sent, stored, timeline };
}

function clearEmailEnv() {
  delete process.env.RESEND_API_KEY;
  delete process.env.LEAD_TO;
  delete process.env.LEAD_FROM;
}

test("capacity-gate lead is persisted before success even when email is not configured", async () => {
  clearEmailEnv();
  const { deliveryUpdates, route, stored } = loadRoute();
  const response = await route.POST(request({ email: "owner@example.com", domainUrl: "example.com" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { queued: true });
  assert.equal(stored.length, 1);
  assert.equal(stored[0].kind, "public-audit");
  assert.equal(stored[0].websiteHost, "example.com");
  assert.equal(deliveryUpdates[0].delivery.team, "not_configured");
  assert.equal(deliveryUpdates[0].delivery.prospect, "not_applicable");
});

test("report unlock persists before team and prospect notifications", async () => {
  process.env.RESEND_API_KEY = "test_key";
  const { route, sent, stored, timeline } = loadRoute({ reportForToken: report });
  const response = await route.POST(
    request({ email: "owner@example.com", token: validToken, domainUrl: "https://ignored.example" }),
  );
  assert.equal(response.status, 200);
  assert.equal(stored.length, 1);
  assert.equal(sent.length, 2);
  assert.equal(timeline[0], "saved");
  assert.deepEqual((await response.json()).report, report);
  assert.equal(stored[0].payload.reportToken, undefined);
  assert.equal(stored[0].payload.reportUnlocked, true);
  assert.match(stored[0].payload.reportReference, /^[0-9a-f]{16}$/);
});

test("report token is a UUID and a report can be claimed only once under concurrent requests", async () => {
  clearEmailEnv();
  const { route, stored } = loadRoute({ reportForToken: report });
  const invalid = await route.POST(request({ email: "owner@example.com", token: "report-token" }));
  assert.equal(invalid.status, 400);

  const [first, second] = await Promise.all([
    route.POST(request({ email: "one@example.com", token: validToken })),
    route.POST(request({ email: "two@example.com", token: validToken })),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
  assert.equal(stored.length, 1);
});

test("report lookup or claim storage errors fail closed", async () => {
  clearEmailEnv();
  const { route, stored } = loadRoute({
    reportForToken: report,
    claimAndSaveImpl: async () => { throw new Error("redis unavailable"); },
  });
  const response = await route.POST(request({ email: "owner@example.com", token: validToken }));
  assert.equal(response.status, 503);
  assert.equal(stored.length, 0);
});

test("a failed durable save does not consume the one-time report claim", async () => {
  clearEmailEnv();
  let attempts = 0;
  const { route } = loadRoute({
    reportForToken: report,
    saveImpl: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("redis interrupted");
    },
  });
  const failed = await route.POST(request({ email: "owner@example.com", token: validToken }));
  const retried = await route.POST(request({ email: "owner@example.com", token: validToken }));
  assert.equal(failed.status, 503);
  assert.equal(retried.status, 200);
  assert.equal(attempts, 2);
});

test("durable save failure returns 503 and sends no notification", async () => {
  process.env.RESEND_API_KEY = "test_key";
  const { route, sent } = loadRoute({ saveImpl: async () => { throw new Error("redis down"); } });
  const response = await route.POST(request({ email: "owner@example.com", domainUrl: "example.com" }));
  assert.equal(response.status, 503);
  assert.equal(sent.length, 0);
});

test("distributed limiter fails closed before accepting the lead", async () => {
  clearEmailEnv();
  const { route, stored } = loadRoute({
    rateLimitImpl: async () => ({ allowed: false, retryAfterMs: 10_000 }),
  });
  const response = await route.POST(request({ email: "owner@example.com", domainUrl: "example.com" }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "10");
  assert.equal(stored.length, 0);
});

test("capacity-gate domain rejects unsafe URL schemes", async () => {
  clearEmailEnv();
  const { route, stored } = loadRoute();
  const response = await route.POST(
    request({ email: "owner@example.com", domainUrl: "javascript:alert(1)" }),
  );
  assert.equal(response.status, 400);
  assert.equal(stored.length, 0);
});

test("request guard rejects wrong media types and oversized JSON", async () => {
  clearEmailEnv();
  const { route, stored } = loadRoute();
  const wrongType = await route.POST(
    request({ email: "owner@example.com", domainUrl: "example.com" }, undefined, "text/plain"),
  );
  const oversized = await route.POST(
    request({ email: "owner@example.com", domainUrl: "example.com", padding: "x".repeat(9_000) }),
  );
  assert.equal(wrongType.status, 415);
  assert.equal(oversized.status, 413);
  assert.equal(stored.length, 0);
});

test("stored attribution strips credentials, fragments, and non-UTM query data", async () => {
  clearEmailEnv();
  const { route, stored } = loadRoute();
  const response = await route.POST(request({
    email: "owner@example.com",
    domainUrl: "example.com",
    attribution: {
      referrer: "https://user:secret@referrer.example/path?access=bearer#fragment",
      landingPath: "/free-audit?access=bearer&utm_source=linkedin#fragment",
      utmSource: "linkedin",
    },
  }));
  assert.equal(response.status, 200);
  assert.equal(stored[0].payload.attribution.referrer, "https://referrer.example/path");
  assert.equal(stored[0].payload.attribution.landingPath, "/free-audit");
  assert.equal(stored[0].payload.attribution.utmSource, "linkedin");
});
