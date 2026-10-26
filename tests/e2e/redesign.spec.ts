import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = ["/pricing", "/about", "/ai-search-ready-website", "/ai-visibility-stack", "/audit", "/care-plan", "/geo-audit", "/llms-txt-for-businesses", "/local-ai-search-optimization", "/med-spa-ai-search-optimization", "/privacy", "/schema-for-ai-search", "/scorecard", "/terms", "/website-upgrade"];
for (const path of routes) test(`redesign route ${path} is readable, indexed and accessible`, async ({ page }) => {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.queryclear.com" + path);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  const layout = await page.evaluate(() => ({ fits: document.documentElement.scrollWidth <= innerWidth, overflow: [...document.querySelectorAll("main *")].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(-12).map(el => ({tag:el.tagName,text:el.textContent?.slice(0,100),right:el.getBoundingClientRect().right})) }));
  expect(layout.fits, JSON.stringify(layout.overflow)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
test("navigation reaches pricing and methodology with keyboard and mobile controls", async ({ page }) => {
  await page.goto("/");
  const mobile = page.getByRole("button", {name:"Open menu"});
  if(await mobile.isVisible()) {
    await mobile.click();
    await expect(page.getByRole("navigation", {name:"Mobile"})).toBeVisible();
    await page.getByRole("navigation", {name:"Mobile"}).getByRole("link",{name:"Pricing",exact:true}).click();
  } else await page.getByRole("navigation", {name:"Primary"}).getByRole("link",{name:"Pricing",exact:true}).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole("heading", {name:"Free readiness preview",exact:true})).toBeVisible();
  await expect(page.getByRole("heading", {name:"AI Search Audit",exact:true})).toBeVisible();
});
for(const path of ["/", "/free-audit", "/pricing", "/audit", "/contact"]) test(`visual review capture ${path}`, async ({page}, testInfo) => {
  await page.goto(path);
  await expect(page.locator("h1")).toBeVisible();
  await testInfo.attach("page", {body: await page.screenshot({fullPage:true}), contentType:"image/png"});
});

test("sample automated report is explicitly fictional and uses working report controls", async ({ page }) => {
 await page.goto("/audit?view=automated");
 await expect(page.getByText("Fictional example · No crawl or model query performed",{exact:true})).toBeVisible();
 await page.getByRole("navigation",{name:"Report sections"}).getByRole("link",{name:"Technical findings",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Missing primary heading",exact:true})).toBeVisible();
 await page.getByRole("checkbox",{name:"Mark action 1 reviewed"}).check();
 await expect(page.getByText("1 of 2 reviewed",{exact:true})).toBeVisible();
 expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
});
