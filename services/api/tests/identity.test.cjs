const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TelemetryIdentity } = require('../build/telemetry/src/auth');

test('local auto-provision never accepts an unsigned fallback token', async () => {
  let queried = false;
  const identity = new TelemetryIdentity({
    issuer: 'http://127.0.0.1:1/realms/test',
    audience: 'quantify-api',
    autoProvisionProfiles: true,
  }, { query: async () => { queried = true; throw new Error('Unexpected SQL access'); } });
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    qc_local_fallback: true, sub: 'another-owner', aud: 'quantify-api',
  })).toString('base64url');
  const request = { headers: { authorization: `Bearer ${header}.${payload}.unsigned` } };
  const context = { switchToHttp: () => ({ getRequest: () => request }) };
  await assert.rejects(() => identity.canActivate(context), error => error.status === 401);
  assert.equal(queried, false);
  assert.equal(request.telemetryOwner, undefined);
});
