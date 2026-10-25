import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac } from "node:crypto";
const report = {
  domain_url: "https://example.com/", page_title: "Example business",
  audited_at: "2026-10-25T00:00:00.000Z", crawled_urls: ["https://example.com/", "https://example.com/services"],
  findings: [{ code: "missing_h1", severity: "medium", title: "Missing primary heading", detail: "No H1 in fetched HTML.", recommendation: "Add a descriptive primary heading.", url: "https://example.com/" }],
  queries: [{ engine: "model", query: "Find a local service", cited_count: 0, samples: 1, citation_frequency: 0, confidence_low: 0, confidence_high: .79, measured: false }],
  recommendations: [
    { rank: 1, priority: 2, kind: "technical", title: "Add a primary heading", rationale: "No H1 was observed.", action: "Describe the main service in an H1.", provenance: "measured", evidence: "technical:missing_h1 (https://example.com/)" },
    { rank: 2, priority: 3, kind: "content", title: "Review a buyer question", rationale: "A modeled scenario suggested a possible gap.", action: "Verify business facts first.", provenance: "estimated", evidence: "modeled-scenario:Find a local service" },
  ],
  sample_draft: { id: "draft", title: "Illustrative draft", body: "Verify all business facts before using this draft.", status: "pending_approval" }, detected_voice: null,
};

async function signIn(context: import("@playwright/test").BrowserContext) {
  const payload = `${Math.floor(Date.now() / 1000) + 3600}.browser-test`;
  const signature = createHmac("sha256", "queryclear-browser-test-only-secret-000000").update(payload).digest("base64url");
  await context.addCookies([{ name: "social_admin", value: `${payload}.${signature}`, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
}
test("owner workspace requires signed session and denies API access", async ({ page }) => {
  await page.goto("/admin/audits");
  await expect(page.getByRole("heading", { name: "Owner access required" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run audit" })).toHaveCount(0);
  expect((await page.request.get("/api/admin/audits")).status()).toBe(401);
  expect((await page.request.post("/api/admin/audits", { data: { domainUrl: "https://example.com" } })).status()).toBe(401);
});
test("owner runs, revisits and downloads a report with accessible mobile layout", async ({ page, context }) => {
  await signIn(context);
  const entry = { token: "owner-report", domainUrl: report.domain_url, createdAt: Date.now(), expiresAt: Date.now() + 86400000 };
  await page.route("**/api/admin/audits*", async route => {
    if (route.request().method() === "POST") {
      expect(route.request().headers()["x-owner-csrf"]).toBeTruthy();
      await route.fulfill({ json: { report, entry, historySaved: true } });
    } else await route.fulfill({ json: route.request().url().includes("token=") ? { report } : { history: [] } });
  });
  await page.goto("/admin/audits");
  await page.getByLabel("Website URL").fill("example.com");
  await page.getByRole("button", { name: "Run audit", exact: true }).click();
  await expect(page.getByLabel("Audit results", { exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Add a primary heading" })).toBeVisible();
  await page.getByRole("button", { name: /Open report/ }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("queryclear-example.com.txt");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Run audit", exact: true })).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
test("owner session expiration preserves entered URL and shows recoverable error", async ({ page, context }) => {
  await signIn(context);
  await page.route("**/api/admin/audits", route => route.fulfill(route.request().method() === "POST" ? { status: 401, json: { error: "Your session has expired. Sign in again." } } : { json: { history: [] } }));
  await page.goto("/admin/audits");
  await page.getByLabel("Website URL").fill("example.com");
  await page.getByRole("button", { name: "Run audit", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Audit request error" })).toContainText("session has expired");
  await expect(page.getByLabel("Website URL")).toHaveValue("example.com");
  await expect(page.getByRole("alert", { name: "Audit request error" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Return to sign in" })).toHaveAttribute("href", "/admin/audits");
});

test("history errors can be refreshed, searched and expired reports removed", async ({ page, context }) => {
  await signIn(context);
  let reads = 0;
  const entries = [
    { token: "alpha", domainUrl: "https://alpha.example", createdAt: Date.now(), expiresAt: Date.now() + 60000 },
    { token: "beta", domainUrl: "https://beta.example", createdAt: Date.now(), expiresAt: Date.now() + 60000 },
  ];
  await page.route("**/api/admin/audits*", route => {
    if (route.request().url().includes("token=")) return route.fulfill({ status: 404, json: { error: "This report has expired. Run a fresh audit." } });
    reads++;
    return route.fulfill(reads === 1 ? { status: 503, json: { error: "Unavailable" } } : { json: { history: entries } });
  });
  await page.goto("/admin/audits");
  await expect(page.getByRole("alert").filter({ hasText: "Recent audits could not be loaded" })).toBeVisible();
  await expect(page.getByText("No recent audits to show.", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh history" }).click();
  await expect(page.getByRole("button", { name: /Open report/ })).toHaveCount(2);
  await page.getByLabel("Search recent audits").fill("ALPHA");
  await expect(page.getByRole("button", { name: /Open report/ })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /alpha.example/ })).toContainText("Expires");
  await page.getByRole("button", { name: /alpha.example/ }).click();
  await expect(page.getByRole("alert", { name: "Audit request error" })).toBeFocused();
  await expect(page.getByText("No recent audits match this address.")).toBeVisible();
});

test("history requests time out and can be retried without reloading", async ({ page, context }) => {
  await signIn(context);
  await page.clock.install();
  await page.route("**/api/admin/audits", () => {});
  await page.goto("/admin/audits");
  await expect(page.getByText("Loading recent audits…")).toBeVisible();
  await page.clock.fastForward(16000);
  await expect(page.getByRole("alert").filter({ hasText: "Recent audits could not be loaded" })).toBeVisible();
  await page.unroute("**/api/admin/audits");
  await page.route("**/api/admin/audits", route => route.fulfill({ json: { history: [] } }));
  await page.getByRole("button", { name: "Refresh history" }).click();
  await expect(page.getByText("No recent audits to show.", { exact: false })).toBeVisible();
});

test("sign-out clears the owner workspace and denies subsequent private API reads", async ({ page, context }) => {
  await signIn(context);
  await page.route("**/api/admin/audits", route => route.fulfill({ json: { history: [] } }));
  await page.goto("/admin/audits");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Owner access required" })).toBeVisible();
  expect((await page.request.get("/api/admin/audits")).status()).toBe(401);
});
