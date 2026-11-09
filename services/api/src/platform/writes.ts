import { Inject, Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { TelemetryDatabase as Database } from '../../telemetry/src/database';
import { CONFIG } from '../../telemetry/src/config';
import { TelemetryError as ApiError } from '../../telemetry/src/errors';
import type { CoreConfig } from './config';
import { fingerprint, uuid } from './contracts';
export interface WriteResult { body: any; status: number; etag?: string; }
@Injectable()
export class Writes {
  constructor(private readonly db: Database, @Inject(CONFIG) private readonly config: CoreConfig) {}
  async run(owner: string, operation: string, rawKey: unknown, command: unknown,
    action: (client: PoolClient) => Promise<WriteResult>, eventId?: string,
    authorize?: (client: PoolClient) => Promise<void>): Promise<WriteResult> {
    if (!this.config.writesEnabled) throw new ApiError(503,'REVIEW_WRITES_DISABLED');
    const key = uuid(rawKey), hash = fingerprint({ operation, command });
    return this.db.transaction(async client => {
      // Serialize each owner's writes across processes, including dedupe and suspension.
      const profile = await client.query('SELECT status FROM profiles WHERE id=$1 FOR UPDATE',[owner]);
      if (profile.rows[0]?.status !== 'active') throw new ApiError(403,'PROFILE_NOT_ACTIVE');
      await authorize?.(client);
      const prior = await client.query(`SELECT * FROM api_receipts WHERE owner_id=$1 AND
        ((operation=$2 AND idempotency_key=$3) OR ($4::uuid IS NOT NULL AND client_event_id=$4))`,[owner,operation,key,eventId??null]);
      if (prior.rows.some(r => r.fingerprint !== hash)) throw new ApiError(409,'IDEMPOTENCY_KEY_CONFLICT');
      if (prior.rowCount) {
        const r = prior.rows[0];
        // Bind a new key replaying clientEventId to the same intention as well.
        await client.query(`INSERT INTO api_receipts(owner_id,operation,idempotency_key,fingerprint,response,http_status,etag)
          VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,[owner,operation,key,hash,r.response,r.http_status,r.etag]);
        return { body: r.response, status: operation.startsWith('check-in:') ? 200 : r.http_status, ...(r.etag?{etag:r.etag}:{}) };
      }
      const result = await action(client);
      await client.query(`INSERT INTO api_receipts(owner_id,operation,idempotency_key,client_event_id,fingerprint,response,http_status,etag)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[owner,operation,key,eventId??null,hash,result.body,result.status,result.etag??null]);
      return result;
    });
  }
}
