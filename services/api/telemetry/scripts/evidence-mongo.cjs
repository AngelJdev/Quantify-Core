const fs=require('node:fs');
const path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {mongoEnvironment}=require('../tests/mongo-environment.cjs');
(async()=>{
  const e=await mongoEnvironment();
  try {
    const f=await e.fixture();const cases=[];
    const project=()=>e.request(`/sources/${f.sourceId}/mongodb/project`,{method:'POST'});
    const ingest=batch=>e.request('/batches',{method:'POST',body:batch});
    async function record(name,result,expected) {
      assert.equal(result.status,expected,name);
      const counts=(await e.pool.query(`SELECT
        (SELECT count(*)::integer FROM telemetry_simulation.samples WHERE source_id=$1) AS samples,
        (SELECT count(*)::integer FROM telemetry_simulation.batches WHERE source_id=$1) AS batches,
        (SELECT count(*)::integer FROM telemetry_simulation.audit_events WHERE source_id=$1) AS audit,
        (SELECT count(*)::integer FROM telemetry_simulation.mongo_outbox WHERE source_id=$1 AND state='pending') AS pending`,[f.sourceId])).rows[0];
      cases.push({case:name,httpStatus:result.status,response:result.body,postgres:counts,mongo:{
        telemetry:await e.mongo.collection('telemetry_events').countDocuments({sourceId:f.sourceId}),
        audit:await e.mongo.collection('audit_events').countDocuments({sourceId:f.sourceId})}});
    }
    await record('ingest-valid',await ingest(f.batch),201);await record('project-valid',await project(),200);
    const event=(await e.request(`/sources/${f.sourceId}/events`)).body.items[0];assert.equal(event.samples.length,3);
    await record('ingest-repeated',await ingest(f.batch),200);await record('project-repeated',await project(),200);
    await e.pool.query("UPDATE telemetry_simulation.mongo_outbox SET state='pending',delivered_at=NULL WHERE source_id=$1",[f.sourceId]);
    const replay=await project();assert.equal(replay.body.duplicates,4);await record('lost-ack-recovery',replay,200);
    await e.mongo.collection('telemetry_events').deleteOne({eventId:event.eventId});
    await e.pool.query("UPDATE telemetry_simulation.mongo_outbox SET state='pending',delivered_at=NULL WHERE source_id=$1 AND kind='telemetry.batch.accepted'",[f.sourceId]);
    await record('lost-projection-recovery',await project(),200);
    assert.deepEqual((await e.request(`/sources/${f.sourceId}/events`)).body.items[0],event);
    const invalid=structuredClone(f.batch);invalid.samples[0].unit='invalid';await record('invalid-unit',await ingest(invalid),422);
    delete invalid.samples[0].value;invalid.samples[0].unit='bpm';await record('missing-value',await ingest(invalid),422);
    await record('other-owner-admin',await e.request(`/sources/${f.sourceId}/events`,{actor:1}),404);
    const next=structuredClone(f.batch);next.batchId=randomUUID();next.samples[0].sampleId=randomUUID();
    next.samples[0].observedAt=new Date(Date.parse(next.samples[0].observedAt)+10000).toISOString();await ingest(next);
    await e.request(`/sources/${f.sourceId}/consent`,{method:'PUT',body:{expectedVersion:1,noticeVersion:'synthetic-notice-v1',grants:[]}});
    const revoked=await project();assert.equal(revoked.body.discarded,1);await record('revoked-pending',revoked,200);
    await record('revoked-query',await e.request(`/sources/${f.sourceId}/events`),403);
    const root=path.resolve(__dirname,'../../../..');const artifacts={};
    for(const file of ['packages/contracts/events/telemetry/v1/batch-event.schema.json','services/api/telemetry/src/mongo.ts',
      'services/api/telemetry/src/service.ts','services/api/telemetry/db/002_mongo_outbox.sql','services/api/telemetry/db/mongodb.generated.json','services/api/telemetry/package-lock.json']) {
      artifacts[file]=createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
    }
    console.info(JSON.stringify({task:'QUANCORE-22',executedAt:new Date().toISOString(),
      headCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
      implementationCommit:execFileSync('git',['log','-1','--format=%H','--','services/api/telemetry/src/mongo.ts'],{cwd:root,encoding:'utf8'}).trim(),
      environment:{os:process.platform,arch:process.arch,node:process.version,mongo:e.mongoVersion,postgres:e.databaseVersion,
        identity:'JWT/JWKS sintéticos; no Keycloak real',mongoRuntimeRole:'Solo find/insert sobre dos colecciones; autenticación habilitada'},
      cases,artifacts,limitations:['QUANCORE-43 pendiente: ADR propuesto','Solo datos sintéticos','Sin cloud, Wear OS ni logs de biometría','Recuperación local no acredita backup/RPO/RTO QUANCORE-44']},null,2));
  } finally {await e.close();}
})().catch(()=>{console.error('Evidencia MongoDB no completada. Revisar npm test; no se imprimen secretos.');process.exitCode=1;});
