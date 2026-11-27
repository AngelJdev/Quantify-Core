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

  const userRole = await (await admin('/roles/user')).json();
  const defaultRoleName = realm.defaultRole?.name ?? 'default-roles-quantify';
  const composites = await (await admin(`/roles/${encodeURIComponent(defaultRoleName)}/composites`)).json();
  if (!composites.some((role) => role.name === 'user')) {
    await admin(`/roles/${encodeURIComponent(defaultRoleName)}/composites`, 'POST', [
      { id: userRole.id, name: userRole.name },
    ]);
  }
  const updatedComposites = await (await admin(`/roles/${encodeURIComponent(defaultRoleName)}/composites`)).json();
  assert.ok(updatedComposites.some((role) => role.name === 'user'));

  const userProfile = await (await admin('/users/profile')).json();
  const profileAttributes = Array.isArray(userProfile.attributes) ? userProfile.attributes : [];
  if (!profileAttributes.some((attr) => attr.name === 'picture')) {
    await admin('/users/profile', 'PUT', {
      ...userProfile,
      attributes: [
        ...profileAttributes,
        {
          name: 'picture',
          displayName: 'Picture URL',
          validations: { uri: {} },
          permissions: { view: ['admin', 'user'], edit: ['admin', 'user'] },
          multivalued: false,
        },
      ],
    });
  }

  const googleClientId = (settings.GOOGLE_CLIENT_ID ?? '').trim();
  const googleClientSecret = (settings.GOOGLE_CLIENT_SECRET ?? '').trim();
  if (googleClientId && googleClientSecret) {
    const idpUrl = `${base}/admin/realms/quantify/identity-provider/instances/google`;
    const existingIdp = await fetch(idpUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!existingIdp.ok && existingIdp.status !== 404) {
      throw new Error('Identity provider lookup failed');
    }
    const idpPayload = {
      alias: 'google',
      displayName: 'Google',
      providerId: 'google',
      enabled: true,
      trustEmail: true,
      storeToken: false,
      addReadTokenRoleOnCreate: false,
      firstBrokerLoginFlowAlias: 'first broker login',
      config: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        defaultScope: 'openid profile email',
        prompt: 'select_account',
        syncMode: 'FORCE',
      },
    };
    if (existingIdp.status === 404) {
      await admin('/identity-provider/instances', 'POST', idpPayload);
    } else {
      await admin('/identity-provider/instances/google', 'PUT', idpPayload);
    }
    const existingMappers = await (await admin('/identity-provider/instances/google/mappers')).json();
    const pictureMapper = {
      name: 'google-picture',
      identityProviderAlias: 'google',
      identityProviderMapper: 'google-user-attribute-mapper',
      config: {
        syncMode: 'FORCE',
        jsonField: 'picture',
        userAttribute: 'picture',
      },
    };
    const foundMapper = existingMappers.find((m) => m.name === 'google-picture');
    if (foundMapper) {
      await admin(`/identity-provider/instances/google/mappers/${foundMapper.id}`, 'PUT', {
        ...pictureMapper,
        id: foundMapper.id,
      });
    } else {
      await admin('/identity-provider/instances/google/mappers', 'POST', pictureMapper);
    }
    const verifiedIdp = await (await admin('/identity-provider/instances/google')).json();
    assert.equal(verifiedIdp.enabled, true);
    assert.equal(verifiedIdp.providerId, 'google');
    assert.equal(verifiedIdp.config?.prompt, 'select_account');
    console.log('Local quantify realm: Google Identity Provider (select_account + picture mapper) configured and enabled.');
  } else {
    console.log('Google Identity Provider skipped: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in infrastructure/docker/.env.local to enable Google login.');
  }
  console.log('Local quantify realm: registration enabled, default role user verified, and exact mobile logout callback verified.');
  console.log('Existing users, credentials and other client attributes preserved.');
} catch {
  console.error('Local identity setup failed. Check Docker, the existing private configuration and the local realm; values omitted.');
  process.exitCode = 1;
}
