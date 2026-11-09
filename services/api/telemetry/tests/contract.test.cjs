const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validate, fingerprint } = require('../dist/validation.js');
const { configuration } = require('../dist/config.js');
const { makeBatch } = require('../scripts/fixtures.cjs');
const at = '2026-11-08T18:00:00.000Z';
test('El generador es reproducible y el fixture cumple el contrato versionado', () => {
  const a = makeBatch({ at }); assert.deepEqual(a,makeBatch({ at }));
  assert.equal(validate('batch',a),a);
});
test('Unidades, ausencias, null, valores no finitos y propiedades ajenas se rechazan', () => {
  for (const mutate of [b => b.samples[0].unit='count',b => delete b.samples[0].value,
    b => b.samples[0].value=null,b => b.samples[0].value=NaN,b => b.ownerId='otro',
    b => b.samples[0].email='no-admitido',b => b.origin='wear-os',b => b.schemaVersion='2.0.0']) {
    const batch=makeBatch({at});mutate(batch);assert.throws(() => validate('batch',batch));
  }
  assert.doesNotThrow(() => validate('batch',makeBatch({at,signal:'stepCount',count:1})));
});
test('Consentimientos granulares no aceptan finalidades implícitas ni duplicados', () => {
  assert.throws(() => validate('consent',{expectedVersion:0,noticeVersion:'synthetic-notice-v1',grants:[{signal:'heartRate',purpose:'training'}]}));
  const grant={signal:'heartRate',purpose:'personal-analytics'};
  assert.throws(() => validate('consent',{expectedVersion:0,noticeVersion:'synthetic-notice-v1',grants:[grant,grant]}));
});
test('La huella ignora el orden de propiedades pero conserva el de muestras', () => {
  const a=makeBatch({at}),b={...a};b.samples=a.samples.map(s=>Object.fromEntries(Object.entries(s).reverse()));
  assert.equal(fingerprint(a),fingerprint(b));
  b.samples.reverse();assert.notEqual(fingerprint(a),fingerprint(b));
});
test('Simulación deshabilitada por defecto y OIDC remoto exige HTTPS', () => {
  assert.throws(() => configuration({}));
  const env={TELEMETRY_SIMULATION_ENABLED:'1',DATABASE_URL:'postgresql://local',KEYCLOAK_ISSUER:'http://remote.invalid/realm',KEYCLOAK_AUDIENCE:'api'};
  assert.throws(() => configuration(env));
  assert.doesNotThrow(() => configuration({...env,KEYCLOAK_ISSUER:'http://127.0.0.1/realm'}));
});
test('Tipos generados proceden de los esquemas canónicos, sin contrato alterno por cliente', () => {
  const contract=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../../packages/contracts/telemetry/v1/batch.schema.json'),'utf8'));
  assert.equal(contract.$schema,'https://json-schema.org/draft/2020-12/schema');
  assert.equal(contract.additionalProperties,false);
  assert.equal(contract.properties.samples.maxItems,100);
});
