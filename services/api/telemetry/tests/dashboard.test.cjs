const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {environment}=require('./environment.cjs');
const {installDashboard,seedDashboard,portViews}=require('./dashboard-fixture.cjs');
let e,f;
before(async()=>{e=await environment({dashboard:true});await installDashboard(e.pool);f=await seedDashboard(e);});
after(async()=>{if(e)await e.close();});
const request=(kind='progress',query=f.qs,options={})=>e.request(`/me/dashboard/${kind}?${query}`,options);
test('El módulo está deshabilitado sin opt-in y no consulta un origen inexistente como vacío',async()=>{
  const disabled=await environment();
  try {const r=await disabled.request(`/me/dashboard/progress?${f.qs}`);assert.equal(r.status,503);assert.equal(r.body.code,'DASHBOARD_NOT_ENABLED');}
  finally {await disabled.close();}
});
test('Progreso HTTP desde registros SQL: completos, parcial, cero y ausencias distintos',async()=>{
  const r=await request();assert.equal(r.status,200);
  assert.deepEqual(r.body.closed,{opportunities:6,recorded:4,completed:2,partial:1,explicitZero:1,missing:2,completionRate:33.33,coverageRate:66.67,noDataReason:null});
  assert.equal(r.body.window.source,'postgresql-check-ins');assert.deepEqual(r.body.window.timeZones,['UTC']);
});
test('Calendario conserva fechas y denominadores; tendencias diarias son consistentes',async()=>{
  const calendar=await request('calendar');assert.equal(calendar.status,200);assert.equal(calendar.body.days.length,3);
  assert.deepEqual(calendar.body.days.map(d=>d.closed.completionRate),[100,0,0]);
  const trends=await request('trends',f.qs+'&bucket=day');assert.equal(trends.status,200);
  assert.deepEqual(trends.body.points.map(p=>p.closed),calendar.body.days.map(d=>d.closed));assert.equal(trends.body.changePercentagePoints,-100);
});
test('Filtrar hábito respeta meta histórica, día abierto y futuro separados',async()=>{
  const r=await request('progress',`from=${f.from}&to=${f.day(1)}&habitId=${f.h1}`);
  assert.equal(r.status,200);assert.equal(r.body.closed.completed,1);assert.equal(r.body.closed.partial,1);
  assert.equal(r.body.open.opportunities,1);assert.equal(r.body.open.missing,1);assert.equal(r.body.futureOpportunities,1);
});
test('Otro usuario y un admin no reciben estadísticas ni identificadores de A',async()=>{
  const other=await request('progress',f.qs,{actor:1});assert.equal(other.status,200);assert.equal(other.body.closed.opportunities,0);
  assert.equal(other.body.closed.completionRate,null);
  const denied=await request('progress',f.qs+'&habitId='+f.h1,{actor:1});assert.equal(denied.status,404);assert.equal(denied.body.code,'HABIT_NOT_FOUND');
  assert.equal((await request('calendar',f.qs,{authorization:null})).status,401);
});
test('Corrección confirmada cambia agregados sin sumar intentos ni alterar otros hábitos',async()=>{
  const prior=(await request()).body;
  await e.pool.query('UPDATE dashboard_fixture.check_ins SET value=20,version=version+1 WHERE habit_id=$1 AND business_date=$2',[f.h1,f.to]);
  try {
    const r=await request();assert.equal(r.body.closed.completed,3);assert.equal(r.body.closed.completionRate,50);
    assert.equal(r.body.closed.opportunities,prior.closed.opportunities);assert.equal(r.body.closed.recorded,prior.closed.recorded);
    assert.deepEqual((await request()).body.closed,r.body.closed);
  } finally {await e.pool.query('UPDATE dashboard_fixture.check_ins SET value=5,version=version+1 WHERE habit_id=$1 AND business_date=$2',[f.h1,f.to]);}
});
test('Origen ausente devuelve 503, no un dashboard vacío inventado',async()=>{
  await e.pool.query('ALTER VIEW dashboard_read.v1_check_ins RENAME TO unavailable');
  try {const r=await request();assert.equal(r.status,503);assert.equal(r.body.code,'DASHBOARD_SOURCE_NOT_READY');}
  finally {await e.pool.query('ALTER VIEW dashboard_read.unavailable RENAME TO v1_check_ins');}
});
test('Unidad inválida y revisiones ambiguas del origen se rechazan, sin modificarlo',async()=>{
  await e.pool.query("UPDATE dashboard_fixture.check_ins SET unit='ml' WHERE habit_id=$1 AND business_date=$2",[f.h1,f.to]);
  try {assert.equal((await request()).body.code,'DASHBOARD_INVALID_SOURCE');}
  finally {await e.pool.query("UPDATE dashboard_fixture.check_ins SET unit='min' WHERE habit_id=$1",[f.h1]);}
  await e.pool.query(`INSERT INTO dashboard_fixture.revisions SELECT habit_id,owner_id,3,effective_from,time_zone,weekdays,target_value,unit,status
    FROM dashboard_fixture.revisions WHERE habit_id=$1 AND revision=2`,[f.h1]);
  try {assert.equal((await request()).body.code,'DASHBOARD_INVALID_SOURCE');}
  finally {await e.pool.query('DELETE FROM dashboard_fixture.revisions WHERE habit_id=$1 AND revision=3',[f.h1]);}
});
test('Una vista que duplica consolidaciones no duplica métricas silenciosamente',async()=>{
  await e.pool.query(`CREATE OR REPLACE VIEW dashboard_read.v1_check_ins AS SELECT * FROM dashboard_fixture.check_ins UNION ALL SELECT * FROM dashboard_fixture.check_ins`);
  try {assert.equal((await request()).body.code,'DASHBOARD_INVALID_SOURCE');}
  finally {await e.pool.query(portViews);}
});
test('Consulta inválida, ventana excesiva, reloj y dueño del cliente se rechazan con 400',async()=>{
  for(const q of ['',f.qs+'&ownerId='+f.owner,'from=2026-02-30&to=2026-03-01',`from=${f.from}&to=2030-12-31`,f.qs+'&asOf=2026-01-01',f.qs+'&bucket=day'])
    assert.equal((await request('progress',q)).status,400);
});
test('La API usa snapshot consistente cuando el escritor corrige durante la consulta',async()=>{
  await e.pool.query(`CREATE OR REPLACE VIEW dashboard_read.v1_check_ins AS SELECT c.* FROM dashboard_fixture.check_ins c CROSS JOIN (SELECT pg_sleep(0.4)) delay`);
  try {
    const pending=request();let waiting=false;
    for(let i=0;i<100;i++) {
      const q=await e.pool.query("SELECT 1 FROM pg_stat_activity WHERE wait_event='PgSleep'");if(q.rowCount){waiting=true;break;}
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    const writer=await e.pool.connect();try {await writer.query('BEGIN');
      await writer.query('UPDATE dashboard_fixture.revisions SET target_value=100 WHERE habit_id=$1 AND revision=2',[f.h1]);
      await writer.query('UPDATE dashboard_fixture.check_ins SET value=100,version=version+1 WHERE habit_id=$1 AND business_date=$2',[f.h1,f.to]);await writer.query('COMMIT');
    } finally {writer.release();}
    const r=await pending;assert.equal(waiting,true);assert.equal(r.body.closed.completed,2);assert.equal(r.body.closed.partial,1);
    assert.equal((await request()).body.closed.completed,3);
  } finally {
    await e.pool.query(portViews);
    await e.pool.query('UPDATE dashboard_fixture.revisions SET target_value=20 WHERE habit_id=$1 AND revision=2',[f.h1]);
    await e.pool.query('UPDATE dashboard_fixture.check_ins SET value=5 WHERE habit_id=$1 AND business_date=$2',[f.h1,f.to]);
  }
});
test('Repetir o reiniciar la API no cambia datos ni pierde estadísticas',async()=>{
  const before=(await request()).body.closed;
  const totalBefore=(await e.pool.query('SELECT count(*)::integer AS count FROM dashboard_fixture.check_ins')).rows[0].count;
  await e.restart();assert.deepEqual((await request()).body.closed,before);
  const totalAfter=(await e.pool.query('SELECT count(*)::integer AS count FROM dashboard_fixture.check_ins')).rows[0].count;
  assert.equal(totalAfter,totalBefore);
});
test('Perfil suspendido no consulta estadísticas',async()=>{
  await e.pool.query("UPDATE public.profiles SET status='suspended' WHERE id=$1",[f.owner]);
  try {assert.equal((await request()).status,403);}
  finally {await e.pool.query("UPDATE public.profiles SET status='active' WHERE id=$1",[f.owner]);}
});
test('Exceso de hábitos se informa sin truncar ni fabricar un agregado parcial',async()=>{
  await e.pool.query(`INSERT INTO dashboard_fixture.revisions SELECT gen_random_uuid(),$1,1,$2::date,'UTC',ARRAY[1,2,3,4,5,6,7]::smallint[],1,'min','active' FROM generate_series(1,501)`,[f.owner,f.from]);
  try {const r=await request();assert.equal(r.status,503);assert.equal(r.body.code,'DASHBOARD_SOURCE_LIMIT');}
  finally {await e.pool.query('DELETE FROM dashboard_fixture.revisions WHERE owner_id=$1 AND habit_id NOT IN ($2,$3)',[f.owner,f.h1,f.h2]);}
});
