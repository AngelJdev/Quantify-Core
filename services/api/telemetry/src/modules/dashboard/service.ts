import { Inject, Injectable } from '@nestjs/common';
import { CONFIG, TelemetryConfig } from '../../config';
import { TelemetryDatabase as Database } from '../../database';
import { TelemetryError as ApiError } from '../../errors';
import type { DashboardInput } from './input.generated';
import { calculate,query } from './model';
@Injectable()
export class DashboardService {
  constructor(private readonly db:Database,@Inject(CONFIG)private readonly config:TelemetryConfig) {}
  async read(owner:string,kind:'progress'|'calendar'|'trends',raw:Record<string,unknown>) {
    const q=query(raw,kind);
    if(!this.config.dashboardEnabled)throw new ApiError(503,'DASHBOARD_NOT_ENABLED');
    const c=await this.db.pool.connect();let result;
    try {
      await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      await c.query("SET LOCAL statement_timeout='5s'");
      await c.query("SET LOCAL lock_timeout='3s'");
      await c.query("SET LOCAL datestyle='ISO,YMD'");
      const at=(await c.query("SELECT date_trunc('milliseconds',clock_timestamp()) AS now")).rows[0].now as Date;
      const profile=(await c.query('SELECT status FROM public.profiles WHERE id=$1',[owner])).rows[0];
      if(profile?.status!=='active')throw new ApiError(403,'PROFILE_NOT_ACTIVE');
      const ports=await c.query(`SELECT count(*)::integer AS count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='dashboard_read' AND c.relname IN ('v1_revisions','v1_check_ins') AND c.relkind='v'`);
      if(ports.rows[0].count!==2)throw new ApiError(503,'DASHBOARD_SOURCE_NOT_READY');
      const revisions=await c.query(`SELECT habit_id AS "habitId",owner_id AS "ownerId",revision,effective_from::text AS "effectiveFrom",
        time_zone AS "timeZone",weekdays,target_value::text AS "targetValue",unit,status FROM dashboard_read.v1_revisions
        WHERE owner_id=$1 AND effective_from<=$2 AND ($3::uuid IS NULL OR habit_id=$3)
        ORDER BY habit_id,effective_from,revision LIMIT 5001`,[owner,q.to,q.habitId??null]);
      const checkIns=await c.query(`SELECT habit_id AS "habitId",owner_id AS "ownerId",business_date::text AS "businessDate",
        habit_revision AS "habitRevision",version,time_zone AS "timeZone",unit,value::text,recorded_at AS "recordedAt"
        FROM dashboard_read.v1_check_ins WHERE owner_id=$1 AND business_date BETWEEN $2 AND $3
        AND ($4::uuid IS NULL OR habit_id=$4) ORDER BY habit_id,business_date LIMIT 100001`,[owner,q.from,q.to,q.habitId??null]);
      const data={revisions:revisions.rows,checkIns:checkIns.rows.map(row=>({...row,recordedAt:row.recordedAt instanceof Date?row.recordedAt.toISOString():row.recordedAt}))} as DashboardInput;
      result=calculate(data,owner,q,at);
      await c.query('COMMIT');
    } catch(error) {
      await c.query('ROLLBACK');
      if(error && typeof error==='object' && 'code' in error && ['42P01','42703'].includes(String(error.code)))throw new ApiError(503,'DASHBOARD_SOURCE_NOT_READY');
      throw error;
    } finally {c.release();}
    const active=(await this.db.query('SELECT status FROM public.profiles WHERE id=$1',[owner])).rows[0];
    if(active?.status!=='active')throw new ApiError(403,'PROFILE_NOT_ACTIVE');
    return result[kind];
  }
}
