import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Document } from 'mongodb';
import type { PoolClient } from 'pg';
import Ajv, { ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { resolve } from 'node:path';
import { dereference } from '@apidevtools/json-schema-ref-parser';
import { CONFIG, TelemetryConfig } from './config';
import { TelemetryDatabase } from './database';
import { TelemetryError } from './errors';
import { fingerprint } from './validation';

type Source = {id:string;owner_id:string;active:boolean;consent_version:number;grants:{signal:string;purpose:string}[]};
type Outbox = {event_id:string;audit_id:string;batch_id:string|null;kind:string};
type Wire = Record<string, unknown>;
const directory=resolve(__dirname,'../../../../packages/contracts/events/telemetry/v1');
function wire(value: unknown): unknown {
  if(value instanceof Date)return value.toISOString();
  if(Array.isArray(value))return value.map(wire);
  if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>k!=='_id').map(([k,v])=>[k,wire(v)]));
  return value;
}
function bson(value: unknown): unknown {
  if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))return new Date(value);
  if(Array.isArray(value))return value.map(bson);
  if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,bson(v)]));
  return value;
}
@Injectable()
export class MongoProjection implements OnModuleDestroy {
  private client?: MongoClient;
  private readonly validators=new Map<string,ValidateFunction>();
  constructor(private readonly sql:TelemetryDatabase,@Inject(CONFIG)private readonly config:TelemetryConfig) {}
  private db() {
    if(!this.config.mongo)throw new TelemetryError(503,'MONGODB_NOT_ENABLED');
    this.client ??= new MongoClient(this.config.mongo.url,{serverSelectionTimeoutMS:2000,socketTimeoutMS:3000,heartbeatFrequencyMS:500,maxPoolSize:5,
      writeConcern:{w:'majority',j:true,wtimeoutMS:2000}});
    return this.client.db(this.config.mongo.database);
  }
  private async valid(kind:string,value:unknown) {
    if(!this.validators.has(kind)) {
      const ajv=new Ajv({strict:true});addFormats(ajv);
      this.validators.set(kind,ajv.compile(await dereference(resolve(directory,kind+'.schema.json'))));
    }
    if(!this.validators.get(kind)!(value))throw new TelemetryError(503,'PROJECTION_INVALID');
  }
  private async context(c:PoolClient,owner:string,id:string):Promise<Source> {
    const profile=await c.query('SELECT status FROM public.profiles WHERE id=$1',[owner]);
    if(profile.rows[0]?.status!=='active')throw new TelemetryError(403,'PROFILE_NOT_ACTIVE');
    const source=await c.query('SELECT * FROM telemetry_simulation.sources WHERE id=$1 AND owner_id=$2',[id,owner]);
    if(!source.rowCount)throw new TelemetryError(404,'SOURCE_NOT_FOUND');
    return source.rows[0] as Source;
  }
  private async locked<T>(owner:string,id:string,fn:(c:PoolClient,source:Source)=>Promise<T>):Promise<T> {
    this.db();
    const c=await this.sql.pool.connect();let acquired=false,destroy=false;
    try {
      await c.query("SET lock_timeout='3s'");
      await c.query("SELECT pg_advisory_lock(hashtextextended('quancore-telemetry-source:' || lower($1),0))",[id]);
      acquired=true;
      const result=await fn(c,await this.context(c,owner,id));
      await this.context(c,owner,id); // Revalidar perfil después de la llamada remota.
      return result;
    } finally {
      try {
        if(acquired)await c.query("SELECT pg_advisory_unlock(hashtextextended('quancore-telemetry-source:' || lower($1),0))",[id]);
        await c.query('RESET lock_timeout');
      } catch {destroy=true;}
      c.release(destroy);
    }
  }
  private async event(c:PoolClient,source:Source,row:Outbox):Promise<Wire|null> {
    const audit=(await c.query('SELECT * FROM telemetry_simulation.audit_events WHERE id=$1',[row.audit_id])).rows[0];
    if(!audit)throw new TelemetryError(503,'PROJECTION_INVALID');
    const common={eventId:row.event_id,schemaVersion:'1.0.0',origin:'synthetic-generator',ownerId:source.owner_id,sourceId:source.id,
      consentVersion:audit.consent_version,occurredAt:audit.occurred_at.toISOString(),receivedAt:audit.occurred_at.toISOString()};
    if(row.kind==='telemetry.audit.recorded')return {...common,type:row.kind,action:audit.action,entityId:audit.entity_id,
      expiresAt:new Date(audit.occurred_at.getTime()+7*86400000).toISOString()};
    if(!source.active || source.consent_version!==audit.consent_version || !source.grants.length)return null;
    const batch=(await c.query('SELECT receipt FROM telemetry_simulation.batches WHERE source_id=$1 AND batch_id=$2',[source.id,row.batch_id])).rows[0];
    if(!batch)throw new TelemetryError(503,'PROJECTION_INVALID');
    const samples=(await c.query(`SELECT sample_id AS "sampleId",signal,observed_at AS "observedAt",unit,value
      FROM telemetry_simulation.samples WHERE source_id=$1 AND batch_id=$2 ORDER BY observed_at,sample_id`,[source.id,row.batch_id])).rows;
    if(samples.some(s=>!source.grants.some(g=>g.signal===s.signal && g.purpose==='personal-analytics')))return null;
    const receipt=batch.receipt;
    return {...common,type:row.kind,batchId:row.batch_id,purpose:'personal-analytics',receivedAt:receipt.receivedAt,
      occurredAt:samples.length ? samples[samples.length-1].observedAt.toISOString() : receipt.receivedAt,
      acceptedCount:receipt.acceptedCount,duplicateCount:receipt.duplicateCount,outOfOrderCount:receipt.outOfOrderCount,
      samples:wire(samples),expiresAt:new Date(Date.parse(receipt.receivedAt)+86400000).toISOString()};
  }
  async project(owner:string,id:string) {
    return this.locked(owner,id,async(c,source)=>{
      const rows=await c.query<Outbox>(`SELECT event_id,audit_id,batch_id,kind FROM telemetry_simulation.mongo_outbox
        WHERE source_id=$1 AND owner_id=$2 AND state='pending' ORDER BY created_at,event_id LIMIT 50`,[id,owner]);
      let delivered=0,duplicates=0,discarded=0;
      for(const row of rows.rows) {
        const event=await this.event(c,source,row);
        if(!event || Date.parse(event.expiresAt as string)<=Date.now()) {
          await c.query("UPDATE telemetry_simulation.mongo_outbox SET state='discarded' WHERE event_id=$1",[row.event_id]);discarded++;continue;
        }
        const schema=row.kind==='telemetry.batch.accepted' ? 'batch-event' : 'audit-event';
        await this.valid(schema,event);
        const collection=this.db().collection<Document & {_id:string}>(schema==='batch-event'?'telemetry_events':'audit_events');
        try {await collection.insertOne({...bson(event) as Document,_id:row.event_id});delivered++;}
        catch(error) {
          if(!(error && typeof error==='object' && 'code' in error && error.code===11000))throw error;
          const prior=await collection.findOne({_id:row.event_id},{maxTimeMS:2000});
          if(!prior || fingerprint(wire(prior))!==fingerprint(event))throw new TelemetryError(409,'PROJECTION_CONTENT_CONFLICT');
          duplicates++;
        }
        await c.query("UPDATE telemetry_simulation.mongo_outbox SET state='delivered',delivered_at=clock_timestamp() WHERE event_id=$1",[row.event_id]);
      }
      const pending=(await c.query("SELECT count(*)::integer AS count FROM telemetry_simulation.mongo_outbox WHERE source_id=$1 AND state='pending'",[id])).rows[0].count;
      return {sourceId:id,delivered,duplicates,discarded,pending,hasMore:pending>0};
    });
  }
  async list(owner:string,id:string,audit:boolean,rawLimit:unknown) {
    const text=rawLimit===undefined?'20':String(rawLimit);
    if(!/^([1-9]\d?|100)$/.test(text))throw new TelemetryError(400,'INVALID_JSON_OR_PARAMETER');
    return this.locked(owner,id,async(_c,source)=>{
      if(!audit && (!source.active || !source.grants.length))throw new TelemetryError(403,source.active?'CONSENT_NOT_CURRENT':'SOURCE_REVOKED');
      const query:Document={ownerId:owner,sourceId:source.id,expiresAt:{$gt:new Date()}};
      if(!audit)query.consentVersion=source.consent_version;
      const documents=await this.db().collection(audit?'audit_events':'telemetry_events')
        .find(query,{maxTimeMS:2000}).sort({receivedAt:-1,eventId:1}).limit(Number(text)).toArray();
      const items=documents.map(wire);
      for(const item of items)await this.valid(audit?'audit-event':'batch-event',item);
      return {sourceId:source.id,items};
    });
  }
  async onModuleDestroy() {await this.client?.close();}
}
