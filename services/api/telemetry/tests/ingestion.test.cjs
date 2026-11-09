const { test,before,after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { environment } = require('./environment.cjs');
const { makeBatch } = require('../scripts/fixtures.cjs');
const Ajv = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const fs = require('node:fs');
const path = require('node:path');
let e;
before(async () => { e=await environment(); console.info(`Persistencia real: PostgreSQL ${e.databaseVersion}; esquema base: ${e.coreSchema}`); });
after(async () => { if(e) await e.close(); });
const ingest = batch => e.request('/batches',{method:'POST',body:batch});
const grant = (sourceId,expectedVersion,signals) => e.request(`/sources/${sourceId}/consent`,{method:'PUT',body:{expectedVersion,noticeVersion:'synthetic-notice-v1',grants:signals.map(signal=>({signal,purpose:'personal-analytics'}))}});
const batches = async id => (await e.pool.query('SELECT count(*)::integer AS count FROM telemetry_simulation.batches WHERE source_id=$1',[id])).rows[0].count;

test('La migración es repetible y verifica su huella', () => {
  assert.equal(e.firstMigration.applied,true);assert.equal(e.repeatMigration.applied,false);
  assert.equal(e.firstMigration.sha256,e.repeatMigration.sha256);
});
test('Ingesta HTTP confirma filas reales y respuesta conforme al JSON Schema',async () => {
  const f=await e.fixture();const r=await ingest(f.batch);assert.equal(r.status,201);
  const ajv=new Ajv({strict:true});addFormats(ajv);
  const schema=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../../packages/contracts/telemetry/v1/receipt.schema.json'),'utf8'));
  assert.equal(ajv.compile(schema)(r.body),true);
  assert.equal(r.body.acceptedCount,3);assert.equal(await e.count(f.sourceId),3);
  const summary=await e.request(`/sources/${f.sourceId}/summary`);assert.equal(summary.body.items[0].sampleCount,3);
});
test('Lote repetido conserva recibo, filas y conteos sin sumar otra vez',async () => {
  const f=await e.fixture();const first=await ingest(f.batch),replay=await ingest(f.batch);
  assert.equal(replay.status,200);assert.deepEqual(replay.body,first.body);
  assert.equal(await e.count(f.sourceId),3);assert.equal(await batches(f.sourceId),1);
});
test('Un cero explícito de stepCount se conserva sin inventar un check-in de hábito',async () => {
  const f=await e.fixture(['stepCount']);const batch=makeBatch({sourceId:f.sourceId,batchId:randomUUID(),at:f.batch.samples[0].observedAt,signal:'stepCount',count:1});
  assert.equal((await ingest(batch)).status,201);
  const stored=await e.pool.query('SELECT signal,unit,value FROM telemetry_simulation.samples WHERE source_id=$1',[f.sourceId]);
  assert.deepEqual(stored.rows,[{signal:'stepCount',unit:'count',value:0}]);
  const summary=await e.request(`/sources/${f.sourceId}/summary`);assert.equal(summary.body.items[0].sampleCount,1);
  if((await e.pool.query("SELECT to_regclass('public.habits') AS habits")).rows[0].habits) {
    assert.equal((await e.pool.query('SELECT count(*)::integer AS count FROM public.habits')).rows[0].count,0);
    assert.equal((await e.pool.query('SELECT count(*)::integer AS count FROM public.audit_outbox')).rows[0].count,0);
  }
});
test('Reintentos concurrentes confirman un solo lote y una aplicación por muestra',async () => {
  const f=await e.fixture();const results=await Promise.all(Array.from({length:8},()=>ingest(f.batch)));
  assert.equal(results.filter(r=>r.status===201).length,1);
  assert.equal(results.filter(r=>r.status===200).length,7);
  results.forEach(r=>assert.deepEqual(r.body,results[0].body));
  assert.equal(await e.count(f.sourceId),3);assert.equal(await batches(f.sourceId),1);
});
test('Mismo lote con contenido distinto devuelve 409 sin mutaciones',async () => {
  const f=await e.fixture();await ingest(f.batch);f.batch.samples[0].value++;
  const r=await ingest(f.batch);assert.equal(r.status,409);assert.equal(r.body.code,'BATCH_CONTENT_CONFLICT');
  assert.equal(await e.count(f.sourceId),3);assert.equal(await batches(f.sourceId),1);
});
test('Muestra ya recibida en otro lote se informa como duplicada, sin doble métrica',async () => {
  const f=await e.fixture();await ingest(f.batch);
  const r=await ingest({...f.batch,batchId:randomUUID()});
  assert.equal(r.status,201);assert.equal(r.body.acceptedCount,0);assert.equal(r.body.duplicateCount,3);
  assert.equal(await e.count(f.sourceId),3);
  const summary=await e.request(`/sources/${f.sourceId}/summary`);assert.equal(summary.body.items[0].sampleCount,3);
});
test('Colisión de sampleId y mismo instante con otro ID se rechazan sin sustituir valores',async () => {
  const f=await e.fixture();await ingest(f.batch);
  const changed=structuredClone(f.batch);changed.batchId=randomUUID();changed.samples[0].value++;
  assert.equal((await ingest(changed)).body.code,'SAMPLE_CONTENT_CONFLICT');
  changed.samples[0]={...f.batch.samples[0],sampleId:randomUUID()};
  assert.equal((await ingest(changed)).body.code,'SAMPLE_TIME_CONFLICT');
  assert.equal(await e.count(f.sourceId),3);assert.equal(await batches(f.sourceId),1);
});
test('Fuera de orden se acepta informado y no retrocede el último instante observado',async () => {
  const f=await e.fixture();const newest=makeBatch({sourceId:f.sourceId,batchId:randomUUID(),at:new Date(Date.parse(f.consent.consentAt)+10000).toISOString(),count:1});
  await ingest(newest);const late=await ingest(f.batch);assert.equal(late.status,201);assert.equal(late.body.outOfOrderCount,3);
  const summary=await e.request(`/sources/${f.sourceId}/summary`);
  assert.equal(summary.body.items[0].sampleCount,4);assert.equal(summary.body.items[0].latestObservedAt,newest.samples[0].observedAt);
  assert.equal((await ingest(f.batch)).status,200);assert.equal(await e.count(f.sourceId),4);
});
test('Unidad inválida, dato ausente y null rechazan el lote completo, sin ceros inventados',async () => {
  const f=await e.fixture();
  for(const mutate of [s=>s.unit='count',s=>delete s.value,s=>s.value=null]) {
    const batch=structuredClone(f.batch);mutate(batch.samples[2]);
    const r=await ingest(batch);assert.equal(r.status,422);assert.equal(r.body.code,'INVALID_PAYLOAD');
    assert.equal(await e.count(f.sourceId),0);assert.equal(await batches(f.sourceId),0);
  }
});
test('Timestamps imposibles, sin UTC canónico, futuros o anteriores al consentimiento se rechazan',async () => {
  const f=await e.fixture();
  for(const time of ['2026-02-30T12:00:00.000Z','2026-11-08T12:00:00+01:00',new Date(Date.now()+600000).toISOString(),new Date(Date.now()-2*86400000).toISOString()]) {
    const batch=structuredClone(f.batch);batch.samples[0].observedAt=time;assert.equal((await ingest(batch)).status,422);
  }
  const batch=structuredClone(f.batch);batch.samples[0].observedAt=new Date(Date.parse(f.consent.consentAt)-1).toISOString();
  assert.equal((await ingest(batch)).body.code,'SAMPLE_PRECEDES_CONSENT');assert.equal(await e.count(f.sourceId),0);
});
test('Origen, versión desconocida, campos ajenos y permisos no concedidos se rechazan',async () => {
  const f=await e.fixture(['heartRate']);
  for(const field of [{origin:'wear-os'},{schemaVersion:'2.0.0'},{ownerId:e.owners[1]}]) assert.equal((await ingest({...f.batch,...field})).status,422);
  const steps=makeBatch({sourceId:f.sourceId,batchId:randomUUID(),at:f.batch.samples[0].observedAt,signal:'stepCount'});
  assert.equal((await ingest(steps)).body.code,'CONSENT_NOT_CURRENT');assert.equal(await e.count(f.sourceId),0);
});
test('Revocación granular bloquea lote nuevo, repetido y recibos antiguos; conserva historial',async () => {
  const f=await e.fixture();await ingest(f.batch);
  assert.equal((await grant(f.sourceId,1,['stepCount'])).status,200);
  assert.equal((await ingest(f.batch)).body.code,'CONSENT_NOT_CURRENT');
  assert.equal((await ingest({...f.batch,batchId:randomUUID(),consentVersion:2})).status,403);
  assert.equal((await e.request(`/sources/${f.sourceId}/batches/${f.batch.batchId}`)).status,403);
  assert.equal(await e.count(f.sourceId),3);
  const summary=await e.request(`/sources/${f.sourceId}/summary`);assert.deepEqual(summary.body.items,[]);
});
test('Revocación total deniega lecturas y nuevas ingestas, también tras reautorizar una nueva versión',async () => {
  const f=await e.fixture();await ingest(f.batch);await grant(f.sourceId,1,[]);
  assert.equal((await ingest(f.batch)).status,403);
  assert.equal((await e.request(`/sources/${f.sourceId}/summary`)).status,403);
  await grant(f.sourceId,2,['heartRate']);assert.equal((await ingest(f.batch)).status,403);
  const summary=await e.request(`/sources/${f.sourceId}/summary`);assert.deepEqual(summary.body.items,[]);
  assert.equal(await e.count(f.sourceId),3);
});
test('La versión de consentimiento evita que una actualización obsoleta deshaga una revocación',async () => {
  const f=await e.fixture();await grant(f.sourceId,1,[]);
  const r=await grant(f.sourceId,1,['heartRate']);assert.equal(r.status,409);
  const source=await e.request(`/sources/${f.sourceId}`);assert.deepEqual(source.body.grants,[]);
});
test('Reautorizar no reutiliza el máximo temporal ni datos de una versión de consentimiento anterior',async () => {
  const f=await e.fixture(['heartRate']);
  const old=makeBatch({sourceId:f.sourceId,batchId:randomUUID(),at:new Date(Date.parse(f.consent.consentAt)+100000).toISOString(),count:1});
  await ingest(old);await grant(f.sourceId,1,[]);
  const current=await grant(f.sourceId,2,['heartRate']);
  const batch=makeBatch({sourceId:f.sourceId,batchId:randomUUID(),consentVersion:3,at:new Date(Date.parse(current.body.consentAt)+1000).toISOString(),count:1});
  const r=await ingest(batch);assert.equal(r.status,201);assert.equal(r.body.outOfOrderCount,0);
  const summary=await e.request(`/sources/${f.sourceId}/summary`);assert.equal(summary.body.items[0].sampleCount,1);
});
test('La desvinculación de la fuente deniega nuevos lotes, lecturas y permisos',async () => {
  const f=await e.fixture();await ingest(f.batch);
  assert.equal((await e.request(`/sources/${f.sourceId}`,{method:'DELETE'})).status,200);
  assert.equal((await ingest(f.batch)).body.code,'SOURCE_REVOKED');
  assert.equal((await grant(f.sourceId,2,['heartRate'])).status,403);
  assert.equal(await e.count(f.sourceId),3);
});
test('Otro dueño, incluso admin, recibe 404 y no puede consultar, ingerir ni revocar',async () => {
  const f=await e.fixture();
  for(const [route,method,body] of [[`/sources/${f.sourceId}`,'GET'],[`/sources/${f.sourceId}`,'DELETE'],
    ['/batches','POST',f.batch],[`/sources/${f.sourceId}/summary`,'GET'],
    [`/sources/${f.sourceId}/consent`,'PUT',{expectedVersion:1,noticeVersion:'synthetic-notice-v1',grants:[]}]]) {
    assert.equal((await e.request(route,{method,body,actor:1})).status,404);
  }
  assert.equal(await e.count(f.sourceId),0);
});
test('Sin JWT, ID token, audiencia incorrecta y perfil suspendido no obtienen acceso',async () => {
  const f=await e.fixture();
  assert.equal((await e.request(`/sources/${f.sourceId}`,{authorization:null})).status,401);
  assert.equal((await e.request(`/sources/${f.sourceId}`,{authorization:'Bearer inválido'})).status,401);
  const idToken=await e.token('synthetic-a',{typ:'ID'});
  assert.equal((await e.request(`/sources/${f.sourceId}`,{authorization:`Bearer ${idToken}`})).status,401);
  for (const options of [{audience:'wrong-api'},{issuer:'https://wrong-issuer.invalid'},{expiration:'-1s'}]) {
    const invalid=await e.token('synthetic-a',{},options);
    assert.equal((await e.request(`/sources/${f.sourceId}`,{authorization:`Bearer ${invalid}`})).status,401);
  }
  // El token tiene firma válida pero no corresponde a un perfil provisionado.
  const stranger=await e.token('not-provisioned');assert.equal((await e.request(`/sources/${f.sourceId}`,{authorization:`Bearer ${stranger}`})).status,403);
  await e.pool.query("UPDATE public.profiles SET status='suspended' WHERE id=$1",[e.owners[0]]);
  try { assert.equal((await ingest(f.batch)).status,403); }
  finally { await e.pool.query("UPDATE public.profiles SET status='active' WHERE id=$1",[e.owners[0]]); }
});
test('Límite de muestras, JSON malformado y tamaño máximo no dejan escrituras',async () => {
  const f=await e.fixture();const batch=structuredClone(f.batch);batch.samples=Array(101).fill(batch.samples[0]);
  assert.equal((await ingest(batch)).status,422);
  assert.equal((await e.request('/batches',{method:'POST',body:'{"invalid":'})).status,400);
  assert.equal((await e.request('/batches',{method:'POST',body:{padding:'a'.repeat(70000)}})).status,413);
  assert.equal(await e.count(f.sourceId),0);
});
test('Un fallo después de insertar el recibo hace rollback de recibo y muestras',async () => {
  const f=await e.fixture();
  // Falla de persistencia real, no mock del repositorio.
  await e.pool.query(`CREATE FUNCTION telemetry_simulation.test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$;
    CREATE TRIGGER test_fail BEFORE INSERT ON telemetry_simulation.samples FOR EACH ROW EXECUTE FUNCTION telemetry_simulation.test_fail()`);
  try {const r=await ingest(f.batch);assert.equal(r.status,503);assert.equal(r.body.code,'DEPENDENCY_UNAVAILABLE');assert.ok(!JSON.stringify(r.body).includes('synthetic failure'));}
  finally {await e.pool.query('DROP TRIGGER test_fail ON telemetry_simulation.samples; DROP FUNCTION telemetry_simulation.test_fail()');}
  assert.equal(await e.count(f.sourceId),0);assert.equal(await batches(f.sourceId),0);
  assert.equal((await ingest(f.batch)).status,201);
});
test('Un lote pendiente espera la revocación y vuelve a comprobar permiso antes de escribir',async () => {
  const f=await e.fixture(),client=await e.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("UPDATE telemetry_simulation.sources SET grants='[]',consent_version=2,consent_at=date_trunc('milliseconds',clock_timestamp()) WHERE id=$1",[f.sourceId]);
    await client.query(`INSERT INTO telemetry_simulation.consent_revisions(source_id,version,notice_version,grants,recorded_at)
      SELECT id,consent_version,'synthetic-notice-v1',grants,consent_at FROM telemetry_simulation.sources WHERE id=$1`,[f.sourceId]);
    const pending=ingest(f.batch);
    // La barrera es el lock visible en PostgreSQL; no se supone un orden por reloj del cliente.
    let waiting=false;
    for(let i=0;i<100;i++) {
      const locks=await e.pool.query("SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE 'SELECT * FROM telemetry_simulation.sources%'");
      if(locks.rowCount){waiting=true;break;}
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    await client.query('COMMIT');const r=await pending;
    assert.equal(waiting,true);assert.equal(r.status,403);assert.equal(await e.count(f.sourceId),0);
  } finally {await client.query('ROLLBACK');client.release();}
});
test('Un reinicio de API mantiene deduplicación durable y el mismo recibo',async () => {
  const f=await e.fixture();const first=await ingest(f.batch);await e.restart();
  const replay=await ingest(f.batch);assert.equal(replay.status,200);assert.deepEqual(replay.body,first.body);
  assert.equal(await e.count(f.sourceId),3);
});
