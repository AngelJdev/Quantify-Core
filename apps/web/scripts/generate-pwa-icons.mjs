// Export the existing vector identity; no parallel logo source.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const browser = await chromium.launch(process.env.QC_CHROME
  ? { executablePath: process.env.QC_CHROME }
  : { channel: "chrome" });
try {
  const page = await browser.newPage();
  const svg = readFileSync(new URL("../public/icon.svg", import.meta.url), "utf8")
    .replace("<svg ", '<svg width="512" height="512" ');
  for (const [name, size, maskable] of [
    ["pwa-192.png", 192, false],
    ["pwa-512.png", 512, false],
    ["pwa-maskable-512.png", 512, true],
    ["apple-touch-icon.png", 180, false],
  ]) {
    const data = await page.evaluate(async ({ svg, size, maskable }) => {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#275BC0";
      ctx.fillRect(0, 0, size, size);
      // Keep all identifying artwork within the maskable safe circle.
      const inset = maskable ? size * 0.15 : 0;
      ctx.drawImage(img, inset, inset, size - inset * 2, size - inset * 2);
      return canvas.toDataURL("image/png").split(",")[1];
    }, { svg, size, maskable });
    writeFileSync(new URL(`../public/${name}`, import.meta.url), Buffer.from(data, "base64"));
  }
} finally {
  await browser.close();
}
