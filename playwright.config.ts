import { defineConfig } from "@playwright/test";

/**
 * E2E memakai Google Chrome yang sudah terpasang (channel "chrome"), jadi tidak perlu mengunduh browser.
 * Stack (mongod sementara + build terpisah + server) dihidupkan oleh globalSetup.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/support/pw-global.ts",
  workers: 1, // satu database uji bersama
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { channel: "chrome", reducedMotion: "reduce", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", testIgnore: /mobile\.spec\.ts/, use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile", testMatch: /mobile\.spec\.ts/, use: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
});
