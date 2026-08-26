import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routePath = path.resolve(__dirname, "..", "app", "api", "reports", "access", "route.ts");

function loadRoute(valid) {
  const output = ts.transpileModule(fs.readFileSync(routePath, "utf8"), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: routePath,
  }).outputText;
  const cookieWrites = [];
  const mockResponse = {
    json: (body, init = {}) => Response.json(body, init),
    redirect: (url, status) => {
      const response = new Response(null, { status, headers: { location: String(url) } });
      response.cookies = { set: (...args) => cookieWrites.push(args) };
      return response;
    },
  };
  const moduleObj = { exports: {} };
  const mockRequire = (id) => {
    if (id === "next/server") return { NextResponse: mockResponse };
    if (id === "@/lib/report-access") {
      return {
        reportAccessCookieName: () => "qc_report_123",
        reportAccessTokenExpiresAt: () => 2_000_000_000,
        verifyReportAccessToken: () => valid,
      };
    }
    if (id === "@/lib/site") return { site: { url: "https://www.queryclear.com" } };
    throw new Error(`Unexpected import: ${id}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, mockRequire);
  return { cookieWrites, route: moduleObj.exports };
}

test("valid signed report link becomes a scoped HttpOnly cookie and clean redirect", async () => {
  const { cookieWrites, route } = loadRoute(true);
  const response = await route.GET(
    new Request("https://www.queryclear.com/api/reports/access?slug=client-report-123&access=v1.token"),
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "https://www.queryclear.com/reports/client-report-123");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(cookieWrites.length, 1);
  assert.equal(cookieWrites[0][0], "qc_report_123");
  assert.equal(cookieWrites[0][1], "v1.token");
  assert.equal(cookieWrites[0][2].httpOnly, true);
  assert.equal(cookieWrites[0][2].path, "/reports/client-report-123");
});

test("invalid report link fails closed without a cookie or redirect", async () => {
  const { cookieWrites, route } = loadRoute(false);
  const response = await route.GET(
    new Request("https://www.queryclear.com/api/reports/access?slug=client-report-123&access=bad"),
  );
  assert.equal(response.status, 404);
  assert.equal(cookieWrites.length, 0);
  assert.equal(response.headers.get("cache-control").includes("no-store"), true);
});
