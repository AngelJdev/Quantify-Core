// Opt-in local test: creates two synthetic IdP users, one empty SQL profile,
// then removes only those generated users/profile. No business history is written.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const apiRequire = createRequire(new URL('../services/api/package.json', import.meta.url));
const { chromium, expect } = webRequire('@playwright/test');
const { Pool } = apiRequire('pg');
const base = 'http://localhost:5173';
const iam = 'http://localhost:8180';
const issuer = `${iam}/realms/quantify`;
const evidence = new URL('../docs/evidencias/docker-2026-11-20/', import.meta.url);
const settings = parseEnv(readFileSync(new URL('../infrastructure/docker/.env.local', import.meta.url), 'utf8'));
const migration = parseEnv(readFileSync(new URL('../services/api/.env.migrate.local', import.meta.url), 'utf8'));
const db = new URL(migration.DATABASE_URL);
assert.equal(db.hostname, '127.0.0.1'); assert.equal(db.port, '55432');
assert.equal(db.pathname, '/quantify_core_dev'); assert.equal(db.username, 'quantify_owner');
const pool = new Pool({ connectionString: migration.DATABASE_URL, connectionTimeoutMillis: 5000 });
let browser, pwaContext, profileDirectory, adminToken, phase = 'startup';
const users = [];
const checks = [];
async function admin(path, method = 'GET', body) {
  return fetch(`${iam}/admin/realms/quantify${path}`, { method,
    signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body) });
}
try {
  mkdirSync(evidence, { recursive: true });
  browser = await chromium.launch(process.env.QC_CHROME ? { executablePath: process.env.QC_CHROME } : { channel: 'chrome' });
  phase = 'static hosting and PWA';
  profileDirectory = mkdtempSync(join(tmpdir(), 'quantify-docker-chrome-'));
  pwaContext = await chromium.launchPersistentContext(profileDirectory, {
    ...(process.env.QC_CHROME ? { executablePath: process.env.QC_CHROME } : { channel: 'chrome' }),
    viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const response = await page.goto(`${base}/`);
  assert.equal(response.headers()['server']?.startsWith('nginx'), true);
  assert.equal(response.headers()['cache-control'], 'no-store');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.screenshot({ path: fileURLToPath(new URL('web-docker.png', evidence)), fullPage: true });
  await page.goto(`${base}/instalar`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve =>
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const manifest = await (await page.request.get(`${base}/manifest.webmanifest`)).json();
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) assert.equal((await page.request.get(`${base}/${icon.src}`)).status(), 200);
  const installPage = await pwaContext.newPage();
  await installPage.goto(`${base}/instalar`);
  await installPage.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await pwaContext.newCDPSession(installPage);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installability.installabilityErrors, []);
  await pwaContext.close();
  pwaContext = undefined;
  checks.push('Nginx, deep links, manifest/icons, Chrome installability, service worker');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu espacio, a un toque.');
  await expect(page.getByText('Red del dispositivo', { exact: true }).locator('..').locator('dd')).toHaveText('Sin conexión');
  await page.screenshot({ path: fileURLToPath(new URL('pwa-offline.png', evidence)), fullPage: true });
  const cacheUrls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key =>
    (await (await caches.open(key)).keys()).map(request => request.url)))).flat());
  assert.equal(cacheUrls.some(url => /\/api\/|\/auth\/|\/realms\/|[?&](code|access_token|id_token)=/.test(url)), false);
  for (const path of ['/api/v1/me', '/auth/callback?code=synthetic&state=test']) {
    assert.equal(await page.evaluate(async path => { try { await fetch(path); return false; } catch { return true; } }, path), true);
  }
  checks.push('offline static shell; no API/identity/token URLs in cache');
  await context.close();
  pwaContext = undefined;
  phase = 'temporary local accounts';
  const tokenResponse = await fetch(`${iam}/realms/master/protocol/openid-connect/token`, {
    method: 'POST', signal: AbortSignal.timeout(15000), body: new URLSearchParams({
      grant_type: 'password', client_id: 'admin-cli', username: settings.KC_BOOTSTRAP_ADMIN_USERNAME,
      password: settings.KC_BOOTSTRAP_ADMIN_PASSWORD }) });
  assert.equal(tokenResponse.status, 200);
  adminToken = (await tokenResponse.json()).access_token;
  for (const enabledProfile of [true, false]) {
    const username = `qc-docker-${randomUUID()}`, password = randomBytes(24).toString('hex');
    const created = await admin('/users', 'POST', { username, enabled: true, firstName: 'Synthetic', lastName: 'Docker',
      email: `${username}@example.invalid`, emailVerified: true,
      credentials: [{ type: 'password', value: password, temporary: false }] });
    assert.equal(created.status, 201);
    const id = new URL(created.headers.get('location')).pathname.split('/').pop();
    users.push(id);
    const roleResponse = await admin('/roles/user');
    assert.equal(roleResponse.status, 200);
    assert.equal((await admin(`/users/${id}/role-mappings/realm`, 'POST', [await roleResponse.json()])).status, 204);
    if (enabledProfile) {
      phase = 'Compose profile provisioning';
      const args = ['compose', '--env-file', 'infrastructure/docker/.env.local', '-f', 'infrastructure/docker/compose.yaml',
        '--profile', 'tools', 'run', '--rm', '--build', '-e', `PROFILE_SUBJECT=${id}`,
        '-e', 'PROFILE_TIME_ZONE=America/Mexico_City', 'profile'];
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = spawnSync('docker', args, { cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 120000 });
        assert.equal(result.status, 0);
      }
      checks.push('Compose profile task succeeds and is idempotent');
    }
    phase = enabledProfile ? 'real React login/profile/habits/logout' : 'real React login without business profile';
    const sessionContext = await browser.newContext();
    try {
      const sessionPage = await sessionContext.newPage();
      await sessionPage.goto(`${base}/conexion`);
      await sessionPage.getByRole('button', { name: 'Iniciar sesión con Keycloak' }).click();
      await sessionPage.locator('#username').fill(username);
      await sessionPage.locator('#password').fill(password);
      const profileResponse = sessionPage.waitForResponse(response => response.url() === 'http://localhost:3000/api/v1/me');
      const habitsResponse = enabledProfile ? sessionPage.waitForResponse(response => response.url().startsWith('http://localhost:3000/api/v1/habits?')) : null;
      await sessionPage.locator('#kc-login').click();
      assert.equal((await profileResponse).status(), enabledProfile ? 200 : 403);
      if (enabledProfile) {
        assert.equal((await habitsResponse).status(), 200);
        await expect(sessionPage.getByText(/Perfil propio habilitado/)).toBeVisible();
      } else await expect(sessionPage.getByRole('alert')).toBeVisible();
      assert.equal(new URL(sessionPage.url()).search, '');
      const stored = await sessionPage.evaluate(() => Object.values(localStorage).concat(Object.values(sessionStorage)));
      assert.equal(stored.some(value => /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./.test(value)), false);
      await sessionPage.getByRole('button', { name: 'Cerrar sesión' }).click();
      await sessionPage.waitForURL(`${base}/`);
      // Never take screenshots or traces of authenticated pages, credentials or redirects.
      checks.push(enabledProfile ? 'real React Code+PKCE, profile/habits 200, callback cleaned, no persisted JWT, logout' : 'real React missing profile 403, visible error, logout');
    } finally { await sessionContext.close(); }
  }
} catch (error) {
  console.error('FAIL:', phase, '(sensitive details omitted); category:', error.name);
  process.exitCode = 1;
} finally {
  if (pwaContext) await pwaContext.close();
  if (browser) await browser.close();
  if (profileDirectory && resolve(profileDirectory).startsWith(resolve(tmpdir()) + sep) &&
      profileDirectory.includes('quantify-docker-chrome-')) rmSync(profileDirectory, { recursive: true, force: true });
  for (const id of users) {
    try {
      await pool.query('DELETE FROM profiles WHERE oidc_issuer=$1 AND oidc_subject=$2', [issuer, id]);
      assert.equal((await admin(`/users/${id}`, 'DELETE')).status, 204);
    } catch { console.error('Synthetic account cleanup failed; inspect qc-docker test accounts privately.'); process.exitCode = 1; }
  }
  await pool.end();
}
if (!process.exitCode) {
  const result = { verifiedAt: new Date().toISOString(), base, checks, syntheticUsersRemoved: users.length,
    limits: 'Local Docker/Chrome only; no production deployment or manual OS installation. No authenticated screenshots.' };
  writeFileSync(new URL('verification.json', evidence), JSON.stringify(result, null, 2) + '\n');
  for (const check of checks) console.log('PASS:', check);
}
