import { Body, Controller, Get, Headers, Module, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { TelemetryIdentity, TelemetryRequest } from '../../../telemetry/src/auth';
import { Habits, etag } from './service';
@Controller('habits')
@UseGuards(TelemetryIdentity)
class HabitsController {
  constructor(private readonly habits: Habits) {}
  @Get() list(@Req() req: TelemetryRequest,@Query() q: Record<string,unknown>) { return this.habits.list(req.telemetryOwner,q); }
  @Get(':id') async get(@Req() req: TelemetryRequest,@Param('id') id: string,@Res({passthrough:true}) res: Response) {
    const value = await this.habits.get(req.telemetryOwner,id);res.setHeader('ETag',etag(value.version));return value;
  }
  @Post() async create(@Req() req: TelemetryRequest,@Headers('idempotency-key') key: string,@Body() input: unknown,@Res({passthrough:true}) res: Response) {
    const result = await this.habits.create(req.telemetryOwner,key,input);
    res.status(result.status).setHeader('ETag',result.etag!);return result.body;
  }
  @Patch(':id') async patch(@Req() req: TelemetryRequest,@Param('id') id: string,@Headers('idempotency-key') key: string,
    @Headers('if-match') match: string,@Body() input: unknown,@Res({passthrough:true}) res: Response) {
    const result = await this.habits.patch(req.telemetryOwner,id,key,match,input);
    res.status(result.status).setHeader('ETag',result.etag!);return result.body;
  }
}
@Module({controllers:[HabitsController],providers:[Habits]})
export class HabitsModule {}
