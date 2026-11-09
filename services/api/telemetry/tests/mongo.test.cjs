const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {mongoEnvironment}=require('./mongo-environment.cjs');
const {definition}=require('../scripts/mongo-schema.cjs');
let e;
before(async()=>{e=await mongoEnvironment();console.info(`MongoDB real ${e.mongoVersion}, PostgreSQL ${e.databaseVersion}; usuario runtime con find/insert por colección.`);});
after(async()=>{if(e)await e.close();});
const ingest=batch=>e.request('/batches',{method:'POST',body:batch});
const project=id=>e.request(`/sources/${id}/mongodb/project`,{method:'POST'});
const events=id=>e.request(`/sources/${id}/events`);
const audit=id=>e.request(`/sources/${id}/audit`);
const count=id=>e.mongo.collection('telemetry_events').countDocuments({sourceId:id});
test('Colecciones reales tienen validación estricta, unicidad y TTL versionados',async()=>{
  const config=await definition();
  assert.deepEqual(JSON.parse(fs.readFileSync(path.resolve(__dirname,'../db/mongodb.generated.json'),'utf8')),config);
  for(const [name,spec] of Object.entries(config.collections)) {
    const collection=await e.mongo.listCollections({name}).next();assert.deepEqual(collection.options.validator,spec.validator);
    const indexes=await e.mongo.collection(name).indexes();assert.ok(indexes.some(i=>i.name==='event_unique'&&i.unique));
    assert.ok(indexes.some(i=>i.name==='expiry'&&i.expireAfterSeconds===0));
  }
});
test('Ingesta y consulta exponen un evento con dueño, origen, tiempos, versión y unidades',async()=>{
  const f=await e.fixture();assert.equal((await ingest(f.batch)).status,201);
  const r=await project(f.sourceId);assert.equal(r.status,200);assert.equal(r.body.pending,0);
  const list=await events(f.sourceId);assert.equal(list.status,200);assert.equal(list.body.items.length,1);
  const event=list.body.items[0];assert.equal(event.ownerId,e.owners[0]);assert.equal(event.origin,'synthetic-generator');
  assert.equal(event.samples.length,3);assert.equal(event.samples[0].unit,'bpm');assert.equal(event.schemaVersion,'1.0.0');
  const stored=await e.mongo.collection('telemetry_events').findOne({eventId:event.eventId});
  assert.ok(stored.receivedAt instanceof Date);assert.ok(stored.samples[0].observedAt instanceof Date);
  const trace=await audit(f.sourceId);assert.equal(trace.body.items.length,3);
  assert.ok(trace.body.items.every(i=>!('samples'in i)&&!('value'in i)&&!('token'in i)));
});
test('Lotes repetidos y proyecciones concurrentes no duplican documentos ni métricas',async()=>{
  const f=await e.fixture();await ingest(f.batch);await ingest(f.batch);
  const results=await Promise.all([project(f.sourceId),project(f.sourceId),project(f.sourceId)]);
  assert.ok(results.every(r=>r.status===200));assert.equal(await count(f.sourceId),1);assert.equal(await e.count(f.sourceId),3);
  const sql=await e.pool.query('SELECT count(*)::integer AS count FROM telemetry_simulation.audit_events WHERE source_id=$1 AND action=\'batch.accepted\'',[f.sourceId]);
  assert.equal(sql.rows[0].count,1);
});
test('Respuesta perdida después de insertar en Mongo se reintenta comparando el documento',async()=>{
  const f=await e.fixture();await ingest(f.batch);await project(f.sourceId);
  await e.pool.query("UPDATE telemetry_simulation.mongo_outbox SET state='pending',delivered_at=NULL WHERE source_id=$1",[f.sourceId]);
  const r=await project(f.sourceId);assert.equal(r.body.duplicates,4);assert.equal(await count(f.sourceId),1);
});
test('Datos inválidos y solicitudes sin permiso no generan hechos ni auditoría falsa',async()=>{
  const f=await e.fixture();const invalid=structuredClone(f.batch);delete invalid.samples[1].value;
  assert.equal((await ingest(invalid)).status,422);invalid.samples[1].value=10;invalid.samples[1].unit='count';
  assert.equal((await ingest(invalid)).status,422);
  assert.equal((await e.request('/batches',{method:'POST',body:f.batch,actor:1})).status,404);
  await project(f.sourceId);assert.equal(await count(f.sourceId),0);assert.equal((await audit(f.sourceId)).body.items.length,2);
  for(const route of ['events','audit','mongodb/project'])assert.equal((await e.request(`/sources/${f.sourceId}/${route}`,{method:route.includes('project')?'POST':'GET',actor:1})).status,404);
});
test('Revocación descarta señales pendientes y oculta las entregadas, conservando auditoría mínima',async()=>{
  const f=await e.fixture();await ingest(f.batch);await project(f.sourceId);
  const next=structuredClone(f.batch);next.batchId=randomUUID();next.samples[0].sampleId=randomUUID();
  next.samples[0].observedAt=new Date(Date.parse(next.samples[0].observedAt)+10000).toISOString();await ingest(next);
  await e.request(`/sources/${f.sourceId}/consent`,{method:'PUT',body:{expectedVersion:1,noticeVersion:'synthetic-notice-v1',grants:[]}});
  const r=await project(f.sourceId);assert.equal(r.body.discarded,1);assert.equal(await count(f.sourceId),1);
  assert.equal((await events(f.sourceId)).status,403);assert.equal((await audit(f.sourceId)).status,200);
});
test('MongoDB rechaza unidad inválida, valor ausente, versión extra y datos en auditoría',async()=>{
  const f=await e.fixture();await ingest(f.batch);await project(f.sourceId);
  const original=await e.mongo.collection('telemetry_events').findOne({sourceId:f.sourceId});
  for(const mutate of [d=>d.samples[0].unit='count',d=>delete d.samples[0].value,d=>d.schemaVersion='2.0.0',d=>d.token='forbidden']) {
    const d=structuredClone(original);d._id=randomUUID();d.eventId=d._id;mutate(d);
    await assert.rejects(()=>e.mongo.collection('telemetry_events').insertOne(d),error=>error.code===121);
  }
  const a=await e.mongo.collection('audit_events').findOne({sourceId:f.sourceId});a._id=randomUUID();a.eventId=a._id;a.samples=[];
  await assert.rejects(()=>e.mongo.collection('audit_events').insertOne(a),error=>error.code===121);
});
test('Usuario runtime no puede modificar, borrar, cambiar índices ni leer colecciones ajenas',async()=>{
  const f=await e.fixture();await ingest(f.batch);await project(f.sourceId);
  for(const op of [()=>e.runtime.collection('telemetry_events').deleteMany({}),()=>e.runtime.collection('telemetry_events').updateMany({},{$set:{value:0}}),
    ()=>e.runtime.collection('telemetry_events').createIndex({sourceId:1}),()=>e.runtime.collection('private_profiles').findOne({})]) {
    await assert.rejects(op,error=>error.code===13);
  }
  await assert.rejects(()=>e.pool.query("UPDATE telemetry_simulation.audit_events SET action='source.revoked' WHERE source_id=$1",[f.sourceId]));
  await assert.rejects(()=>e.runtime.collection('audit_events').insertOne({_id:randomUUID()},{bypassDocumentValidation:true}),error=>error.code===13);
});
test('Revocación espera al proyector sin transacción SQL abierta durante MongoDB',async()=>{
  const f=await e.fixture();await ingest(f.batch);await e.block();
  const publishing=project(f.sourceId);
  let idleLock=false;
  for(let i=0;i<100;i++) {
    const locks=await e.pool.query("SELECT a.state FROM pg_stat_activity a JOIN pg_locks l ON a.pid=l.pid WHERE l.locktype='advisory' AND l.granted");
    if(locks.rows.some(r=>r.state==='idle')){idleLock=true;break;}
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  const revoking=e.request(`/sources/${f.sourceId}/consent`,{method:'PUT',body:{expectedVersion:1,noticeVersion:'synthetic-notice-v1',grants:[]}});
  let waiting=false;
  for(let i=0;i<100;i++) {
    const locks=await e.pool.query("SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted");
    if(locks.rowCount){waiting=true;break;}
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  assert.equal((await publishing).status,200);assert.equal((await revoking).status,200);
  assert.equal(idleLock,true);assert.equal(waiting,true);assert.equal((await events(f.sourceId)).status,403);
  await e.fail(false);
});
test('Fallo real de Mongo mantiene outbox pendiente y permite recuperar sin doble efecto',async()=>{
  const f=await e.fixture();await ingest(f.batch);await e.fail(true);
  try {assert.equal((await project(f.sourceId)).status,503);assert.equal(await count(f.sourceId),0);}
  finally {await e.fail(false);}
  assert.equal((await project(f.sourceId)).status,200);assert.equal(await count(f.sourceId),1);
  assert.equal(await e.count(f.sourceId),3);
});
test('Recuperar una proyección perdida reutiliza IDs y no duplica progreso SQL',async()=>{
  const f=await e.fixture();await ingest(f.batch);await project(f.sourceId);
  const original=(await events(f.sourceId)).body.items[0];
  await e.mongo.collection('telemetry_events').deleteOne({eventId:original.eventId});
  await e.pool.query("UPDATE telemetry_simulation.mongo_outbox SET state='pending',delivered_at=NULL WHERE source_id=$1 AND kind='telemetry.batch.accepted'",[f.sourceId]);
  await project(f.sourceId);assert.deepEqual((await events(f.sourceId)).body.items[0],original);assert.equal(await e.count(f.sourceId),3);
});
test('Expiración no se prolonga al recuperar; consulta excluye TTL pendiente de limpieza',async()=>{
  const f=await e.fixture();await ingest(f.batch);await project(f.sourceId);
  const original=(await events(f.sourceId)).body.items[0];
  await e.mongo.collection('telemetry_events').updateOne({sourceId:f.sourceId},{$set:{expiresAt:new Date(Date.now()-1000)}});
  assert.deepEqual((await events(f.sourceId)).body.items,[]);
  await e.pool.query("UPDATE telemetry_simulation.mongo_outbox SET state='pending',delivered_at=NULL WHERE source_id=$1 AND kind='telemetry.batch.accepted'",[f.sourceId]);
  await assert.rejects(()=>e.pool.query('UPDATE telemetry_simulation.audit_events SET occurred_at=now() WHERE source_id=$1',[f.sourceId]));
  // Si un backup se alteró, la recuperación no sobrescribe ni extiende su TTL.
  const recovered=await project(f.sourceId);
  if(recovered.status===409)assert.equal(recovered.body.code,'PROJECTION_CONTENT_CONFLICT');
  else {assert.equal(recovered.status,200);assert.equal((await events(f.sourceId)).body.items[0].expiresAt,original.expiresAt);}
});
test('Un pendiente histórico expirado se descarta sin recrear ni extender la retención',async()=>{
  const f=await e.fixture();const batchId=randomUUID(),old=new Date(Date.now()-25*3600000).toISOString();
  // Fixture histórico SQL; no se permite introducir timestamps de servidor desde HTTP.
  const receipt={schemaVersion:'1.0.0',sourceId:f.sourceId,batchId,consentVersion:1,receivedAt:old,acceptedCount:0,duplicateCount:0,outOfOrderCount:0};
  await e.pool.query(`INSERT INTO telemetry_simulation.batches(source_id,batch_id,consent_version,request_hash,receipt)
    VALUES ($1,$2,1,$3,$4)`,[f.sourceId,batchId,'0'.repeat(64),JSON.stringify(receipt)]);
  const r=await project(f.sourceId);assert.equal(r.body.discarded,1);assert.equal(await count(f.sourceId),0);
});
test('Reinicio conserva documentos y consulta respeta límite y pertenencia',async()=>{
  const f=await e.fixture();await ingest(f.batch);await project(f.sourceId);const before=(await events(f.sourceId)).body;
  await e.restart();assert.deepEqual((await events(f.sourceId)).body,before);
  assert.equal((await e.request(`/sources/${f.sourceId}/events?limit=0`)).status,400);
  assert.equal((await e.request(`/sources/${f.sourceId}/events?limit=101`)).status,400);
});
