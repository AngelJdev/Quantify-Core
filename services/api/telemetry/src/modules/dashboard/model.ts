import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TelemetryError as ApiError } from '../../errors';
import type { DashboardInput } from './input.generated';
export type Query = {from:string;to:string;habitId?:string;bucket:'day'|'week'};
type Revision = DashboardInput['revisions'][number];
type CheckIn = DashboardInput['checkIns'][number];
const ajv=new Ajv({strict:true});addFormats(ajv);
const validate=ajv.compile(JSON.parse(readFileSync(resolve(__dirname,'../../../../../../packages/contracts/dashboard/v1/read-input.schema.json'),'utf8')));
const dayMs=86400000;
export function realDate(value:string):boolean {
  const time=Date.parse(value+'T00:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===value;
}
export function dates(from:string,to:string):string[] {
  const start=Date.parse(from+'T00:00:00Z'),count=(Date.parse(to+'T00:00:00Z')-start)/dayMs+1;
  return Array.from({length:count},(_,i)=>new Date(start+i*dayMs).toISOString().slice(0,10));
}
export function query(input:Record<string,unknown>,kind:string):Query {
  const allowed=kind==='trends'?['from','to','habitId','bucket']:['from','to','habitId'];
  if(Object.keys(input).some(k=>!allowed.includes(k)) || typeof input.from!=='string' || typeof input.to!=='string' ||
    !realDate(input.from)||!realDate(input.to)||input.from>input.to ||
    (Date.parse(input.to)-Date.parse(input.from))/dayMs>=366 ||
    (input.habitId!==undefined && (typeof input.habitId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(input.habitId))) ||
    (input.bucket!==undefined && (typeof input.bucket!=='string'||!['day','week'].includes(input.bucket))))throw new ApiError(400,'INVALID_JSON_OR_PARAMETER');
  return {from:input.from,to:input.to,...(input.habitId?{habitId:input.habitId as string}:{}),bucket:(input.bucket??'week') as 'day'|'week'};
}
export function businessToday(at:Date,zone:string):string {
  try {
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at);
    const get=(type:string)=>parts.find(p=>p.type===type)!.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {throw new ApiError(503,'DASHBOARD_INVALID_SOURCE');}
}
const invalid=():never=>{throw new ApiError(503,'DASHBOARD_INVALID_SOURCE');};
const quantity=(value:string):bigint=>{
  if(!/^(0|[1-9]\d{0,8})(\.\d{1,3})?$/.test(value))return invalid();
  const [whole,fraction='']=value.split('.');return BigInt(whole)*1000n+BigInt(fraction.padEnd(3,'0'));
};
const weekday=(day:string)=>new Date(day+'T12:00:00Z').getUTCDay()||7;
const eligible=(r:Revision,day:string)=>r.status==='active'&&r.weekdays.includes(weekday(day));
function empty() {return {opportunities:0,recorded:0,completed:0,partial:0,explicitZero:0,missing:0};}
type Counts=ReturnType<typeof empty>;
const rate=(n:number,d:number)=>d?Math.round(n*10000/d)/100:null;
function summary(c:Counts) {return {...c,completionRate:rate(c.completed,c.opportunities),coverageRate:rate(c.recorded,c.opportunities),noDataReason:c.opportunities?null:'NO_ELIGIBLE_OPPORTUNITIES'};}
function add(c:Counts,value:CheckIn|undefined,r:Revision) {
  c.opportunities++;
  if(!value){c.missing++;return;}
  c.recorded++;
  const q=quantity(value.value);
  if(q>=quantity(r.targetValue))c.completed++;
  else if(q===0n)c.explicitZero++;
  else c.partial++;
}
export function calculate(data:DashboardInput,owner:string,q:Query,at:Date) {
  if(data.revisions.length>5000||data.checkIns.length>100000)throw new ApiError(503,'DASHBOARD_SOURCE_LIMIT');
  if(!validate(data))return invalid();
  const revisions=new Map<string,Revision[]>(),today=new Map<string,string>();
  for(const r of data.revisions) {
    if(r.ownerId!==owner || !realDate(r.effectiveFrom) || quantity(r.targetValue)<=0n || r.effectiveFrom>q.to)return invalid();
    today.set(r.timeZone,businessToday(at,r.timeZone));
    const list=revisions.get(r.habitId)??[];list.push(r);revisions.set(r.habitId,list);
  }
  if(revisions.size>500)throw new ApiError(503,'DASHBOARD_SOURCE_LIMIT');
  for(const list of revisions.values()) {
    list.sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom));
    for(let i=1;i<list.length;i++)if(list[i].effectiveFrom===list[i-1].effectiveFrom||list[i].revision<=list[i-1].revision||
      (list[i-1].status==='archived'&&list[i].status!=='archived'))return invalid();
  }
  if(q.habitId&&!revisions.has(q.habitId))throw new ApiError(404,'HABIT_NOT_FOUND');
  const effective=(id:string,day:string):Revision|undefined=>{
    const list=revisions.get(id)??[];
    for(let i=list.length-1;i>=0;i--)if(list[i].effectiveFrom<=day)return list[i];
    return undefined;
  };
  const records=new Map<string,CheckIn>();
  for(const c of data.checkIns) {
    const r=effective(c.habitId,c.businessDate),key=c.habitId+':'+c.businessDate;
    if(c.ownerId!==owner || !realDate(c.businessDate) || c.businessDate<q.from || c.businessDate>q.to || records.has(key) || !r ||
      c.habitRevision!==r.revision || c.unit!==r.unit || c.timeZone!==r.timeZone || !eligible(r,c.businessDate) ||
      c.businessDate>today.get(r.timeZone)! || !Number.isFinite(Date.parse(c.recordedAt)) ||
      new Date(c.recordedAt).toISOString()!==c.recordedAt || Date.parse(c.recordedAt)>at.getTime())return invalid();
    quantity(c.value);records.set(key,c);
  }
  const closed=empty(),open=empty(),usedZones=new Set<string>();let future=0;
  const calendar=dates(q.from,q.to).map(day=>{
    const dc=empty(),op=empty();let df=0;
    for(const id of revisions.keys()) {
      const r=effective(id,day);if(!r)continue;usedZones.add(r.timeZone);if(!eligible(r,day))continue;
      const t=today.get(r.timeZone)!;
      if(day>t){df++;future++;continue;}
      const value=records.get(id+':'+day);
      add(day<t?dc:op,value,r);add(day<t?closed:open,value,r);
    }
    return {date:day,closed:summary(dc),open:summary(op),futureOpportunities:df};
  });
  const window={from:q.from,to:q.to,habitId:q.habitId??null,ruleVersion:'dashboard-opportunities-1.0.0',
    calculatedAt:at.toISOString(),timeBasis:'habit-business-date',timeZones:[...usedZones].sort(),source:'postgresql-check-ins'};
  const buckets=new Map<string,{from:string;to:string;closed:Counts}>();
  for(const d of calendar) {
    const monday=new Date(d.date+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-weekday(d.date)+1);
    const key=q.bucket==='day'?d.date:monday.toISOString().slice(0,10);
    const b=buckets.get(key)??{from:d.date,to:d.date,closed:empty()};b.to=d.date;
    for(const k of Object.keys(b.closed) as (keyof Counts)[])b.closed[k]+=d.closed[k];
    buckets.set(key,b);
  }
  const points=[...buckets.values()].map(b=>({...b,closed:summary(b.closed)}));
  const first=points[0]?.closed.completionRate,last=points.at(-1)?.closed.completionRate;
  const change=points.length>1&&typeof first==='number'&&typeof last==='number'?Math.round((last-first)*100)/100:null;
  return {progress:{window,closed:summary(closed),open:summary(open),futureOpportunities:future},
    calendar:{window,days:calendar},trends:{window,bucket:q.bucket,points,changePercentagePoints:change}};
}
