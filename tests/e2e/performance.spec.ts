import { test, expect } from "@playwright/test";

test("initial route payloads stay within the documented size budgets", async ({ request, baseURL }) => {
  for (const path of ["/free-audit", "/audit-methodology", "/admin/audits"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]).filter(src => src.startsWith("/_next/")))];
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.length).toBeLessThanOrEqual(14);
    let bytes = 0;
    for (const src of scripts) {
      const script = await request.get(new URL(src, baseURL).toString());
      expect(script.status()).toBe(200);
      bytes += (await script.body()).byteLength;
    }
    console.info(JSON.stringify({ path, htmlBytes: Buffer.byteLength(html), initialScriptBytes: bytes, initialScripts: scripts.length }));
    expect(Buffer.byteLength(html), path + " HTML budget").toBeLessThanOrEqual(110 * 1024);
    expect(bytes, path + " initial JavaScript budget").toBeLessThanOrEqual(700 * 1024);
  }
});

test("private workspaces do not mount the decorative animation canvas", async ({ page }) => {
  await page.goto("/admin/audits");
  await expect(page.getByRole("heading", { name: "Owner access required" })).toBeVisible();
  await expect(page.locator(".site-background canvas")).toHaveCount(0);
});

test("reduced-motion preference changes stop continuous background painting", async ({ page }) => {
  await page.addInitScript(() => {
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    Object.assign(window, { backgroundPaints: 0 });
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.closest(".site-background")) (window as unknown as { backgroundPaints: number }).backgroundPaints++;
      return clear.apply(this, args);
    };
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/audit-methodology");
  const paints = () => page.evaluate(() => (window as unknown as { backgroundPaints: number }).backgroundPaints);
  await expect.poll(paints).toBeGreaterThan(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const stoppedAt = await paints();
  await page.waitForTimeout(200);
  expect(await paints()).toBe(stoppedAt);
});

test("touch devices get a static background", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      Object.assign(window, { backgroundPaints: 0 });
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.closest(".site-background")) (window as unknown as { backgroundPaints: number }).backgroundPaints++;
        return clear.apply(this, args);
      };
    });
    await page.goto("/audit-methodology");
    const paints = () => page.evaluate(() => (window as unknown as { backgroundPaints: number }).backgroundPaints);
    await expect.poll(paints).toBeGreaterThan(0);
    const first = await paints();
    await page.waitForTimeout(200);
    expect(await paints()).toBe(first);
  } finally { await context.close(); }
});
