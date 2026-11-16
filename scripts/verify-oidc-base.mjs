// Explicit local integration test. Creates two temporary IdP accounts and synthetic SQL history.
// Never records screenshots, traces, tokens, passwords, response bodies or redirect URLs.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createServer } from 'node:http';

const apiRequire = createRequire(new URL('../services/api/package.json', import.meta.url));
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { Pool } = apiRequire('pg');
const { createRemoteJWKSet, jwtVerify } = apiRequire('jose');
const { chromium } = webRequire('@playwright/test');
const { configuration } = apiRequire('./build/src/platform/config');
const { createApi } = apiRequire('./build/src/main');
const settings = parseEnv(readFileSync(new URL('../services/api/.env.local', import.meta.url), 'utf8'));
const privateSettings = parseEnv(readFileSync(new URL('../infrastructure/docker/.env.local', import.meta.url), 'utf8'));
const issuer = 'http://localhost:8180/realms/quantify';
const iam = 'http://localhost:8180';
const callback = 'http://localhost:5173/auth/callback';
const createdUsers = [];
let browser, app, pool, adminToken, callbackServer;
let phase = 'configuration';
async function json(url, init = {}, expected = 200) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, expected, 'Unexpected HTTP status');
  return response.status === 204 ? null : response.json();
}
async function admin(path, method = 'GET', body, expected = 200) {
  return json(`${iam}/admin/realms/quantify${path}`, { method, headers: {
    Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json',
  }, body: body === undefined ? undefined : JSON.stringify(body) }, expected);
}
async function tokens(parameters, expected = 200, realm = issuer) {
  return json(`${realm}/protocol/openid-connect/token`, { method: 'POST',
    body: new URLSearchParams(parameters) }, expected);
}
try {
  const db = new URL(settings.DATABASE_URL);
  assert.equal(db.hostname, '127.0.0.1'); assert.equal(db.port, '55432');
  assert.equal(db.pathname, '/quantify_core_dev'); assert.equal(db.username, 'quantify_api');
  assert.equal(settings.KEYCLOAK_ISSUER, issuer);
  phase = 'discovery and administrator access';
  const discovery = await json(`${issuer}/.well-known/openid-configuration`);
  assert.equal(discovery.issuer, issuer);
  adminToken = (await tokens({ grant_type: 'password', client_id: 'admin-cli',
    username: privateSettings.KC_BOOTSTRAP_ADMIN_USERNAME, password: privateSettings.KC_BOOTSTRAP_ADMIN_PASSWORD },
  200, `${iam}/realms/master`)).access_token;
  // Password grant is used only for the temporary lab administrator, never product clients.
  pool = new Pool({ connectionString: settings.DATABASE_URL, connectionTimeoutMillis: 3000 });
  phase = 'runtime privileges';
  const privileges = (await pool.query(`SELECT
    has_database_privilege(current_user,current_database(),'CREATE') AS ddl,
    has_table_privilege(current_user,'schema_migrations','INSERT') AS migration,
    has_table_privilege(current_user,'habit_revisions','UPDATE') AS history_update,
    has_table_privilege(current_user,'api_receipts','DELETE') AS receipt_delete,
    (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser`)).rows[0];
  assert.deepEqual(privileges, { ddl: false, migration: false, history_update: false, receipt_delete: false, superuser: false });
  phase = 'temporary synthetic accounts';
  const accounts = [];
  for (const roleName of ['user', 'admin']) {
    const username = `qc-base-${randomUUID()}`, password = randomBytes(24).toString('hex');
    const response = await fetch(`${iam}/admin/realms/quantify/users`, { method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000), body: JSON.stringify({ username, enabled: true,
        firstName: 'Synthetic', lastName: 'Verification', email: `${username}@example.invalid`, emailVerified: true,
        credentials: [{ type: 'password', value: password, temporary: false }] }) });
    assert.equal(response.status, 201);
    const id = new URL(response.headers.get('location')).pathname.split('/').pop();
    createdUsers.push(id);
    const role = await admin(`/roles/${roleName}`);
    await admin(`/users/${id}/role-mappings/realm`, 'POST', [role], 204);
    await pool.query('INSERT INTO profiles(oidc_issuer,oidc_subject,time_zone) VALUES($1,$2,$3)', [issuer, id, 'UTC']);
    accounts.push({ username, password, id });
  }
  let base;
  if (process.env.VERIFY_CONTAINER_API === '1') {
    // Explicit opt-in: isolated Compose API must already allow synthetic review writes.
    base = 'http://127.0.0.1:3000/api/v1';
  } else {
    app = await createApi({ ...configuration(settings), writesEnabled: true });
    await app.listen(0, '127.0.0.1');
    base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;
  }
  callbackServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    res.end('<!doctype html><title>Local protocol verification</title>');
  });
  await new Promise((resolve, reject) => { callbackServer.once('error', reject); callbackServer.listen(5173, '127.0.0.1', resolve); });
  browser = await chromium.launch(process.env.QC_CHROME ? { executablePath: process.env.QC_CHROME } : { channel: 'chrome' });
  const jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
  const sessions = [];
  phase = 'browser Code + PKCE and signed token claims';
  for (const account of accounts) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const verifier = randomBytes(32).toString('base64url'), state = randomUUID(), nonce = randomUUID();
      const params = new URLSearchParams({ client_id: 'quantify-web', redirect_uri: callback,
        response_type: 'code', response_mode: 'query', scope: 'openid', state, nonce,
        code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
      await page.goto(`${discovery.authorization_endpoint}?${params}`);
      phase = 'browser login form';
      await page.locator('#username').fill(account.username);
      phase = 'browser password form';
      await page.locator('#password').fill(account.password);
      phase = 'browser login redirect';
      await Promise.all([page.waitForURL(`${callback}**`), page.locator('#kc-login').click()]);
      let returned = new URL(page.url());
      phase = 'authorization callback state';
      assert.equal(returned.searchParams.get('state'), state);
      let code = returned.searchParams.get('code'); assert.ok(code);
      if (sessions.length === 0) {
        phase = 'reject wrong PKCE verifier';
        await tokens({ grant_type: 'authorization_code', client_id: 'quantify-web', redirect_uri: callback,
          code, code_verifier: randomBytes(32).toString('base64url') }, 400);
        await page.goto(`${discovery.authorization_endpoint}?${params}`);
        await page.waitForURL(`${callback}**`);
        returned = new URL(page.url());
        assert.equal(returned.searchParams.get('state'), state);
        code = returned.searchParams.get('code'); assert.ok(code);
      }
      phase = 'authorization code exchange';
      const session = await tokens({ grant_type: 'authorization_code', client_id: 'quantify-web',
        redirect_uri: callback, code, code_verifier: verifier });
      phase = 'access token audience and subject';
      const access = await jwtVerify(session.access_token, jwks, { issuer, audience: 'quantify-api', algorithms: ['RS256'] });
      assert.equal(access.payload.sub, account.id); assert.equal(access.payload.typ, 'Bearer');
      phase = 'ID token nonce';
      const identity = await jwtVerify(session.id_token, jwks, { issuer, audience: 'quantify-web', algorithms: ['RS256'] });
      assert.equal(identity.payload.nonce, nonce);
      phase = 'browser CORS readiness';
      const cors = await page.evaluate(async url => {
        const response = await fetch(url, { cache: 'no-store' });
        return { status: response.status, body: await response.json() };
      }, `${base}/health/ready`);
      assert.equal(cors.status, 200); assert.equal(cors.body.status, 'ok');
      sessions.push(session);
    } finally { await context.close(); }
  }
  async function request(path, actor = 0, options = {}) {
    const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${sessions[actor].access_token}`, 'Content-Type': 'application/json', ...options.headers } });
    return { status: response.status, body: await response.json() };
  }
  phase = 'profile, ownership, writes and durable replay';
  assert.equal((await request('/me')).status, 200);
  assert.deepEqual((await request('/me', 1)).body.roles, ['admin']);
  const day = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const habit = await request('/habits', 0, { method: 'POST', headers: { 'Idempotency-Key': randomUUID() },
    body: JSON.stringify({ name: 'Synthetic integration verification', unit: 'minutes', targetValue: 10,
      timeZone: 'UTC', schedule: { weekdays: [1,2,3,4,5,6,7], effectiveFrom: day } }) });
  assert.equal(habit.status, 201);
  assert.equal((await request(`/habits/${habit.body.id}`, 1)).status, 404);
  const command = { method: 'POST', headers: { 'Idempotency-Key': randomUUID() }, body: JSON.stringify({
    clientEventId: randomUUID(), businessDate: day, occurredAt: `${day}T12:00:00Z`, timeZone: 'UTC', value: 10, expectedVersion: 0 }) };
  const path = `/habits/${habit.body.id}/check-ins`;
  const first = await request(path, 0, command), replay = await request(path, 0, command);
  assert.equal(first.status, 201); assert.equal(replay.status, 200); assert.deepEqual(first.body, replay.body);
  const history = await request(`${path}?from=${day}&to=${day}`);
  assert.equal(history.status, 200); assert.equal(history.body.items.length, 1);
  assert.equal((await request(`/habits/${habit.body.id}/metrics?from=${day}&to=${day}`)).status, 200);
  assert.equal((await request(`/me/dashboard/progress?from=${day}&to=${day}`)).status, 200);
  phase = 'refresh and logout';
  const refreshed = await tokens({ grant_type: 'refresh_token', client_id: 'quantify-web', refresh_token: sessions[0].refresh_token });
  await json(`${issuer}/protocol/openid-connect/logout`, { method: 'POST',
    body: new URLSearchParams({ client_id: 'quantify-web', refresh_token: refreshed.refresh_token }) }, 204);
  await tokens({ grant_type: 'refresh_token', client_id: 'quantify-web', refresh_token: refreshed.refresh_token }, 400);
  console.log('PASS: real Keycloak, Chrome PKCE, nonce/state, API audience, SQL runtime privileges, two accounts, CORS, ownership, replay, metrics, refresh and logout.');
  console.log('Synthetic SQL history is retained. This protocol harness does not implement React/Flutter sessions.');
} catch (error) {
  console.error('Local integration verification failed during:', phase, '(sensitive details omitted)');
  console.error('Error category:', error.name);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (callbackServer?.listening) await new Promise(resolve => callbackServer.close(resolve));
  if (app) await app.close();
  if (pool) await pool.end();
  for (const id of createdUsers) {
    try { await admin(`/users/${id}`, 'DELETE', undefined, 204); }
    catch { console.error('Temporary IdP account cleanup failed; review local lab accounts.'); process.exitCode = 1; }
  }
}
