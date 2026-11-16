const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { OperationalSignals } = require('../build/src/platform/operational-signals');
const { configuration } = require('../build/src/platform/config');

test('operational metrics bound route cardinality and exclude request data', async t => {
  const signals = new OperationalSignals({port:0,host:'127.0.0.1'});
  const app = express(); app.use(signals.middleware);
  app.get('/api/v1/habits/:id', (_req,res)=>res.json({ok:true}));
  const server = await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await signals.onModuleDestroy();});
  const base=`http://127.0.0.1:${server.address().port}`;
  for(let i=0;i<20;i++) {
    await (await fetch(base+`/private-${i}?secret=private-canary`)).arrayBuffer();
    const response=await fetch(base+`/api/v1/habits/private-${i}`,{headers:{Authorization:'Bearer private-canary'}});
    assert.ok(response.headers.get('x-request-id'));await response.arrayBuffer();
  }
  const metrics=await signals.registry.metrics();
  assert.ok(metrics.includes('route="/api/v1/habits/:id"'));
  assert.ok(metrics.includes('route="unmatched"'));
  assert.ok(!metrics.includes('private-'));assert.ok(!metrics.includes('private-canary'));
  assert.equal((metrics.match(/quantify_http_requests_total\{/g)||[]).length,2);
});
test('backchannel preserves issuer and fails closed for arbitrary HTTP or query strings',()=>{
  const base={DATABASE_URL:'postgresql://localhost/test',KEYCLOAK_ISSUER:'http://localhost:8180/realms/quantify',KEYCLOAK_AUDIENCE:'quantify-api'};
  const path='/realms/quantify/protocol/openid-connect/certs';
  const result=configuration({...base,KEYCLOAK_JWKS_URL:'http://keycloak:8080'+path});
  assert.equal(result.issuer,base.KEYCLOAK_ISSUER);
  for(const url of ['http://evil.test'+path,'http://keycloak:8080/wrong','http://keycloak:8080'+path+'?token=x'])
    assert.throws(()=>configuration({...base,KEYCLOAK_JWKS_URL:url}));
  assert.throws(()=>configuration({...base,OBSERVABILITY_ENABLED:'true'}));
  assert.throws(()=>configuration({...base,OBSERVABILITY_ENABLED:'1',METRICS_PORT:'3000'}));
});
