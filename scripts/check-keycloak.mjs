import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Auditoría estática: no imprime valores sensibles ni sustituye revisión humana.
const input = process.argv[2] ?? fileURLToPath(new URL('../infrastructure/keycloak/realm-export.json', import.meta.url));
const realm = JSON.parse(fs.readFileSync(input, 'utf8'));
const problems = [];
const forbidden = /^(?:secret|clientSecret|password|privateKey|publicKey|certificate|secretData|credentialData|registrationAccessToken|accessToken|refreshToken|idToken|access_token|refresh_token|id_token|token|keystorePassword|smtpPassword|bindCredential|hmacSecret|apiKey)$/i;
function inspect(value, location = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    const field = location + '.' + key;
    const kindOnly = /^\$\.authenticatorConfig\.\d+\.config$/.test(location)
      && key === 'credentials' && ['password', 'otp', 'webauthn', 'webauthn-passwordless'].includes(nested);
    if (forbidden.test(key) || (key.toLowerCase() === 'credentials' && !kindOnly)) problems.push(field + ': campo no permitido');
    if (typeof nested === 'string' && (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(nested)
      || /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(nested)
      || /[a-z]+:\/\/[^/\s]+:[^/\s]+@/i.test(nested)
      || /^[A-Za-z0-9+/=_-]{80,}$/.test(nested))) problems.push(field + ': material sensible potencial');
    inspect(nested, field);
  }
}
inspect(realm);
assert.equal(problems.length, 0, problems.join('\n'));
assert.equal(realm.realm, 'quantify');
assert.equal(realm.enabled, true);
assert.equal(realm.keycloakVersion, '26.8.1');
assert.equal(realm.users?.length ?? 0, 0, 'Las cuentas se aprovisionan fuera de Git');
for (const role of ['user', 'admin']) assert.ok(realm.roles.realm.some(r => r.name === role && r.composite === false));
for (const id of ['quantify-web', 'quantify-mobile']) {
  const client = realm.clients.find(c => c.clientId === id);
  assert.ok(client, id);
  assert.equal(client.protocol, 'openid-connect');
  for (const setting of ['enabled', 'publicClient', 'standardFlowEnabled']) assert.equal(client[setting], true, id + ': ' + setting);
  for (const setting of ['directAccessGrantsEnabled', 'implicitFlowEnabled', 'serviceAccountsEnabled']) assert.equal(client[setting], false, id + ': ' + setting);
  assert.equal(client.attributes['pkce.code.challenge.method'], 'S256');
  assert.ok(client.defaultClientScopes.includes('roles'));
  assert.deepEqual(client.redirectUris, id === 'quantify-web' ? ['http://localhost:5173/auth/callback'] : ['com.quantify.app:/oauth2redirect']);
  assert.deepEqual(client.webOrigins, id === 'quantify-web' ? ['http://localhost:5173'] : []);
  const audience = client.protocolMappers?.find(m => m.name === 'quantify-api-audience');
  assert.equal(audience?.protocolMapper, 'oidc-audience-mapper');
  assert.equal(audience?.config['included.custom.audience'], 'quantify-api');
  assert.equal(audience?.config['access.token.claim'], 'true');
  assert.equal(audience?.config['id.token.claim'], 'false');
  if (id === 'quantify-web') assert.equal(client.attributes['post.logout.redirect.uris'], 'http://localhost:5173/');
}
const mapper = realm.clientScopes.find(s => s.name === 'roles')?.protocolMappers.find(m => m.protocolMapper === 'oidc-usermodel-realm-role-mapper');
assert.equal(mapper?.config['claim.name'], 'realm_access.roles');
assert.equal(mapper?.config['access.token.claim'], 'true');
console.log('Realm quantify 26.8.1: JSON, roles, clientes públicos, Code + PKCE S256, redirects y mapper válidos.');
console.log('Sin campos de secretos/credenciales ni patrones de claves/JWT detectados; cuentas fuera del export.');
console.log('Alcance estático: no prueba login, canje OAuth, autorización de API ni ausencia absoluta de secretos.');
