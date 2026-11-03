import { defineConfig, devices } from "@playwright/test";
import { testDatabaseUrl } from "./scripts/test-env.mjs";

const databaseUrl = testDatabaseUrl();
const origin = "http://127.0.0.1:3100";
const channel =
  process.env.PLAYWRIGHT_CHANNEL ||
  (process.platform === "win32" ? "msedge" : undefined);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  globalSetup: "./e2e/setup.ts",
  timeout: 30_000,
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "artifacts/evidence/member-a/browser-results.json" },
    ],
  ],
  outputDir: "test-results",
  use: {
    baseURL: origin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { channel, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        channel,
        defaultBrowserType: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev:server",
      url: "http://127.0.0.1:5100/api/health",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: databaseUrl,
        NODE_ENV: "test",
        PORT: "5100",
        APP_ORIGIN: origin,
      },
    },
    {
      command: "npm run dev:client -- --port 3100",
      url: origin,
      reuseExistingServer: false,
      env: { API_PROXY_TARGET: "http://127.0.0.1:5100" },
    },
  ],
});
