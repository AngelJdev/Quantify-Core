import { Injectable } from '@nestjs/common';
import { TelemetryDatabase as Database } from '../../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../../telemetry/src/errors';
import { Writes } from '../../platform/writes';
import { body, exactQuantity, uuid } from '../../platform/contracts';
import { parameters, pagination, windowQuery } from '../../platform/queries';
import { owned, mapHabit } from '../habits/service';
import { validateAndBuildCheckIn } from './domain/checkInRules';
import { isValidBusinessDate } from './domain/businessDate';
const map = (r: any) => ({ id:r.id,habitId:r.habit_id,clientEventId:r.client_event_id,businessDate:r.business_date,
  occurredAt:new Date(r.occurred_at).toISOString(),recordedAt:new Date(r.recorded_at).toISOString(),
  timeZone:r.time_zone,value:Number(r.value),version:r.version,progressStatus:r.progress_status });
@Injectable()
export class CheckIns {
  constructor(private readonly db: Database, private readonly writes: Writes) {}
  async list(owner: string, rawId: string, raw: Record<string,unknown>) {
    const id = uuid(rawId); await owned(this.db.pool,owner,id);
    parameters(raw,['from','to','limit','cursor']); const window = windowQuery(raw);
    const page = pagination(raw,{owner,id,operation:'check-ins',...window});
    if (page.after && !isValidBusinessDate(page.after)) throw new ApiError(400,'INVALID_CURSOR');
    const result = await this.db.query(`SELECT *,business_date::text AS business_date FROM check_ins WHERE owner_id=$1 AND habit_id=$2
      AND business_date BETWEEN $3 AND $4 AND ($5::text IS NULL OR business_date>$5::date) ORDER BY check_ins.business_date LIMIT $6`,
      [owner,id,window.from,window.to,page.after,page.limit+1]);
    const items = result.rows.slice(0,page.limit);
    return { items:items.map(map),nextCursor:result.rows.length>page.limit?page.next(items.at(-1)!.business_date as string):null };
  }
  async record(owner: string, rawId: string, key: unknown, input: unknown) {
    const id = uuid(rawId),d = body('CheckInCommand',input); exactQuantity(d.value);
    if (!Number.isSafeInteger(d.expectedVersion)) throw new ApiError(400,'INVALID_VERSION');
    return this.writes.run(owner,'check-in:'+id,key,d,async client => {
      await owned(client,owner,id);
      const historical = await client.query(`SELECT snapshot FROM habit_revisions WHERE habit_id=$1 AND
        (snapshot->>'effective_from')::date<=$2 ORDER BY (snapshot->>'effective_from') DESC LIMIT 1`,[id,d.businessDate]);
      if (!historical.rowCount) throw new ApiError(422,'NO_EFFECTIVE_REVISION');
      const snapshot = historical.rows[0].snapshot;
      const habit = mapHabit(snapshot);
      const previous = (await client.query(`SELECT *,business_date::text AS business_date FROM check_ins
        WHERE habit_id=$1 AND owner_id=$2 AND business_date=$3`,[id,owner,d.businessDate])).rows[0];
      const now = (await client.query("SELECT date_trunc('milliseconds',clock_timestamp()) AS now")).rows[0].now as Date;
      const decision = validateAndBuildCheckIn({ habit,command:d as any,
        existingCheckIn:previous?map(previous):null,nowUtc:now.toISOString() });
      if (!decision.ok) throw new ApiError(decision.status!,decision.code!);
      let row;
      if (!previous) {
        row = (await client.query(`INSERT INTO check_ins(habit_id,owner_id,business_date,habit_revision,client_event_id,occurred_at,
          recorded_at,time_zone,unit,value,version,progress_status,correction_reason)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,$11,NULL) RETURNING *,business_date::text AS business_date`,
          [id,owner,d.businessDate,snapshot.version,d.clientEventId,d.occurredAt,now,d.timeZone,snapshot.unit,d.value,decision.checkIn!.progressStatus])).rows[0];
      } else {
        row = (await client.query(`UPDATE check_ins SET client_event_id=$3,occurred_at=$4,recorded_at=$5,value=$6,
          version=version+1,progress_status=$7,correction_reason=$8 WHERE id=$1 AND owner_id=$2 AND version=$9
          RETURNING *,business_date::text AS business_date`,[previous.id,owner,d.clientEventId,d.occurredAt,now,d.value,
          decision.checkIn!.progressStatus,d.correctionReason.trim(),d.expectedVersion])).rows[0];
        if (!row) throw new ApiError(409,'VERSION_CONFLICT');
      }
      return { body:map(row),status:previous?200:201 };
    },uuid(d.clientEventId),async client => { await owned(client,owner,id); });
  }
}
