import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
import { testDatabaseUrl } from "./scripts/test-env.mjs";

const origin = "http://127.0.0.1:3310";
export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: origin },
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "artifacts/evidence/member-b/browser-results.json" },
    ],
  ],
  webServer: [
    {
      command: "npm run dev:server",
      url: "http://127.0.0.1:5310/api/health",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: testDatabaseUrl(),
        NODE_ENV: "test",
        PORT: "5310",
        APP_ORIGIN: origin,
      },
    },
    {
      command: "npm run dev:client -- --port 3310",
      url: origin,
      reuseExistingServer: false,
      env: { API_PROXY_TARGET: "http://127.0.0.1:5310" },
    },
  ],
});
