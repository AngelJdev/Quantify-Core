import { Controller, Get, Module, Param, Query, Req, UseGuards } from '@nestjs/common';
import { TelemetryIdentity, TelemetryRequest } from '../../../telemetry/src/auth';
import { DashboardController } from '../../../telemetry/src/modules/dashboard/controller';
import { DashboardService } from '../../../telemetry/src/modules/dashboard/service';
import { Metrics } from './service';
@Controller('habits/:id/metrics')
@UseGuards(TelemetryIdentity)
class MetricsController {
  constructor(private readonly metrics: Metrics) {}
  @Get() read(@Req() req: TelemetryRequest,@Param('id') id: string,@Query() q: Record<string,unknown>) {
    return this.metrics.read(req.telemetryOwner,id,q);
  }
}
@Module({controllers:[MetricsController,DashboardController],providers:[Metrics,DashboardService]})
export class MetricsModule {}
