// Flutter Web review at mobile dimensions; not an Android-device benchmark.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:8788/';
const output = new URL('../docs/evidencias/prototipo-v2-2026-11-20/', import.meta.url);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [], privateRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/api\/|\/realms\//.test(request.url())) privateRequests.push('unexpected-private-request'); });
  await page.goto(base);
  await page.waitForSelector('flutter-view');
  await page.getByRole('button', { name: 'Enable accessibility' }).evaluate(element => element.click());
  await expect(page.getByRole('button', { name: /Explorar/ })).toBeVisible();
  const capture = async name => {
    // Flutter rasterizes separately from DOM semantics; allow the next raster frames.
    await page.waitForTimeout(500);
    await page.screenshot({ path: fileURLToPath(new URL(name, output)) });
  };
  await capture('bienvenida.png');
  await page.getByRole('button', { name: /Explorar/ }).click();
  await expect(page.getByRole('button', { name: 'Progreso', exact: true })).toBeVisible();
  await capture('hoy-light.png');
  await page.getByRole('button', { name: 'Progreso', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Mes', exact: true })).toBeVisible();
  await capture('progreso.png');
  await page.getByRole('button', { name: 'Apariencia', exact: true }).click();
  // Flutter's canvas semantics can overlap; activate the chip through its
  // accessible keyboard action and assert the resulting state.
  const dark = page.getByRole('checkbox', { name: 'Oscuro', exact: true });
  await dark.focus();
  await dark.press('Space');
  await expect(dark).toBeChecked();
  await capture('apariencia.png');
  const close = page.getByRole('button', { name: 'Cerrar apariencia', exact: true });
  await close.focus();
  await close.press('Enter');
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await capture('hoy-dark.png');
  expect(errors).toEqual([]); expect(privateRequests).toEqual([]);
  writeFileSync(new URL('verification.json', output), JSON.stringify({
    verifiedAt: new Date().toISOString(), viewport: '390x844', runtime: 'Flutter Web release in Chrome',
    screens: ['welcome', 'today-light', 'progress', 'appearance', 'today-dark'],
    scriptErrors: errors.length, privateApiRequests: privateRequests.length,
    limits: 'No Android device attached; screenshots do not establish native frame times or battery consumption.',
  }, null, 2) + '\n');
  console.log('PASS: Flutter Web navigation, theme switching, five screenshots; no private API calls.');
} finally { await browser.close(); }
