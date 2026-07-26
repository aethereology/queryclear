// ensureReportLink is what keeps a nurture follow-up's report link alive for the
// whole ~465-day cadence. Three paths matter: refresh a live token, re-mint a
// lapsed one, and fail honestly (ok:false → QA quarantine) when neither works.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const SITE = { url: "https://www.queryclear.com", name: "queryclear" };

// Build lib/outreach.ts with a scriptable report cache + audit runner.
function loadOutreach({ reports = new Map(), runAudit } = {}) {
  const calls = { audits: 0, puts: [] };
  const store = {
    async getReport(token) {
      return reports.get(token) ?? null;
    },
    async putReport(token, report, ttlMs) {
      reports.set(token, report);
      calls.puts.push({ token, ttlMs });
    },
  };

  const modPath = path.join(projectRoot, "lib/outreach.ts");
  const output = ts.transpileModule(fs.readFileSync(modPath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;

  let n = 0;
  const stubs = {
    "node:crypto": { randomUUID: () => `minted-${++n}` },
    "./agent-runtime": {
      runAudit:
        runAudit ??
        (async () => {
          calls.audits++;
          return { domain_url: "biz.com", score: 41 };
        }),
    },
    "./email": {
      renderOutreachAuditEmail: () => "<p>audit</p>",
      renderOutreachFollowupEmail: (kind, ctx) => `<p>${kind} → ${ctx.reportUrl}</p>`,
    },
    "./public-audit": { publicAuditStore: () => store },
    "./site": { site: SITE },
  };

  const moduleObj = { exports: {} };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, (s) => {
    if (s in stubs) return stubs[s];
    throw new Error(`Unexpected import: ${s}`);
  });
  return { mod: moduleObj.exports, calls, reports };
}

const contact = (over = {}) => ({
  email: "a@biz.com",
  business: "Biz FL",
  domain: "biz.com",
  status: "cold",
  touches: [{ n: 1, type: "cold-audit", at: "2026-06-22T12:00:00.000Z", reportToken: "tok-1" }],
  ...over,
});

test("a live report link is reused and its TTL slid forward", async () => {
  const reports = new Map([["tok-1", { domain_url: "biz.com" }]]);
  const { mod, calls } = loadOutreach({ reports });

  const link = await mod.ensureReportLink(contact());

  assert.equal(link.ok, true);
  assert.equal(link.token, "tok-1", "same token — no needless re-mint");
  assert.equal(link.reportUrl, `${SITE.url}/r/tok-1`);
  assert.equal(calls.audits, 0, "no audit spend on the happy path");
  assert.equal(calls.puts.length, 1, "TTL was re-written (sliding window)");
  assert.ok(calls.puts[0].ttlMs > 0);
});

test("a lapsed report link is re-minted with a fresh audit", async () => {
  const { mod, calls } = loadOutreach({ reports: new Map() }); // tok-1 expired away

  const link = await mod.ensureReportLink(contact());

  assert.equal(link.ok, true, "the follow-up can still go out");
  assert.equal(link.token, "minted-1", "a new token");
  assert.notEqual(link.token, "tok-1");
  assert.equal(link.reportUrl, `${SITE.url}/r/minted-1`);
  assert.equal(calls.audits, 1, "exactly one re-audit");
});

test("a contact with no domain fails honestly instead of linking a dead report", async () => {
  const { mod, calls } = loadOutreach({ reports: new Map() });

  const link = await mod.ensureReportLink(contact({ domain: undefined }));

  assert.equal(link.ok, false, "QA must quarantine this, not send it");
  assert.equal(link.token, undefined);
  assert.equal(link.reportUrl, `${SITE.url}/free-audit`);
  assert.equal(calls.audits, 0);
});

test("an audit failure during re-mint fails closed", async () => {
  const { mod } = loadOutreach({
    reports: new Map(),
    runAudit: async () => {
      throw new Error("agent-runtime down");
    },
  });

  const link = await mod.ensureReportLink(contact());

  assert.equal(link.ok, false, "never claims a working link when the audit died");
  assert.equal(link.reportUrl, `${SITE.url}/free-audit`);
});

test("buildFollowupEmail uses the resolved link when one is passed", async () => {
  const { mod } = loadOutreach();
  const step = { n: 2, type: "bump", afterDays: 4, arm: "cold" };

  const fresh = mod.buildFollowupEmail(contact(), step, `${SITE.url}/r/minted-9`);
  assert.match(fresh.html, /r\/minted-9/, "the re-minted URL wins");

  const legacy = mod.buildFollowupEmail(contact(), step);
  assert.match(legacy.html, /r\/tok-1/, "omitting it keeps the read-only preview behaviour");
});
