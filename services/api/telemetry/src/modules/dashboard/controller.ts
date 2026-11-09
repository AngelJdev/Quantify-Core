import { Controller,Get,Query,Req,UseGuards } from '@nestjs/common';
import { TelemetryIdentity as Identity,TelemetryRequest as ActorRequest } from '../../auth';
import { DashboardService } from './service';
@Controller('me/dashboard')
@UseGuards(Identity)
export class DashboardController {
  constructor(private readonly dashboard:DashboardService) {}
  @Get('progress')progress(@Req()r:ActorRequest,@Query()q:Record<string,unknown>) {return this.dashboard.read(r.telemetryOwner,'progress',q);}
  @Get('calendar')calendar(@Req()r:ActorRequest,@Query()q:Record<string,unknown>) {return this.dashboard.read(r.telemetryOwner,'calendar',q);}
  @Get('trends')trends(@Req()r:ActorRequest,@Query()q:Record<string,unknown>) {return this.dashboard.read(r.telemetryOwner,'trends',q);}
}
