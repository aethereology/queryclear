import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", reducedMotion: "reduce" },
  projects: [360, 768, 1280].map(width => ({ name: `chromium-${width}`, use: { browserName: "chromium", viewport: { width, height: 900 } } })),
  webServer: { env: { SOCIAL_ADMIN_SECRET: "queryclear-browser-test-only-secret-000000" }, command: "npm run start -- --hostname 127.0.0.1", url: "http://127.0.0.1:3000/free-audit", reuseExistingServer: !process.env.CI, timeout: 60000 },
});
