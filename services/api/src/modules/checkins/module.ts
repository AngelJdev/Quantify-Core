import { Body, Controller, Get, Headers, Module, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { TelemetryIdentity, TelemetryRequest } from '../../../telemetry/src/auth';
import { CheckIns } from './service';
@Controller('habits/:id/check-ins')
@UseGuards(TelemetryIdentity)
class CheckInsController {
  constructor(private readonly checkIns: CheckIns) {}
  @Get() list(@Req() req: TelemetryRequest,@Param('id') id: string,@Query() q: Record<string,unknown>) {
    return this.checkIns.list(req.telemetryOwner,id,q);
  }
  @Post() async record(@Req() req: TelemetryRequest,@Param('id') id: string,@Headers('idempotency-key') key: string,
    @Body() input: unknown,@Res({passthrough:true}) res: Response) {
    const result = await this.checkIns.record(req.telemetryOwner,id,key,input);res.status(result.status);return result.body;
  }
}
@Module({controllers:[CheckInsController],providers:[CheckIns]})
export class CheckInsModule {}
