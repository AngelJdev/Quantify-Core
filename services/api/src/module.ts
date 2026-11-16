import { DynamicModule, Module } from '@nestjs/common';
import type { CoreConfig } from './platform/config';
import { PlatformModule } from './platform/module';
import { ProfilesModule } from './modules/profiles/module';
import { HabitsModule } from './modules/habits/module';
import { CheckInsModule } from './modules/checkins/module';
import { MetricsModule } from './modules/metrics/module';
@Module({})
export class CoreModule {
  static register(config: CoreConfig): DynamicModule {
    return { module: CoreModule, imports:[PlatformModule.register(config),ProfilesModule,HabitsModule,CheckInsModule,MetricsModule] };
  }
}
