import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const report = {
  methodology: { version: "free-readiness-preview-v2", crawled_page_limit: 5, visibility_method: "modeled-scenario", samples_per_query: 1 },
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
const summary = { token: "10000000-0000-4000-8000-000000000001", domainUrl: report.domain_url, pageTitle: report.page_title, technicalIssues: 1, measuredChecksWithoutCitation: 0, modeledSamplesWithoutBrand: 1, recommendations: 2, topFindings: [{ title: "Missing primary heading", severity: "medium" }] };

test("complete preview, unlock, evidence, review checklist and export", async ({ page }) => {
  await page.route("**/api/public/audit", route => route.fulfill({ json: { summary } }));
  await page.route("**/api/public/lead", route => route.fulfill({ json: { report, emailDelivery: "sent" } }));
  await page.goto("/free-audit");
  await page.getByRole("textbox", { name: "Your website" }).fill("example.com");
  await page.getByRole("button", { name: "Run free preview" }).click();
  await expect(page.getByRole("region", { name: "Audit preview result" })).toBeFocused();
  await page.getByRole("textbox", { name: "Work email" }).fill("qa@example.com");
  await page.getByRole("button", { name: "Deliver my preview" }).click();
  const full = page.getByRole("region", { name: "Full automated audit preview" });
  await expect(full).toBeFocused();
  await expect(page.getByText("The email provider accepted your copy", { exact: false })).toBeVisible();
  await page.getByText("Methodology and sample size", { exact: true }).click();
  await expect(page.getByText("free-readiness-preview-v2", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the checks, priorities, and limitations" })).toHaveAttribute("href", "/audit-methodology");
  await page.getByRole("checkbox", { name: "Mark action 1 reviewed" }).check();
  await expect(page.getByText("1 of 2 reviewed", { exact: true })).toBeVisible();
  await page.getByLabel("Show actions").selectOption("estimated");
  await expect(page.getByRole("heading", { name: "Add a primary heading" })).toBeHidden();
  await page.getByLabel("Show actions").selectOption("all");
  await page.getByText("View crawled pages", { exact: true }).click();
  await expect(page.getByText("https://example.com/services", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show draft" }).click();
  await expect(page.getByRole("button", { name: "Hide draft" })).toHaveAttribute("aria-expanded", "true");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe("queryclear-example.com.txt");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: "Hide draft" }).click();
  await page.getByLabel("Show actions").selectOption("estimated");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Add a primary heading" })).toBeVisible();
  await expect(page.getByText("technical:missing_h1 (https://example.com/)", { exact: true })).toBeVisible();
  await expect(page.locator(".audit-draft")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download report", exact: true })).toBeHidden();
});

test("runtime failure is announced, focused, and can be retried", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/public/audit", route => route.fulfill(++attempts === 1 ? { status: 503, json: { error: "Please try again.", requestId: "support-reference" } } : { json: { summary } }));
  await page.goto("/free-audit");
  const input = page.getByRole("textbox", { name: "Your website" });
  await input.fill("example.com"); await page.getByRole("button", { name: "Run free preview" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "support-reference" })).toBeVisible();
  await expect(input).toBeFocused(); await expect(input).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Run free preview" }).click();
  await expect(page.getByRole("textbox", { name: "Work email" })).toBeVisible();
});

test("email failure keeps the full report usable", async ({ page }) => {
  await page.route("**/api/public/audit", route => route.fulfill({ json: { summary } }));
  await page.route("**/api/public/lead", route => route.fulfill({ json: { report, emailDelivery: "failed" } }));
  await page.goto("/free-audit");
  await page.getByRole("textbox", { name: "Your website" }).fill("example.com");
  await page.getByRole("button", { name: "Run free preview" }).click();
  await page.getByRole("textbox", { name: "Work email" }).fill("qa@example.com");
  await page.getByRole("button", { name: "Deliver my preview" }).click();
  await expect(page.getByText("we could not confirm email sending", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download report", exact: true })).toBeVisible();
});

for (const path of ["/", "/free-audit", "/ai-visibility-audit", "/contact"]) {
  test(`public page ${path} metadata, responsive layout and accessibility`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/www.queryclear.com/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  });
}

test("blocked browser storage does not break the audit form", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Storage.prototype, "getItem", { value() { throw new Error("Storage blocked"); } }));
  await page.route("**/api/public/audit", route => route.fulfill({ json: { summary } }));
  await page.goto("/free-audit");
  await page.getByRole("textbox", { name: "Your website" }).fill("example.com");
  await page.getByRole("button", { name: "Run free preview" }).click();
  await expect(page.getByRole("textbox", { name: "Work email" })).toBeVisible();
});

test("network retry reuses its audit attempt while a completed new run gets a fresh ID", async ({ page }) => {
  const attempts: string[] = [];
  await page.route("**/api/public/audit", async route => {
    attempts.push(route.request().headers()["x-audit-attempt"]);
    if (attempts.length === 1) await route.abort("failed");
    else await route.fulfill({ json: { summary } });
  });
  await page.goto("/free-audit");
  await page.getByRole("textbox", { name: "Your website" }).fill("example.com");
  await page.getByRole("button", { name: "Run free preview" }).click();
  await expect(page.getByRole("button", { name: "Run free preview" })).toBeEnabled();
  await page.getByRole("button", { name: "Run free preview" }).click();
  await expect(page.getByRole("region", { name: "Audit preview result" })).toBeVisible();
  expect(attempts[0]).toMatch(/^[a-f0-9-]{36}$/);
  expect(attempts[1]).toBe(attempts[0]);
  await page.getByRole("button", { name: "Run free preview" }).click();
  await expect(page.getByRole("region", { name: "Audit preview result" })).toBeVisible();
  expect(attempts).toHaveLength(3);
  expect(attempts[2]).not.toBe(attempts[1]);
});
