import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { TelemetryDatabase as Database } from '../../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../../telemetry/src/errors';
import { Writes } from '../../platform/writes';
import { body, exactQuantity, uuid } from '../../platform/contracts';
import { parameters, pagination } from '../../platform/queries';
import { isValidIanaTimeZone, isValidBusinessDate, getBusinessDateFromUtc } from '../checkins/domain/businessDate';
export function mapHabit(r: any) {
  return { id:r.id, name:r.name, targetValue:Number(r.target_value), unit:r.unit,
    schedule:{ weekdays:r.weekdays, effectiveFrom:r.effective_from },timeZone:r.time_zone,status:r.status,version:r.version,
    createdAt:new Date(r.created_at).toISOString(),updatedAt:new Date(r.updated_at).toISOString() };
}
export async function owned(client: Pool | PoolClient, owner: string, id: string) {
  const result = await client.query("SELECT *,effective_from::text AS effective_from FROM habits WHERE id=$1 AND owner_id=$2",[id,owner]);
  if (!result.rowCount) throw new ApiError(404,'HABIT_NOT_FOUND');
  return result.rows[0];
}
export const etag = (version: number) => `"${version}"`;
@Injectable()
export class Habits {
  constructor(private readonly db: Database, private readonly writes: Writes) {}
  async get(owner: string, rawId: string) { return mapHabit(await owned(this.db.pool,owner,uuid(rawId))); }
  async list(owner: string, raw: Record<string,unknown>) {
    parameters(raw,['status','limit','cursor']);
    if (raw.status !== undefined && !['active','paused','archived'].includes(raw.status as string)) throw new ApiError(400,'INVALID_STATUS');
    const page = pagination(raw,{owner,operation:'habits',status:raw.status??null});
    if (page.after) uuid(page.after);
    const result = await this.db.query(`SELECT *,effective_from::text AS effective_from FROM habits
      WHERE owner_id=$1 AND ($2::text IS NULL OR status=$2) AND ($3::uuid IS NULL OR id>$3)
      ORDER BY id LIMIT $4`,[owner,raw.status??null,page.after,page.limit+1]);
    const items = result.rows.slice(0,page.limit);
    return { items:items.map(mapHabit),nextCursor:result.rows.length>page.limit?page.next(items.at(-1)!.id as string):null };
  }
  private validate(d: Record<string,any>) {
    if (d.name !== undefined && d.name.trim().length < 3) throw new ApiError(422,'INVALID_NAME');
    if (d.unit !== undefined && (!d.unit.trim() || d.unit.length > 40)) throw new ApiError(422,'INVALID_UNIT');
    if (d.targetValue !== undefined) exactQuantity(d.targetValue);
    if (d.timeZone !== undefined && !isValidIanaTimeZone(d.timeZone)) throw new ApiError(422,'INVALID_TIME_ZONE');
    if (d.schedule && !isValidBusinessDate(d.schedule.effectiveFrom)) throw new ApiError(422,'INVALID_EFFECTIVE_DATE');
  }
  async create(owner: string, key: unknown, input: unknown) {
    const d = body('HabitCreate',input); this.validate(d);
    return this.writes.run(owner,'habit:create',key,d,async client => {
      const result = await client.query(`INSERT INTO habits(owner_id,name,target_value,unit,weekdays,effective_from,time_zone)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *,effective_from::text AS effective_from`,
        [owner,d.name.trim(),d.targetValue,d.unit.trim(),d.schedule.weekdays,d.schedule.effectiveFrom,d.timeZone]);
      return { body:mapHabit(result.rows[0]),status:201,etag:etag(1) };
    });
  }
  async patch(owner: string, rawId: string, key: unknown, match: unknown, input: unknown) {
    const id = uuid(rawId),d = body('HabitPatch',input); this.validate(d);
    if (typeof match !== 'string' || !/^"[1-9]\d*"$/.test(match)) throw new ApiError(400,'STRONG_IF_MATCH_REQUIRED');
    const version = Number(match.slice(1,-1));
    if (!Number.isSafeInteger(version)) throw new ApiError(400,'INVALID_VERSION');
    return this.writes.run(owner,'habit:patch:'+id,key,{d,match},async client => {
      const prior = await owned(client,owner,id);
      if (prior.version !== version) throw new ApiError(409,'VERSION_CONFLICT');
      if (prior.status === 'archived') throw new ApiError(409,'HABIT_ARCHIVED');
      const now = (await client.query('SELECT clock_timestamp() AS now')).rows[0].now as Date;
      const today = getBusinessDateFromUtc(now,prior.time_zone);
      const next = new Date(today+'T12:00:00Z'); next.setUTCDate(next.getUTCDate()+1);
      const effective = d.schedule?.effectiveFrom ?? next.toISOString().slice(0,10);
      const zone = d.timeZone ?? prior.time_zone;
      if (effective <= today || effective <= getBusinessDateFromUtc(now,zone) || effective <= prior.effective_from)
        throw new ApiError(422,'FUTURE_REVISION_REQUIRED');
      const result = await client.query(`UPDATE habits SET name=$3,target_value=$4,unit=$5,weekdays=$6,effective_from=$7,
        time_zone=$8,status=$9,version=version+1,updated_at=clock_timestamp() WHERE id=$1 AND owner_id=$2 AND version=$10
        RETURNING *,effective_from::text AS effective_from`,[id,owner,d.name?.trim()??prior.name,d.targetValue??prior.target_value,
        d.unit?.trim()??prior.unit,d.schedule?.weekdays??prior.weekdays,effective,zone,d.status??prior.status,version]);
      if (!result.rowCount) throw new ApiError(409,'VERSION_CONFLICT');
      return { body:mapHabit(result.rows[0]),status:200,etag:etag(result.rows[0].version) };
    },undefined,async c => { await owned(c,owner,id); });
  }
}
