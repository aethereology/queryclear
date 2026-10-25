import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("methodology is discoverable, explicit about limits, accessible and mobile friendly", async ({ page }) => {
  await page.goto("/free-audit");
  await page.getByRole("link", { name: "Read our audit methodology." }).click();
  await expect(page).toHaveURL(/\/audit-methodology$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Know what your audit can tell you.");
  await expect(page.getByText("There is no overall score", { exact: false })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/audit-methodology$/);
  await expect(page.getByRole("link", { name: "Run a free preview" })).toHaveAttribute("href", "/free-audit");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
