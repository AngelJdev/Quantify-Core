import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG } from '../../telemetry/src/config';
import { TelemetryDatabase } from '../../telemetry/src/database';
import { TelemetryIdentity } from '../../telemetry/src/auth';
import { Writes } from './writes';
import { Health, HealthController } from './health';
import type { CoreConfig } from './config';
@Global()
@Module({})
export class PlatformModule {
  static register(config: CoreConfig): DynamicModule {
    return { module:PlatformModule,controllers:[HealthController],
      providers:[{provide:CONFIG,useValue:config},TelemetryDatabase,TelemetryIdentity,Writes,Health],
      exports:[CONFIG,TelemetryDatabase,TelemetryIdentity,Writes] };
  }
}
