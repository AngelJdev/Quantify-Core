import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { CONFIG, TelemetryConfig } from './config';
@Injectable()
export class TelemetryDatabase implements OnModuleDestroy {
  readonly pool: Pool;
  constructor(@Inject(CONFIG) config: TelemetryConfig) {
    this.pool = new Pool({ connectionString: config.databaseUrl, max: 5, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000 });
    this.pool.on('error', () => { /* No registrar información de conexión. El siguiente request recibe 503. */ });
  }
  query<T extends QueryResultRow>(sql: string, params: unknown[] = []) { return this.pool.query<T>(sql, params); }
  async transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL statement_timeout = '5s'");
      await client.query("SET LOCAL lock_timeout = '3s'");
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}
