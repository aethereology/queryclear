import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function fillInquiry(page: import('@playwright/test').Page) {
  await page.getByLabel('Your name').fill('Test Owner');
  await page.getByLabel('Work email').fill('qa@example.com');
  await page.getByLabel('Website URL').fill('example.com');
  await page.getByLabel('Business name').fill('Example business');
}

test('inquiry keeps inputs, focuses the error, and recovers from a non-JSON failure', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/lead', route => route.fulfill(++attempts === 1
    ? { status: 502, contentType: 'text/html', body: '<h1>Bad gateway</h1>' }
    : { json: { ok: true } }));
  await page.goto('/contact');
  await fillInquiry(page);
  await page.getByRole('button', { name: 'Send my project details' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'could not confirm' })).toBeFocused();
  await expect(page.getByLabel('Business name')).toHaveValue('Example business');
  await page.getByRole('button', { name: 'Send my project details' }).click();
  await expect(page).toHaveURL(/\/thank-you$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('received your request');
});

test('invalid website receives keyboard focus without submitting the inquiry', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/lead', route => { requests++; return route.fulfill({ json: { ok: true } }); });
  await page.goto('/contact'); await fillInquiry(page);
  await page.getByLabel('Website URL').fill('https://user:password@example.com');
  await page.getByRole('button', { name: 'Send my project details' }).click();
  await expect(page.getByLabel('Website URL')).toBeFocused();
  await expect(page.getByLabel('Website URL')).toHaveAttribute('aria-invalid', 'true');
  expect(requests).toBe(0);
});

test('expired report offers a private accessible recovery path', async ({ page }) => {
  const response = await page.goto('/r/00000000-0000-4000-8000-000000000000');
  expect(response?.headers()['referrer-policy']).toBe('no-referrer');
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This report link is no longer available.');
  await expect(page.getByRole('link', { name: 'Run a fresh preview', exact: true })).toHaveAttribute('href', '/free-audit');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
});
