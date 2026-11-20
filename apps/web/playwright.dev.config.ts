import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/dev-e2e",
  outputDir: "./test-results/dev",
  workers: 1,
  timeout: 30000,
  use: {
    headless: true,
    trace: "off",
    screenshot: "off",
    launchOptions: process.env.QC_CHROME
      ? { executablePath: process.env.QC_CHROME }
      : { channel: "chrome" },
  },
});
