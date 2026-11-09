const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { environment } = require('../tests/environment.cjs');
const { makeBatch } = require('./fixtures.cjs');
(async () => {
  const e = await environment();
  try {
    const fixture = await e.fixture();
    const cases = [];
    async function record(name,batch,status) {
      const result = await e.request('/batches',{method:'POST',body:batch});
      assert.equal(result.status,status,name);
      const rows = await e.pool.query(`SELECT
        (SELECT count(*)::integer FROM telemetry_simulation.batches WHERE source_id=$1) AS batches,
        (SELECT count(*)::integer FROM telemetry_simulation.samples WHERE source_id=$1) AS samples`,[fixture.sourceId]);
      cases.push({ case:name,httpStatus:result.status,result:result.body,persistence:rows.rows[0] });
      return result;
    }
    const first = await record('valid',fixture.batch,201);
    const repeat = await record('repeated',fixture.batch,200);
    assert.deepEqual(repeat.body,first.body);assert.equal(await e.count(fixture.sourceId),3);
    const late = makeBatch({sourceId:fixture.sourceId,batchId:randomUUID(),at:fixture.consent.consentAt,count:1});
    assert.equal((await record('out-of-order',late,201)).body.outOfOrderCount,1);
    const invalid = makeBatch({sourceId:fixture.sourceId,batchId:randomUUID(),at:new Date(Date.parse(fixture.consent.consentAt)+10000).toISOString(),count:1});
    invalid.samples[0].unit='invalid';await record('invalid-unit',invalid,422);
    delete invalid.samples[0].value;invalid.samples[0].unit='bpm';await record('missing-value',invalid,422);
    const before = await e.request(`/sources/${fixture.sourceId}/summary`);
    assert.equal(before.body.items[0].sampleCount,4);
    await e.restart();
    await record('repeated-after-api-restart',fixture.batch,200);assert.equal(await e.count(fixture.sourceId),4);
    const revoked = await e.request(`/sources/${fixture.sourceId}/consent`,{method:'PUT',body:{expectedVersion:1,noticeVersion:'synthetic-notice-v1',grants:[]}});
    assert.equal(revoked.status,200);
    await record('revoked-repeated',fixture.batch,403);
    await record('revoked-new',{...fixture.batch,batchId:randomUUID(),consentVersion:2},403);
    const denied = await e.request(`/sources/${fixture.sourceId}/summary`);assert.equal(denied.status,403);
    assert.equal(await e.count(fixture.sourceId),4);
    const artifacts = {};
    const root = path.resolve(__dirname,'../../../..');
    for (const name of ['packages/contracts/telemetry/v1/batch.schema.json','services/api/telemetry/src/service.ts',
      'services/api/telemetry/db/001_telemetry_simulation.sql','services/api/telemetry/package-lock.json']) {
      artifacts[name] = createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
    }
    const dependencyHash = process.env.TELEMETRY_CORE_SCHEMA_FILE ? createHash('sha256').update(fs.readFileSync(process.env.TELEMETRY_CORE_SCHEMA_FILE)).digest('hex') : null;
    const implementationPaths = ['services/api/telemetry/src','services/api/telemetry/db',
      'services/api/telemetry/package.json','services/api/telemetry/package-lock.json','packages/contracts/telemetry/v1'];
    const dirty = execFileSync('git',['status','--porcelain','--',...implementationPaths],{encoding:'utf8',cwd:root}).trim();
    console.info(JSON.stringify({ task:'QUANCORE-35',executedAt:new Date().toISOString(),
      baseCommit:execFileSync('git',['merge-base','HEAD','develop'],{encoding:'utf8',cwd:root}).trim(),
      headCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',cwd:root}).trim(),
      implementationCommit:execFileSync('git',['log','-1','--format=%H','--',...implementationPaths],{encoding:'utf8',cwd:root}).trim() || null,
      branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8',cwd:root}).trim(),
      workingTree:dirty ? 'Cambios locales de implementación; hashes identifican los artefactos probados.' : 'Artefactos de implementación versionados en implementationCommit.',
      environment:{os:process.platform,arch:process.arch,node:process.version,postgres:e.databaseVersion,
        identity:'JWT RS256 y JWKS sintéticos en loopback; no Keycloak real',coreSchema:e.coreSchema,dependencySchemaSha256:dependencyHash},
      query:'SELECT count(*) FROM telemetry_simulation.batches/samples WHERE source_id = $1',
      cases,summaryBeforeRevocation:before.body,summaryAfterRevocation:denied,
      artifacts,limitations:['Solo datos sintéticos','QUANCORE-22 no fusionado: solo compatibilidad SQL','QUANCORE-43/ADR pendientes de revisión','Sin MongoDB/Redis/Wear OS ni despliegue productivo'] },null,2));
  } finally { await e.close(); }
})().catch(() => { console.error('No se completó la evidencia sintética. Ejecutar npm test para diagnóstico; no se imprimen secretos.'); process.exitCode=1; });
