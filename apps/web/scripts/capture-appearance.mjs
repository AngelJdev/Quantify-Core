// Public/demo screenshots only. Isolated browser contexts never load a real session.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const base = process.env.QC_CAPTURE_BASE || 'http://localhost:5173';
const output = new URL('../docs/evidencias/apariencia-2026-11-20/', import.meta.url);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch(process.env.QC_CHROME ? { executablePath: process.env.QC_CHROME } : { channel: 'chrome' });
try {
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
    try {
      const page = await context.newPage();
      await page.goto(`${base}/hoy`);
      await page.getByRole('button', { name: 'Personalizar apariencia' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /Liquid Glass/ }).click();
      await page.evaluate(() => document.fonts.ready);
      if (colorScheme === 'light') await page.screenshot({ path: fileURLToPath(new URL('preferencias.png', output)) });
      await page.keyboard.press('Escape');
      await page.screenshot({ path: fileURLToPath(new URL(`dashboard-${colorScheme}.png`, output)) });
      if (colorScheme === 'dark') {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: fileURLToPath(new URL('movil-dark.png', output)) });
      }
    } finally { await context.close(); }
  }
  console.log('Four public/demo appearance screenshots captured.');
} finally { await browser.close(); }
