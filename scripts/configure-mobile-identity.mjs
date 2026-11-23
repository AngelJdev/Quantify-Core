// Opt-in configuration of the existing isolated local realm; never re-import it.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import assert from 'node:assert/strict';

if (process.argv[2] !== '--apply-local') {
  console.error('Usage: node scripts/configure-mobile-identity.mjs --apply-local');
  process.exit(1);
}
const base = 'http://localhost:8180';
const callback = 'com.quantify.app:/oauth2redirect';
async function checked(url, options) {
  const result = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!result.ok) throw new Error('Identity configuration request failed');
  return result;
}
try {
  const settings = parseEnv(readFileSync(new URL('../infrastructure/docker/.env.local', import.meta.url), 'utf8'));
  const response = await checked(`${base}/realms/master/protocol/openid-connect/token`, {
    method: 'POST', body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli',
      username: settings.KC_BOOTSTRAP_ADMIN_USERNAME, password: settings.KC_BOOTSTRAP_ADMIN_PASSWORD }),
  });
  const { access_token: token } = await response.json();
  async function admin(path, method = 'GET', body) {
    return checked(`${base}/admin/realms/quantify${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  const realm = await (await admin('')).json();
  assert.equal(realm.realm, 'quantify');
  const matches = await (await admin('/clients?clientId=quantify-mobile')).json();
  assert.equal(matches.length, 1);
  const client = await (await admin(`/clients/${matches[0].id}`)).json();
  assert.equal(client.publicClient, true);
  assert.deepEqual(client.redirectUris, [callback]);
  assert.equal(client.attributes['pkce.code.challenge.method'], 'S256');
  await admin('', 'PUT', { registrationAllowed: true });
  await admin(`/clients/${client.id}`, 'PUT', {
    attributes: { ...client.attributes, 'post.logout.redirect.uris': callback },
  });
  assert.equal((await (await admin('')).json()).registrationAllowed, true);
  assert.equal((await (await admin(`/clients/${client.id}`)).json()).attributes['post.logout.redirect.uris'], callback);
  console.log('Local quantify realm: registration enabled and exact mobile logout callback verified.');
  console.log('Existing users, credentials and other client attributes preserved.');
} catch {
  console.error('Local identity setup failed. Check Docker, the existing private configuration and the local realm; values omitted.');
  process.exitCode = 1;
}
