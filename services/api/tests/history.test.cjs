const {test} = require('node:test');
const assert = require('node:assert/strict');
const {calculateHabitMetrics} = require('../build/src/modules/metrics/domain/streakCalculator');
const {isValidUtcIsoString,getBusinessDateFromUtc,isValidIanaTimeZone} = require('../build/src/modules/checkins/domain/businessDate');
const {computeCommandFingerprint} = require('../build/src/modules/checkins/domain/idempotency');
const {validateAndBuildCheckIn} = require('../build/src/modules/checkins/domain/checkInRules');
test('historical goals, pause and archive preserve earlier opportunities',()=>{
  const revision=(effectiveFrom,targetValue,status='active')=>({effectiveFrom,targetValue,status,timeZone:'UTC',schedule:{effectiveFrom,weekdays:[1,2,3,4,5,6,7]}});
  const revisions=[revision('2026-10-01',10),revision('2026-10-03',20),revision('2026-10-04',20,'paused'),revision('2026-10-05',20),revision('2026-10-06',20,'archived')];
  const metrics=calculateHabitMetrics({habitId:'synthetic',from:'2026-10-01',to:'2026-10-07',timeZone:'UTC',targetValue:20,
    schedule:revisions[0].schedule,todayBusinessDate:'2026-10-08',calculatedAt:'2026-10-08T12:00:00Z',revisions,
    checkIns:[{businessDate:'2026-10-01',value:10},{businessDate:'2026-10-02',value:10},{businessDate:'2026-10-03',value:20},{businessDate:'2026-10-05',value:20}]});
  assert.equal(metrics.eligiblePeriods,4);assert.equal(metrics.completedPeriods,4);assert.equal(metrics.currentStreak,4);
});
test('DST and historical zones control closure, not fixed 24-hour intervals',()=>{
  assert.equal(isValidIanaTimeZone('+01:00'),false);
  const revision={effectiveFrom:'2026-11-01',targetValue:1,status:'active',timeZone:'America/New_York',schedule:{effectiveFrom:'2026-11-01',weekdays:[7]}};
  const at='2026-11-02T04:30:00Z';
  assert.equal(getBusinessDateFromUtc(at,'America/New_York'),'2026-11-01');
  const metrics=calculateHabitMetrics({habitId:'synthetic',from:'2026-11-01',to:'2026-11-01',timeZone:'America/New_York',targetValue:1,
    schedule:revision.schedule,todayBusinessDate:'2026-11-02',calculatedAt:at,revisions:[revision]});
  assert.equal(metrics.eligiblePeriods,0);assert.equal(metrics.completionRate,null);
});
test('timestamp rollover and changed occurredAt cannot silently replay',()=>{
  assert.equal(isValidUtcIsoString('2026-02-30T12:00:00Z'),false);
  const a={actorId:'a',habitId:'h',command:{occurredAt:'2026-10-01T12:00:00Z'}};
  assert.notEqual(computeCommandFingerprint(a),computeCommandFingerprint({...a,command:{occurredAt:'2026-10-01T13:00:00Z'}}));
  const result=validateAndBuildCheckIn({habit:{id:'h',targetValue:1,status:'active',timeZone:'UTC',schedule:{effectiveFrom:'2026-10-01',weekdays:[1,2,3,4,5,6,7]}},
    command:{clientEventId:'e',businessDate:'2026-10-01',occurredAt:'2026-10-02T12:00:00Z',timeZone:'UTC',value:1,expectedVersion:0},nowUtc:'2026-10-03T12:00:00Z'});
  assert.equal(result.ok,false);assert.equal(result.code,'INCONSISTENT_OCCURRENCE');
});
