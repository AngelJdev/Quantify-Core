import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: "http://127.0.0.1:4180",
    headless: true,
    launchOptions: process.env.QC_CHROME
      ? { executablePath: process.env.QC_CHROME }
      : { channel: "chrome" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4180 --strictPort",
    url: "http://127.0.0.1:4180",
    reuseExistingServer: false,
  },
});
