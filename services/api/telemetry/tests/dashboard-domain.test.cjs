const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {calculate,query,businessToday}=require('../dist/modules/dashboard/model.js');
const owner=randomUUID(),habit=randomUUID();
const revision=(fields={})=>({habitId:habit,ownerId:owner,revision:1,effectiveFrom:'2026-03-01',timeZone:'America/New_York',weekdays:[1,2,3,4,5,6,7],targetValue:'0.300',unit:'min',status:'active',...fields});
const record=(fields={})=>({habitId:habit,ownerId:owner,businessDate:'2026-03-08',habitRevision:1,version:1,timeZone:'America/New_York',unit:'min',value:'0.300',recordedAt:'2026-03-08T12:00:00.000Z',...fields});
const window=(from='2026-03-08',to=from,bucket='day')=>({from,to,bucket});
test('El día de cambio horario cierra según IANA, sin asumir medianoche UTC',()=>{
  const data={revisions:[revision()],checkIns:[record()]},q=window();
  const a=calculate(data,owner,q,new Date('2026-03-09T03:30:00.000Z'));
  assert.equal(a.progress.closed.opportunities,0);assert.equal(a.progress.open.completed,1);
  const b=calculate(data,owner,q,new Date('2026-03-09T04:30:00.000Z'));
  assert.equal(b.progress.closed.opportunities,1);assert.equal(b.progress.closed.completed,1);
  assert.equal(businessToday(new Date('2026-11-01T05:30:00.000Z'),'America/New_York'),'2026-11-01');
  assert.equal(businessToday(new Date('2026-11-01T06:30:00.000Z'),'America/New_York'),'2026-11-01');
});
test('Meta decimal histórica se compara exactamente; no redondear una cantidad parcial a completada',()=>{
  const data={revisions:[revision()],checkIns:[record({value:'0.299'})]};
  const result=calculate(data,owner,window(),new Date('2026-03-10T12:00:00.000Z'));
  assert.equal(result.progress.closed.partial,1);assert.equal(result.progress.closed.completed,0);
  data.checkIns[0].value='0.300';assert.equal(calculate(data,owner,window(),new Date('2026-03-10T12:00:00.000Z')).progress.closed.completed,1);
});
test('Pausas, archivo y días no programados no entran al denominador',()=>{
  const data={revisions:[revision(),revision({revision:2,effectiveFrom:'2026-03-09',status:'paused'}),
    revision({revision:3,effectiveFrom:'2026-03-10',status:'active',weekdays:[2]}),
    revision({revision:4,effectiveFrom:'2026-03-11',status:'archived'})],checkIns:[record()]};
  const r=calculate(data,owner,window('2026-03-08','2026-03-12'),new Date('2026-03-15T12:00:00.000Z'));
  assert.equal(r.progress.closed.opportunities,2);assert.equal(r.progress.closed.completed,1);
});
test('Tendencias ponderan oportunidades, sin promediar tasas de días distintos',()=>{
  const other=randomUUID();
  const data={revisions:[revision(),revision({habitId:other,effectiveFrom:'2026-03-10'})],checkIns:[record({businessDate:'2026-03-09'})]};
  const r=calculate(data,owner,window('2026-03-09','2026-03-10','week'),new Date('2026-03-15T12:00:00.000Z'));
  assert.equal(r.progress.closed.completionRate,33.33);
  assert.equal(r.trends.points.length,1);assert.equal(r.trends.points[0].closed.completionRate,33.33);
  assert.equal(r.trends.changePercentagePoints,null);
});
test('Sin oportunidades retorna null y causa; jamás simula un porcentaje de fallo',()=>{
  const r=calculate({revisions:[],checkIns:[]},owner,window(),new Date('2026-03-15T12:00:00.000Z'));
  assert.equal(r.progress.closed.completionRate,null);assert.equal(r.progress.closed.noDataReason,'NO_ELIGIBLE_OPPORTUNITIES');
  assert.equal(r.trends.changePercentagePoints,null);
});
test('Consultas inválidas, parámetros de dueño/reloj y duplicados de query se rechazan',()=>{
  for(const fields of [{from:'2026-02-30'},{from:'2026-03-10',to:'2026-03-01'},{to:'2027-12-01'},
    {ownerId:owner},{asOf:'2026-01-01'},{timeZone:'UTC'},{bucket:['day']},{from:['2026-03-01']},{habitId:'not-uuid'}]) {
    assert.throws(()=>query({from:'2026-03-01',to:'2026-03-10',...fields},'trends'));
  }
  assert.doesNotThrow(()=>query({from:'2024-01-01',to:'2024-12-31'},'calendar'));
});
test('Datos de origen ambiguos, unidades, zonas y versiones erróneas fallan explícitamente',()=>{
  for(const mutate of [d=>d.revisions.push(revision({revision:2})),d=>d.revisions[0].timeZone='invalid/zone',
    d=>d.revisions[0].targetValue='0.000',d=>d.checkIns.push(record()),d=>d.checkIns[0].unit='ml',
    d=>d.checkIns[0].habitRevision=2,d=>d.checkIns[0].value='NaN',d=>d.checkIns[0].value=null,
    d=>d.checkIns[0].ownerId=randomUUID()]) {
    const data={revisions:[revision()],checkIns:[record()]};mutate(data);
    assert.throws(()=>calculate(data,owner,window(),new Date('2026-03-15T12:00:00.000Z')));
  }
});
