import { Controller, Get, Injectable, OnModuleDestroy } from '@nestjs/common';
import { TelemetryDatabase as Database } from '../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../telemetry/src/errors';
@Injectable()
export class Health implements OnModuleDestroy {
  private closing = false;
  constructor(private readonly db: Database) {}
  onModuleDestroy() { this.closing = true; }
  live() { return { status: 'ok' }; }
  async ready() {
    if (this.closing) throw new ApiError(503, 'NOT_READY');
    try {
      const result = await this.db.query(`SELECT count(*)::integer AS count FROM schema_migrations
        WHERE filename IN ('001_core.sql','002_core_integration.sql','003_assistant_consent.sql')`);
      if (result.rows[0]?.count !== 3) throw new Error('Schema not ready');
      // Validate the actual read port as well as the migration ledger.
      await this.db.query('SELECT * FROM dashboard_read.v1_revisions LIMIT 0');
      await this.db.query('SELECT * FROM dashboard_read.v1_check_ins LIMIT 0');
      return { status: 'ok' };
    } catch { throw new ApiError(503, 'NOT_READY'); }
  }
}
@Controller('health')
export class HealthController {
  constructor(private readonly health: Health) {}
  @Get('live') live() { return this.health.live(); }
  @Get('ready') ready() { return this.health.ready(); }
}
