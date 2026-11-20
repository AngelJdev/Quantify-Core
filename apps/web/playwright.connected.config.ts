import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/connected-e2e",
  outputDir: "./test-results/connected",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173", headless: true, trace: "off", screenshot: "off", video: "off",
    launchOptions: process.env.QC_CHROME ? { executablePath: process.env.QC_CHROME } : { channel: "chrome" },
  },
  webServer: {
    command: "npm run dev -- --host localhost --port 5173 --strictPort",
    url: "http://localhost:5173", reuseExistingServer: false,
    env: { VITE_API_BASE_URL: "http://localhost:3000/api/v1", VITE_OIDC_ISSUER: "http://localhost:8180/realms/quantify", VITE_OIDC_CLIENT_ID: "quantify-web" },
  },
});
