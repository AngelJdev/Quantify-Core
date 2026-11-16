const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configuration } = require('../build/src/platform/config');
const base = { DATABASE_URL:'postgresql://localhost/test',KEYCLOAK_ISSUER:'http://localhost:8080/realms/quantify',KEYCLOAK_AUDIENCE:'quantify-api' };
test('configuration fails closed without PostgreSQL/OIDC and rejects unsafe origins', () => {
  for (const override of [{DATABASE_URL:''},{KEYCLOAK_ISSUER:'http://remote.test/realm'},
    {KEYCLOAK_ISSUER:'https://idp.test/realm?secret=x'},{CORS_ALLOWED_ORIGINS:'*'},
    {CORS_ALLOWED_ORIGINS:'http://localhost:5173/path'},{PORT:'NaN'},{CORE_REVIEW_WRITES_ENABLED:'true'}])
    assert.throws(() => configuration({...base,...override}));
  const result = configuration(base);
  assert.equal(result.writesEnabled,false);
  assert.equal(result.mongo,undefined);
  assert.equal(result.dashboardEnabled,true);
});
test('configuration mounts core without synthetic opt-in or MongoDB', () => {
  assert.deepEqual(configuration({...base,CORS_ALLOWED_ORIGINS:'http://localhost:5173',CORE_REVIEW_WRITES_ENABLED:'1'}).corsOrigins,
    ['http://localhost:5173']);
});
