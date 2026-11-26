const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const {randomUUID,randomBytes} = require('node:crypto');
const {Pool} = require('pg');
const {generateKeyPair,exportJWK,SignJWT} = require('jose');
const Ajv = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const {migrate} = require('../db/migrate.cjs');
const {createApi} = require('../build/src/main');
async function freePort() {
  const server=net.createServer(); await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port; await new Promise(r=>server.close(r)); return port;
}
test('core HTTP writes and reads real PostgreSQL with durable history',async t=>{
  const {default:EmbeddedPostgres}=await import('embedded-postgres');
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'quantify-core-'));
  const password=randomBytes(24).toString('hex'),port=await freePort();
  const pg=new EmbeddedPostgres({databaseDir:path.join(directory,'pgdata'),user:'postgres',password,port,persistent:true,
    createPostgresUser:false,postgresFlags:['-h','127.0.0.1','-k',directory,'-c','io_method=sync'],onLog(){},onError(){}});
  let pool,app,issuerServer,expectedSqlOutage=false;
  t.after(async()=>{
    if(app)await app.close();
    if(issuerServer)await new Promise(r=>issuerServer.close(r));
    if(pool)await pool.end();
    await pg.stop();
    const resolved=path.resolve(directory);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('quantify-core-'));
    await fs.rm(resolved,{recursive:true,force:true});
  });
  await pg.initialise(); await pg.start();
  const databaseUrl=`postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
  pool=new Pool({connectionString:databaseUrl});
  pool.on('error',error=>{if(!expectedSqlOutage)throw error;});
  const {publicKey,privateKey}=await generateKeyPair('RS256');
  const jwk={...await exportJWK(publicKey),kid:'core-test',alg:'RS256',use:'sig'};
  issuerServer=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({keys:[jwk]}));});
  await new Promise(r=>issuerServer.listen(0,'127.0.0.1',r));
  const issuer=`http://127.0.0.1:${issuerServer.address().port}/realms/synthetic`;
  const token=(subject,claims={},audience='quantify-api',expiration='5m',iss=issuer)=>new SignJWT({typ:'Bearer',realm_access:{roles:['user']},...claims})
    .setProtectedHeader({alg:'RS256',kid:jwk.kid}).setIssuer(iss).setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime(expiration).sign(privateKey);
  const owners=[randomUUID(),randomUUID()];
  await t.test('upgrade from original 001 preserves profiles, snapshots and outbox',async()=>{
    assert.deepEqual(await migrate(pool,'001_core.sql'),['001_core.sql']);
    await pool.query(`INSERT INTO profiles(id,oidc_issuer,oidc_subject) VALUES($1,$3,'a'),($2,$3,'b')`,[...owners,issuer]);
    const old=(await pool.query(`INSERT INTO habits(owner_id,name,target_value,unit,weekdays,effective_from,time_zone)
      VALUES($1,'Existing habit',10,'minutes',ARRAY[1,2,3,4,5,6,7]::smallint[],'2026-01-01','UTC') RETURNING id`,[owners[0]])).rows[0];
    assert.deepEqual(await migrate(pool),['002_core_integration.sql']);
    assert.deepEqual(await migrate(pool),[]);
    assert.equal((await pool.query('SELECT count(*)::integer AS n FROM habit_revisions WHERE habit_id=$1',[old.id])).rows[0].n,1);
    assert.equal((await pool.query('SELECT time_zone FROM profiles WHERE id=$1',[owners[0]])).rows[0].time_zone,'UTC');
    assert.equal((await pool.query('SELECT count(*)::integer AS n FROM dashboard_read.v1_revisions WHERE habit_id=$1',[old.id])).rows[0].n,1);
  });
  const config={databaseUrl,issuer,audience:'quantify-api',port:3000,host:'127.0.0.1',corsOrigins:['http://localhost:5173'],dashboardEnabled:true,writesEnabled:true};
  let base;
  async function start(overrides={}) {app=await createApi({...config,...overrides});await app.listen(0,'127.0.0.1');base=`http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;}
  await start();
  const tokens=[await token('a'),await token('b',{realm_access:{roles:['admin']}})];
  const specification=JSON.parse(await fs.readFile(path.resolve(__dirname,'../../../packages/contracts/openapi.json'),'utf8'));
  const ajv=new Ajv({strict:true});addFormats(ajv);
  const defs=JSON.parse(JSON.stringify(specification.components.schemas).replaceAll('#/components/schemas/','#/$defs/'));
  const schemas=Object.fromEntries(Object.keys(defs).map(name=>[name,ajv.compile({$defs:defs,$ref:'#/$defs/'+name})]));
  async function request(route,{method='GET',body,actor=0,key,match,auth,headers={},schema}={}) {
    const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',
      ...(auth===null?{}:{Authorization:auth??`Bearer ${tokens[actor]}`}),...(key?{'Idempotency-Key':key}:{}),...(match?{'If-Match':match}:{}),...headers},
      body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});
    const result={status:response.status,body:await response.json(),headers:response.headers};
    assert.equal(response.headers.get('cache-control'),'no-store');
    const validator=response.status>=400?schemas.Problem:schema?schemas[schema]:undefined;
    if(validator)assert.equal(validator(result.body),true,JSON.stringify(validator.errors));
    if(response.status>=400)assert.ok(response.headers.get('content-type').startsWith('application/problem+json'));
    return result;
  }
  const day=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
  const from=day(-2),yesterday=day(-1),today=day(0),tomorrow=day(1);
  const habit={name:'Integration habit',targetValue:10,unit:'minutes',schedule:{weekdays:[1,2,3,4,5,6,7],effectiveFrom:from},timeZone:'UTC'};
  let created,command,receipt,creationKey;
  await t.test('process and SQL readiness are independent of optional MongoDB',async()=>{
    assert.equal((await request('/health/live',{auth:null})).status,200);
    assert.equal((await request('/health/ready',{auth:null})).status,200);
    assert.equal((await request('/health',{auth:null})).status,404);
    assert.equal((await request('/telemetry/simulation/sources',{auth:null})).status,404);
  });
  await t.test('JWT claims, active profile and owner boundaries return 401/403/404',async()=>{
    assert.equal((await request('/me',{auth:null})).status,401);
    for(const bad of [await token('a',{},'wrong'),await token('a',{},'quantify-api','-1s'),await token('a',{typ:'ID'}),await token('a',{},'quantify-api','5m','https://wrong.test')])
      assert.equal((await request('/me',{auth:`Bearer ${bad}`})).status,401);
    assert.equal((await request('/me',{auth:`Bearer ${await token('unprovisioned')}`})).status,403);
    const freshToken=await token('fresh-mobile-user');
    assert.equal((await request('/me',{method:'POST',auth:`Bearer ${freshToken}`,body:{timeZone:'Invalid/Zone'},key:randomUUID()})).status,422);
    assert.equal((await request('/me',{method:'POST',auth:`Bearer ${freshToken}`,body:{timeZone:'America/Mexico_City'}})).status,400);
    const provisionKey=randomUUID();
    const provisioned=await request('/me',{method:'POST',auth:`Bearer ${freshToken}`,body:{timeZone:'America/Mexico_City'},key:provisionKey,schema:'Profile'});
    assert.equal(provisioned.status,201);assert.equal(provisioned.body.timeZone,'America/Mexico_City');assert.equal(provisioned.body.status,'active');
    const replayProvision=await request('/me',{method:'POST',auth:`Bearer ${freshToken}`,body:{timeZone:'America/Mexico_City'},key:provisionKey,schema:'Profile'});
    assert.equal(replayProvision.status,201);assert.deepEqual(replayProvision.body,provisioned.body);
    assert.equal((await request('/me',{method:'POST',auth:`Bearer ${freshToken}`,body:{timeZone:'UTC'},key:provisionKey})).status,409);
    const existingProvision=await request('/me',{method:'POST',auth:`Bearer ${freshToken}`,body:{timeZone:'America/Mexico_City'},key:randomUUID(),schema:'Profile'});
    assert.equal(existingProvision.status,200);assert.equal(existingProvision.body.id,provisioned.body.id);
    assert.equal((await request('/me',{auth:`Bearer ${freshToken}`,schema:'Profile'})).status,200);
    await pool.query("UPDATE profiles SET status='suspended' WHERE id=$1",[provisioned.body.id]);
    assert.equal((await request('/me',{method:'POST',auth:`Bearer ${freshToken}`,body:{timeZone:'America/Mexico_City'},key:randomUUID()})).status,403);
    const profile=await request('/me',{schema:'Profile'});assert.equal(profile.body.id,owners[0]);
    assert.deepEqual((await request('/me',{actor:1,schema:'Profile'})).body.roles,['admin']);
  });
  await t.test('create is persistent, idempotent and rejects incompatible commands',async()=>{
    creationKey=randomUUID();created=await request('/habits',{method:'POST',body:habit,key:creationKey,schema:'Habit'});
    assert.equal(created.status,201);assert.equal(created.headers.get('etag'),'"1"');
    const duplicate=await request('/habits',{method:'POST',body:habit,key:creationKey,schema:'Habit'});
    assert.deepEqual(duplicate.body,created.body);
    assert.equal((await request('/habits',{method:'POST',body:{...habit,name:'Changed'},key:creationKey})).status,409);
    assert.equal((await request('/habits',{method:'POST',body:habit})).status,400);
    assert.equal((await request('/habits',{method:'POST',body:{...habit,ownerId:owners[1]},key:randomUUID()})).status,400);
    assert.equal((await request('/habits',{method:'POST',body:{...habit,targetValue:0.1234},key:randomUUID()})).status,422);
    assert.equal((await request('/habits/'+created.body.id,{actor:1})).status,404);
    assert.equal((await request('/habits/'+created.body.id,{schema:'Habit'})).headers.get('etag'),'"1"');
  });
  await t.test('pagination binds cursors to owner, filters and operation',async()=>{
    const first=await request('/habits?limit=1',{schema:'HabitList'});assert.equal(first.body.items.length,1);assert.ok(first.body.nextCursor);
    const next=await request('/habits?limit=1&cursor='+first.body.nextCursor,{schema:'HabitList'});assert.notEqual(next.body.items[0].id,first.body.items[0].id);
    assert.equal((await request('/habits?limit=1&cursor='+first.body.nextCursor,{actor:1})).status,400);
    assert.equal((await request('/habits?limit=1&status=paused&cursor='+first.body.nextCursor)).status,400);
  });
  await t.test('concurrent absolute check-ins dedupe by key and event, atomically',async()=>{
    command={clientEventId:randomUUID(),businessDate:yesterday,occurredAt:yesterday+'T12:00:00Z',timeZone:'UTC',value:10,expectedVersion:0};
    const key=randomUUID(),route='/habits/'+created.body.id+'/check-ins';
    const concurrent=await Promise.all([request(route,{method:'POST',body:command,key,schema:'CheckIn'}),request(route,{method:'POST',body:command,key,schema:'CheckIn'})]);
    assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,201]);assert.deepEqual(concurrent[0].body,concurrent[1].body);receipt=concurrent[0].body;
    assert.equal((await request(route,{method:'POST',body:command,key:randomUUID(),schema:'CheckIn'})).status,200);
    assert.equal((await request(route,{method:'POST',body:{...command,occurredAt:yesterday+'T13:00:00Z'},key})).status,409);
    assert.equal((await request(route,{method:'POST',body:command,key:randomUUID(),actor:1})).status,404);
    assert.equal((await pool.query('SELECT count(*)::integer AS n FROM check_in_revisions WHERE check_in_id=$1',[receipt.id])).rows[0].n,1);
  });
  await t.test('corrections preserve history and conflict on stale revisions',async()=>{
    const route='/habits/'+created.body.id+'/check-ins';
    const correction={...command,clientEventId:randomUUID(),expectedVersion:1,value:4,correctionReason:'Correction'};
    const stale=await Promise.all([request(route,{method:'POST',body:correction,key:randomUUID()}),
      request(route,{method:'POST',body:{...correction,clientEventId:randomUUID(),value:5},key:randomUUID()})]);
    assert.deepEqual(stale.map(r=>r.status).sort(),[200,409]);
    assert.equal((await pool.query('SELECT count(*)::integer AS n FROM check_in_revisions WHERE check_in_id=$1',[receipt.id])).rows[0].n,2);
    assert.equal((await pool.query("SELECT count(*)::integer AS n FROM audit_outbox WHERE aggregate_type='check-in' AND aggregate_id=$1",[receipt.id])).rows[0].n,2);
    assert.equal((await request(route,{method:'POST',body:{...correction,clientEventId:randomUUID(),expectedVersion:2,correctionReason:''},key:randomUUID()})).status,422);
  });
  await t.test('occurrence coherence, impossible dates and future values fail without receipts',async()=>{
    const route='/habits/'+created.body.id+'/check-ins';
    for(const change of [{businessDate:'2026-02-30'},{businessDate:tomorrow,occurredAt:tomorrow+'T12:00:00Z'},
      {timeZone:'America/New_York'},{occurredAt:from+'T12:00:00Z'}]) {
      const failed=await request(route,{method:'POST',body:{...command,...change,clientEventId:randomUUID()},key:randomUUID()});
      assert.ok([400,422].includes(failed.status));
    }
  });
  await t.test('receipt, consolidated value, revision and outbox roll back together',async()=>{
    const route='/habits/'+created.body.id+'/check-ins',key=randomUUID();
    await pool.query(`CREATE FUNCTION core_test_reject() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'synthetic rollback test'; END; $$;
      CREATE TRIGGER core_test_reject BEFORE INSERT ON check_in_revisions FOR EACH ROW EXECUTE FUNCTION core_test_reject()`);
    try {
      const failed=await request(route,{method:'POST',body:{...command,businessDate:from,occurredAt:from+'T12:00:00Z',clientEventId:randomUUID()},key});
      assert.equal(failed.status,503);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM check_ins WHERE habit_id=$1 AND business_date=$2',[created.body.id,from])).rows[0].n,0);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM api_receipts WHERE idempotency_key=$1',[key])).rows[0].n,0);
    } finally {await pool.query('DROP TRIGGER core_test_reject ON check_in_revisions; DROP FUNCTION core_test_reject()');}
  });
  await t.test('future revisions preserve closed days and dashboard reads real tables',async()=>{
    const patch={targetValue:100,schedule:{weekdays:[1,2,3,4,5,6,7],effectiveFrom:tomorrow}};
    const key=randomUUID(),route='/habits/'+created.body.id;
    const updated=await request(route,{method:'PATCH',body:patch,key,match:'"1"',schema:'Habit'});assert.equal(updated.status,200);assert.equal(updated.body.version,2);
    assert.deepEqual((await request(route,{method:'PATCH',body:patch,key,match:'"1"'})).body,updated.body);
    assert.equal((await request(route,{method:'PATCH',body:{name:'Stale edit'},key:randomUUID(),match:'"1"'})).status,409);
    assert.equal((await request(route,{method:'PATCH',body:{name:'Weak tag'},key:randomUUID(),match:'W/"2"'})).status,400);
    assert.equal((await request(route,{method:'PATCH',body:{targetValue:20,schedule:{weekdays:[1],effectiveFrom:today}},key:randomUUID(),match:'"2"'})).status,422);
    const metrics=await request(route+'/metrics?from='+from+'&to='+today,{schema:'Metrics'});assert.equal(metrics.status,200);assert.equal(metrics.body.eligiblePeriods,2);assert.equal(metrics.body.completedPeriods,0);
    const history=await request(route+'/check-ins?from='+from+'&to='+today,{schema:'CheckInList'});assert.equal(history.status,200,JSON.stringify(history.body));assert.equal(history.body.items.length,1);assert.equal(history.body.items[0].version,2);
    const dashboard=await request('/me/dashboard/progress?from='+from+'&to='+today+'&habitId='+created.body.id);assert.equal(dashboard.status,200);assert.equal(dashboard.body.closed.partial,1);
    assert.equal((await pool.query('SELECT habit_revision FROM dashboard_read.v1_check_ins WHERE habit_id=$1',[created.body.id])).rows[0].habit_revision,1);
    const before=await request(route+'/metrics?from=2025-01-01&to=2025-01-02',{schema:'Metrics'});
    assert.equal(before.status,200);assert.equal(before.body.completionRate,null);
    const late={...command,clientEventId:randomUUID(),value:10,expectedVersion:2,correctionReason:'Historical correction'};
    assert.equal((await request(route+'/check-ins',{method:'POST',body:late,key:randomUUID()})).status,200);
    const recalculated=await request(route+'/metrics?from='+from+'&to='+today,{schema:'Metrics'});
    assert.equal(recalculated.body.completedPeriods,1);assert.equal(recalculated.body.currentStreak,1);
    assert.equal((await request('/me/dashboard/progress?from='+from+'&to='+today+'&habitId='+created.body.id)).body.closed.completed,1);
  });
  await t.test('suspension blocks replays; restart preserves receipts and values',async()=>{
    await pool.query("UPDATE profiles SET status='suspended' WHERE id=$1",[owners[0]]);
    assert.equal((await request('/habits',{method:'POST',body:habit,key:creationKey})).status,403);
    await pool.query("UPDATE profiles SET status='active' WHERE id=$1",[owners[0]]);
    await app.close();await start();
    assert.deepEqual((await request('/habits',{method:'POST',body:habit,key:creationKey})).body,created.body);
    assert.equal((await request('/habits/'+created.body.id+'/check-ins?from='+from+'&to='+today)).body.items[0].version,3);
  });
  await t.test('a second writer and an admin never bypass owner scoping',async()=>{
    const other=await request('/habits',{method:'POST',body:{...habit,name:'Owner B habit'},key:randomUUID(),actor:1,schema:'Habit'});
    assert.equal(other.status,201);
    assert.deepEqual((await request('/habits',{actor:1})).body.items.map(h=>h.id),[other.body.id]);
    assert.equal((await request('/habits/'+other.body.id)).status,404);
    assert.equal((await request('/habits/'+created.body.id,{method:'PATCH',body:{name:'Admin bypass'},match:'"2"',key:randomUUID(),actor:1})).status,404);
    assert.equal((await request('/habits/'+created.body.id+'/metrics?from='+from+'&to='+today,{actor:1})).status,404);
  });
  await t.test('migration drift fails without changing the ledger or data',async()=>{
    const original=(await pool.query("SELECT checksum FROM schema_migrations WHERE filename='001_core.sql'")).rows[0].checksum;
    await pool.query("UPDATE schema_migrations SET checksum='invalid-test' WHERE filename='001_core.sql'");
    await assert.rejects(migrate(pool),/checksum mismatch/);
    await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE filename='001_core.sql'",[original]);
    assert.deepEqual(await migrate(pool),[]);
  });
  await t.test('CORS preflight and ETag expose only configured origins',async()=>{
    const allowed=await fetch(base+'/habits',{method:'OPTIONS',headers:{Origin:'http://localhost:5173','Access-Control-Request-Method':'PATCH','Access-Control-Request-Headers':'authorization,if-match,idempotency-key'}});
    assert.equal(allowed.status,204);assert.equal(allowed.headers.get('access-control-allow-origin'),'http://localhost:5173');
    assert.equal(allowed.headers.get('access-control-allow-credentials'),null);
    const denied=await fetch(base+'/habits',{method:'OPTIONS',headers:{Origin:'https://untrusted.test','Access-Control-Request-Method':'GET'}});
    assert.equal(denied.headers.get('access-control-allow-origin'),null);
    const read=await request('/habits/'+created.body.id,{headers:{Origin:'http://localhost:5173'}});
    assert.ok(read.headers.get('access-control-expose-headers').includes('ETag'));
    assert.equal((await request('/habits',{method:'POST',body:'{',key:randomUUID()})).status,400);
  });
  await t.test('SQL failure leaves liveness available and readiness safely unavailable',async()=>{
    expectedSqlOutage=true;
    await pg.stop();
    assert.equal((await request('/health/live',{auth:null})).status,200);
    const ready=await request('/health/ready',{auth:null});assert.equal(ready.status,503);assert.equal(ready.body.code,'NOT_READY');
    assert.equal((await request('/me')).status,503);
    await pg.start();
    assert.equal((await request('/health/ready',{auth:null})).status,200);
    expectedSqlOutage=false;
  });
  await t.test('review writes remain opt-in without disabling read/health',async()=>{
    await app.close();await start({writesEnabled:false});
    assert.equal((await request('/habits',{method:'POST',body:habit,key:randomUUID()})).status,503);
    assert.equal((await request('/habits')).status,200);
    assert.equal((await request('/health/ready',{auth:null})).status,200);
  });
  console.log('PostgreSQL:',(await pool.query('SHOW server_version')).rows[0].server_version);
});
