const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {environment}=require('../tests/environment.cjs');
const {installDashboard,seedDashboard}=require('../tests/dashboard-fixture.cjs');
(async()=>{
  const e=await environment({dashboard:true});
  try {
    await installDashboard(e.pool);const f=await seedDashboard(e);const cases=[];
    async function read(name,kind='progress',extra='',options={},expected=200) {
      const result=await e.request(`/me/dashboard/${kind}?${f.qs}${extra}`,options);
      assert.equal(result.status,expected,name);
      const counts=(await e.pool.query(`SELECT count(*)::integer AS records,
        count(*) FILTER(WHERE value=0)::integer AS explicit_zero FROM dashboard_fixture.check_ins WHERE owner_id=$1`,[f.owner])).rows[0];
      cases.push({case:name,httpStatus:result.status,response:result.body,postgres:counts});return result;
    }
    const initial=await read('progress-persisted');assert.equal(initial.body.closed.completionRate,33.33);
    await read('calendar-persisted','calendar');await read('trends-persisted','trends','&bucket=day');
    const other=await read('other-owner-empty','progress','',{actor:1});assert.equal(other.body.closed.completionRate,null);
    await read('other-owner-filtered','progress','&habitId='+f.h1,{actor:1},404);
    await e.pool.query('UPDATE dashboard_fixture.check_ins SET value=20,version=version+1 WHERE habit_id=$1 AND business_date=$2',[f.h1,f.to]);
    const corrected=await read('confirmed-correction');assert.equal(corrected.body.closed.completionRate,50);
    const repeat=await read('repeated-read');assert.deepEqual(repeat.body.closed,corrected.body.closed);
    await e.restart();assert.deepEqual((await read('after-api-restart')).body.closed,corrected.body.closed);
    await e.pool.query('ALTER VIEW dashboard_read.v1_check_ins RENAME TO missing');
    try {await read('source-unavailable','progress','',{},503);}
    finally {await e.pool.query('ALTER VIEW dashboard_read.missing RENAME TO v1_check_ins');}
    await read('client-clock-rejected','progress','&asOf=2026-01-01',{},400);
    const root=path.resolve(__dirname,'../../../..'),artifacts={};
    for(const file of ['packages/contracts/dashboard/v1/read-input.schema.json','packages/contracts/dashboard/v1/openapi.json',
      'services/api/telemetry/src/modules/dashboard/model.ts','services/api/telemetry/src/modules/dashboard/service.ts',
      'services/api/telemetry/tests/dashboard.test.cjs','services/api/telemetry/tests/dashboard-fixture.cjs','services/api/telemetry/package-lock.json']) {
      artifacts[file]=createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
    }
    console.info(JSON.stringify({task:'QUANCORE-25',executedAt:new Date().toISOString(),
      headCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
      implementationCommit:execFileSync('git',['log','-1','--format=%H','--','services/api/telemetry/src/modules/dashboard'],{cwd:root,encoding:'utf8'}).trim(),
      environment:{node:process.version,os:process.platform,arch:process.arch,postgres:e.databaseVersion,
        identity:'RS256/JWKS sintéticos; no Keycloak/PKCE real',data:'Registros sintéticos persistidos en tablas de fixture y consultados por vistas SQL'},
      cases,artifacts,limitations:['Backend escritor de hábitos/check-ins no integrado','Puerto SQL v1 pendiente de adaptación/revisión backend y BD',
        'Sin datos personales reales, frontend nuevo ni despliegue productivo','D-03/04 y entorno QUANCORE-43 pendientes','Sin merge ni publicación de esta tarea']},null,2));
  } finally {await e.close();}
})().catch(()=>{console.error('Evidencia dashboard no completada. Revisar npm test; no se imprimen secretos.');process.exitCode=1;});
