// Opt-in real-device check. Creates and deletes one synthetic Keycloak account.
// Requires the debug APK configured for USB, an unlocked phone, and Chrome.
// Restarts the app and Chrome; unrelated browser tabs/data are retained.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseEnv } from 'node:util';

const [serial] = process.argv.slice(2);
const resumeRegistration = process.argv[3] === '--resume-registration';
if (!serial) throw Error('Usage: node scripts/verify-mobile-usb.mjs DEVICE_ID');
const adbPath = process.env.QC_ADB ?? 'adb';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const base = 'http://localhost:8180';
const username = `qc-mobile-${randomBytes(8).toString('hex')}`;
const password = randomBytes(24).toString('hex');
const checks = [];
let browser, currentPage, previousPages, adminToken, phase = 'setup';
function adb(...args) {
  return execFileSync(adbPath, ['-s', serial, ...args], { encoding: 'utf8', timeout: 15000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
}
const pause = () => new Promise(resolve => setTimeout(resolve, 400));
function ui() {
  try {
    adb('shell', 'rm', '-f', '/sdcard/quantify-test-ui.xml');
    adb('shell', 'uiautomator', 'dump', '/sdcard/quantify-test-ui.xml');
    return adb('shell', 'cat', '/sdcard/quantify-test-ui.xml');
  } catch { return ''; } // A transition/splash may temporarily have no root.
}
function nodeWithLabel(xml, label) {
  return [...xml.matchAll(/<node\b[^>]*>/g)].map(m => m[0]).find(n =>
    n.includes('package="com.quantify.app"') &&
    (n.includes(`content-desc="${label}"`) || n.includes(`text="${label}"`)));
}
async function tapLabel(label, scroll = false) {
  for (let attempt = 0; attempt < (scroll ? 5 : 1); attempt++) {
    const node = nodeWithLabel(ui(), label);
    if (node) {
      const bounds = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(node);
      assert.ok(bounds, 'Native bounds missing');
      const [, x1, y1, x2, y2] = bounds.map(Number);
      adb('shell', 'input', 'tap', String(Math.round((x1 + x2) / 2)), String(Math.round((y1 + y2) / 2)));
      return;
    }
    if (scroll) adb('shell', 'input', 'swipe', '350', '1200', '350', '450', '350');
  }
  throw Error('Native action unavailable');
}
async function nativeContains(text) {
  for (let i = 0; i < 6; i++) {
    if (ui().includes(text)) return;
    await pause();
  }
  throw Error('Native destination not reached');
}
async function submitBrowserForm() {
  // Chrome requires a trusted user gesture to follow the native callback URI.
  adb('shell', 'input', 'keyevent', '4');
  const submit = currentPage.locator('#kc-login, input[type=submit], button[type=submit]').first();
  await submit.scrollIntoViewIfNeeded({ timeout: 10000 });
  await currentPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const bounds = await submit.boundingBox();
  assert.ok(bounds, 'Browser submit button missing');
  const cdp = await currentPage.context().newCDPSession(currentPage);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach().catch(() => {});
}
async function typeBrowserField(id, value) {
  await currentPage.locator(`#${id}`).fill(value, { timeout: 10000 });
}
async function identityPage(selector) {
  for (let i = 0; i < 30; i++) {
    for (const page of browser.contexts().flatMap(c => c.pages()).reverse()) {
      if (previousPages.has(page) || !page.url().startsWith(`${base}/realms/quantify/`)) continue;
      if (await page.locator(selector).isVisible().catch(() => false)) {
        currentPage = page;
        return;
      }
    }
    await pause();
  }
  throw Error('Local identity form unavailable');
}
async function authenticateAdmin() {
  const settings = parseEnv(readFileSync(new URL('../infrastructure/docker/.env.local', import.meta.url), 'utf8'));
  const response = await fetch(`${base}/realms/master/protocol/openid-connect/token`, {
    method: 'POST', signal: AbortSignal.timeout(10000), body: new URLSearchParams({
      grant_type: 'password', client_id: 'admin-cli',
      username: settings.KC_BOOTSTRAP_ADMIN_USERNAME, password: settings.KC_BOOTSTRAP_ADMIN_PASSWORD,
    }),
  });
  assert.ok(response.ok, 'Local admin authentication failed');
  adminToken = (await response.json()).access_token;
}
async function admin(path, method = 'GET', retry = true) {
  const response = await fetch(`${base}/admin/realms/quantify${path}`, {
    method, headers: { Authorization: `Bearer ${adminToken}` }, signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401 && retry) {
    await authenticateAdmin();
    return admin(path, method, false);
  }
  assert.ok(response.ok, 'Local admin request failed');
  return response;
}
try {
  await authenticateAdmin();
  adb('reverse', 'tcp:8180', 'tcp:8180');
  previousPages = new Set();
  if (!resumeRegistration) {
    adb('shell', 'am', 'force-stop', 'com.quantify.app');
    adb('shell', 'am', 'force-stop', 'com.android.chrome');
    adb('shell', 'am', 'start', '-f', '0x10008000', '-n', 'com.quantify.app/.MainActivity');
    await nativeContains('Pequeños hábitos.');
    await tapLabel('Iniciar sesión o crear cuenta', true);
    await tapLabel('Crear cuenta');
  }
  adb('forward', 'tcp:9223', 'localabstract:chrome_devtools_remote');
  for (let attempt = 0; attempt < 15 && !browser; attempt++) {
    try {
      browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 2000 });
    } catch { await pause(); }
  }
  if (!browser) throw Error('Local browser debugging unavailable');
  console.log('Fresh native registration request opened.');
  phase = 'registration';
  // Registration must be opened by the native app so AppAuth owns this request.
  await identityPage('#password-confirm');
  await typeBrowserField('username', username);
  await typeBrowserField('password', password);
  await typeBrowserField('password-confirm', password);
  await typeBrowserField('email', `${username}@example.invalid`);
  await typeBrowserField('firstName', 'Synthetic');
  await typeBrowserField('lastName', 'Mobile');
  await submitBrowserForm();
  await nativeContains('Tu rutina de hoy');
  await tapLabel('Perfil');
  await nativeContains('Sesión Keycloak activa');
  const evidence = new URL('../apps/mobile/docs/evidencias/sesion-keycloak-2026-11-23/', import.meta.url);
  mkdirSync(evidence, { recursive: true });
  writeFileSync(new URL('perfil-oppo.png', evidence), execFileSync(adbPath, ['-s', serial, 'exec-out', 'screencap', '-p'], { maxBuffer: 8000000, windowsHide: true }));
  checks.push('Registration in phone Chrome -> AppAuth callback -> authenticated example dashboard');
  console.log('Registration and native dashboard verified.');
  phase = 'first logout';
  await tapLabel('Cerrar sesión', true);
  await nativeContains('Pequeños hábitos.');
  checks.push('Logout -> welcome');
  phase = 'login';
  previousPages = new Set(browser.contexts().flatMap(c => c.pages()));
  await tapLabel('Iniciar sesión o crear cuenta', true);
  await tapLabel('Continuar con Keycloak');
  await identityPage('#kc-login');
  await typeBrowserField('username', username);
  await typeBrowserField('password', password);
  await submitBrowserForm();
  await nativeContains('Tu rutina de hoy');
  await tapLabel('Perfil');
  await nativeContains('Sesión Keycloak activa');
  checks.push('Existing account login -> authenticated example dashboard');
  phase = 'second logout';
  await tapLabel('Cerrar sesión', true);
  await nativeContains('Pequeños hábitos.');
  checks.push('Second logout -> welcome');
  phase = 'cancellation';
  previousPages = new Set(browser.contexts().flatMap(c => c.pages()));
  await tapLabel('Iniciar sesión o crear cuenta', true);
  await tapLabel('Continuar con Keycloak');
  await identityPage('#kc-login');
  const close = [...ui().matchAll(/<node\b[^>]*>/g)].map(m => m[0]).find(n =>
    n.includes('resource-id="com.android.chrome:id/close_button"'));
  assert.ok(close, 'Browser close button missing');
  const [, cx1, cy1, cx2, cy2] = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(close).map(Number);
  adb('shell', 'input', 'tap', String(Math.round((cx1 + cx2) / 2)), String(Math.round((cy1 + cy2) / 2)));
  await nativeContains('Acceso cancelado.');
  checks.push('Browser cancellation -> native access screen without authenticated dashboard');
  for (const check of checks) console.log(`PASS: ${check}`);
} catch (error) {
  console.error(`Mobile USB check failed during ${phase} (${error.name}); protocol URLs and credentials omitted.`);
  if (/^(?:Native|Browser|Local) [a-zA-Z ]+$/.test(error.message)) console.error(error.message);
  if (currentPage && !currentPage.isClosed()) {
    const providerError = await currentPage.locator('#kc-error-message').textContent({ timeout: 1000 }).catch(() => '');
    if (providerError.includes('already authenticated')) console.error('Provider error: existing authenticated user conflict.');
    else if (providerError.includes('cookie not found')) console.error('Provider error: restart cookie missing.');
    else if (providerError.includes('Invalid username or password')) console.error('Provider error: credentials rejected.');
  }
  process.exitCode = 1;
} finally {
  try {
    if (adminToken) {
      const users = await (await admin(`/users?username=${encodeURIComponent(username)}&exact=true`)).json();
      console.log(`Synthetic registration reached server: ${users.length === 1}.`);
      for (const user of users) {
        assert.equal(user.username, username);
        await admin(`/users/${user.id}`, 'DELETE');
      }
      console.log('Synthetic account cleanup complete; existing users untouched.');
    }
  } catch {
    console.error('Synthetic account cleanup failed; review local test accounts.');
    process.exitCode = 1;
  }
  await browser?.close();
  try { adb('forward', '--remove', 'tcp:9223'); } catch { /* device may be disconnected */ }
  try { adb('shell', 'rm', '-f', '/sdcard/quantify-test-ui.xml'); } catch { /* device may be disconnected */ }
}
