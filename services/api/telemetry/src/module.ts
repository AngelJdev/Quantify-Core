import { Body, Controller, Delete, DynamicModule, Get, HttpCode, Module, Param, ParseUUIDPipe, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CONFIG, TelemetryConfig } from './config';
import { TelemetryDatabase } from './database';
import { TelemetryIdentity, TelemetryRequest } from './auth';
import { TelemetryService } from './service';
import { validate } from './validation';
import { MongoProjection } from './mongo';

@Controller('telemetry/simulation')
@UseGuards(TelemetryIdentity)
class TelemetryController {
  constructor(private readonly service: TelemetryService,private readonly mongo:MongoProjection) {}
  @Post('sources/:sourceId/mongodb/project') @HttpCode(200)
  project(@Req()req:TelemetryRequest,@Param('sourceId',ParseUUIDPipe)id:string) {return this.mongo.project(req.telemetryOwner,id);}
  @Get('sources/:sourceId/events')
  events(@Req()req:TelemetryRequest,@Param('sourceId',ParseUUIDPipe)id:string,@Query('limit')limit:unknown) {return this.mongo.list(req.telemetryOwner,id,false,limit);}
  @Get('sources/:sourceId/audit')
  audit(@Req()req:TelemetryRequest,@Param('sourceId',ParseUUIDPipe)id:string,@Query('limit')limit:unknown) {return this.mongo.list(req.telemetryOwner,id,true,limit);}
  @Post('sources')
  register(@Req() req: TelemetryRequest, @Body() input: unknown) { return this.service.register(req.telemetryOwner, validate('source', input)); }
  @Get('sources/:sourceId')
  source(@Req() req: TelemetryRequest, @Param('sourceId', ParseUUIDPipe) id: string) { return this.service.getSource(req.telemetryOwner, id); }
  @Put('sources/:sourceId/consent')
  consent(@Req() req: TelemetryRequest, @Param('sourceId', ParseUUIDPipe) id: string, @Body() input: unknown) {
    return this.service.consent(req.telemetryOwner, id, validate('consent', input));
  }
  @Delete('sources/:sourceId')
  revoke(@Req() req: TelemetryRequest, @Param('sourceId', ParseUUIDPipe) id: string) { return this.service.revoke(req.telemetryOwner, id); }
  @Post('batches')
  async ingest(@Req() req: TelemetryRequest, @Body() input: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.ingest(req.telemetryOwner, validate('batch', input));
    response.status(result.replay ? 200 : 201);
    return result.receipt;
  }
  @Get('sources/:sourceId/batches/:batchId')
  receipt(@Req() req: TelemetryRequest, @Param('sourceId', ParseUUIDPipe) source: string, @Param('batchId', ParseUUIDPipe) batch: string) {
    return this.service.receipt(req.telemetryOwner, source, batch);
  }
  @Get('sources/:sourceId/summary')
  summary(@Req() req: TelemetryRequest, @Param('sourceId', ParseUUIDPipe) id: string) { return this.service.summary(req.telemetryOwner, id); }
}
@Module({})
export class TelemetrySimulationModule {
  static register(config: TelemetryConfig): DynamicModule {
    return { module: TelemetrySimulationModule, controllers: [TelemetryController],
      providers: [{ provide: CONFIG, useValue: config }, TelemetryDatabase, TelemetryIdentity, TelemetryService,MongoProjection] };
  }
}
