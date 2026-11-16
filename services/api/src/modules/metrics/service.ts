import { Injectable } from '@nestjs/common';
import { DashboardService } from '../../../telemetry/src/modules/dashboard/service';
import { TelemetryDatabase as Database } from '../../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../../telemetry/src/errors';
import { calculateHabitMetrics } from './domain/streakCalculator';
import { getBusinessDateFromUtc } from '../checkins/domain/businessDate';
import { uuid } from '../../platform/contracts';
import { parameters, windowQuery } from '../../platform/queries';
import { owned } from '../habits/service';
@Injectable()
export class Metrics {
  constructor(private readonly dashboard: DashboardService, private readonly db: Database) {}
  async read(owner: string, rawId: string, raw: Record<string,unknown>) {
    const id = uuid(rawId); const habit = await owned(this.db.pool,owner,id);
    parameters(raw,['from','to']); const window = windowQuery(raw);
    const {data,at} = await this.dashboard.snapshot(owner,'calendar',{...window,habitId:id},true);
    const revisions = data.revisions.map(r => ({ effectiveFrom:r.effectiveFrom,timeZone:r.timeZone,targetValue:Number(r.targetValue),
      status:r.status,schedule:{weekdays:r.weekdays,effectiveFrom:r.effectiveFrom} }));
    // No effective opportunity yet: still return a valid empty window for this owned habit.
    const last = revisions.at(-1);
    const zone = last?.timeZone ?? habit.time_zone;
    const result = calculateHabitMetrics({habitId:id,...window,timeZone:zone,targetValue:last?.targetValue??Number(habit.target_value),
      schedule:last?.schedule??{weekdays:habit.weekdays,effectiveFrom:habit.effective_from},todayBusinessDate:getBusinessDateFromUtc(at,zone),
      calculatedAt:at.toISOString(),ruleVersion:'core-history-1.0.0',revisions,
      checkIns:data.checkIns.map(c => ({businessDate:c.businessDate,value:Number(c.value)}))});
    if ((await this.db.query('SELECT status FROM profiles WHERE id=$1',[owner])).rows[0]?.status !== 'active')
      throw new ApiError(403,'PROFILE_NOT_ACTIVE');
    return result;
  }
}
