import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';
import type { ConsentUpdate, SyntheticSource, TelemetryBatch, TelemetryReceipt } from './contracts.generated';
import { TelemetryDatabase } from './database';
import { TelemetryError } from './errors';
import { fingerprint } from './validation';

type Signal = 'heartRate' | 'stepCount';
interface Source extends QueryResultRow {
  id: string; owner_id: string; active: boolean; origin: string;
  consent_version: number; consent_at: Date | null; grants: ConsentUpdate['grants'];
}
const authorize = (source: Source, version: number, signals: Signal[]): void => {
  if (!source.active) throw new TelemetryError(403, 'SOURCE_REVOKED');
  if (version !== source.consent_version || !source.consent_at ||
      signals.some(signal => !source.grants.some(g => g.signal === signal && g.purpose === 'personal-analytics'))) {
    throw new TelemetryError(403, 'CONSENT_NOT_CURRENT');
  }
};
const sourceView = (s: Source) => ({ sourceId: s.id, origin: s.origin, active: s.active,
  consentVersion: s.consent_version, grants: s.grants, consentAt: s.consent_at?.toISOString() ?? null });

@Injectable()
export class TelemetryService {
  constructor(private readonly db: TelemetryDatabase) {}

  // El mismo orden de locks se utiliza para ingesta, revocación y lectura.
  // El lock del perfil impide confirmar ingestión después de una suspensión confirmada.
  private async source(c: PoolClient, owner: string, id: string): Promise<Source> {
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended('quancore-telemetry-source:' || lower($1),0))", [id]);
    const profile = await c.query('SELECT status FROM public.profiles WHERE id=$1 FOR SHARE', [owner]);
    if (profile.rows[0]?.status !== 'active') throw new TelemetryError(403, 'PROFILE_NOT_ACTIVE');
    const result = await c.query<Source>(
      'SELECT * FROM telemetry_simulation.sources WHERE id=$1 AND owner_id=$2 FOR UPDATE', [id, owner]);
    if (!result.rowCount) throw new TelemetryError(404, 'SOURCE_NOT_FOUND');
    return result.rows[0];
  }

  async register(owner: string, input: SyntheticSource) {
    return this.db.transaction(async c => {
      const profile = await c.query('SELECT status FROM public.profiles WHERE id=$1 FOR SHARE', [owner]);
      if (profile.rows[0]?.status !== 'active') throw new TelemetryError(403, 'PROFILE_NOT_ACTIVE');
      await c.query(`INSERT INTO telemetry_simulation.sources(id,owner_id,origin)
        VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`, [input.sourceId, owner, input.origin]);
      return sourceView(await this.source(c, owner, input.sourceId));
    });
  }

  async getSource(owner: string, id: string) {
    return this.db.transaction(async c => sourceView(await this.source(c, owner, id)));
  }

  async consent(owner: string, id: string, input: ConsentUpdate) {
    return this.db.transaction(async c => {
      const source = await this.source(c, owner, id);
      if (!source.active) throw new TelemetryError(403, 'SOURCE_REVOKED');
      if (source.consent_version !== input.expectedVersion) throw new TelemetryError(409, 'CONSENT_VERSION_CONFLICT');
      const updated = await c.query<Source>(`UPDATE telemetry_simulation.sources
        SET consent_version=consent_version+1,grants=$2,consent_at=date_trunc('milliseconds',clock_timestamp())
        WHERE id=$1 RETURNING *`, [id, JSON.stringify(input.grants)]);
      const current = updated.rows[0];
      await c.query(`INSERT INTO telemetry_simulation.consent_revisions
        (source_id,version,notice_version,grants,recorded_at) VALUES ($1,$2,$3,$4,$5)`,
        [id, current.consent_version, input.noticeVersion, JSON.stringify(input.grants), current.consent_at]);
      return sourceView(current);
    });
  }

  async revoke(owner: string, id: string) {
    return this.db.transaction(async c => {
      const source = await this.source(c, owner, id);
      if (source.active) {
        const updated = await c.query<Source>(`UPDATE telemetry_simulation.sources SET active=false,
          grants='[]',consent_version=consent_version+1,consent_at=date_trunc('milliseconds',clock_timestamp())
          WHERE id=$1 RETURNING *`, [id]);
        const current = updated.rows[0];
        await c.query(`INSERT INTO telemetry_simulation.consent_revisions
          (source_id,version,notice_version,grants,recorded_at) VALUES ($1,$2,'synthetic-notice-v1','[]',$3)`,
          [id, current.consent_version, current.consent_at]);
        return sourceView(current);
      }
      return sourceView(source);
    });
  }

  async ingest(owner: string, batch: TelemetryBatch): Promise<{ replay: boolean; receipt: TelemetryReceipt }> {
    return this.db.transaction(async c => {
      const source = await this.source(c, owner, batch.sourceId);
      const signals = [...new Set(batch.samples.map(s => s.signal))];
      // Se autoriza ANTES de deduplicar. Ni un replay permite leer datos revocados.
      authorize(source, batch.consentVersion, signals);
      const hash = fingerprint(batch);
      const prior = await c.query<{ request_hash: string; receipt: TelemetryReceipt }>(
        'SELECT request_hash,receipt FROM telemetry_simulation.batches WHERE source_id=$1 AND batch_id=$2', [batch.sourceId, batch.batchId]);
      if (prior.rowCount) {
        if (prior.rows[0].request_hash !== hash) throw new TelemetryError(409, 'BATCH_CONTENT_CONFLICT');
        return { replay: true, receipt: prior.rows[0].receipt };
      }
      const { rows: [clock] } = await c.query<{ now: Date }>("SELECT date_trunc('milliseconds',clock_timestamp()) AS now");
      const now = clock.now.getTime();
      const highs = await c.query<{ signal: Signal; latest: Date }>(`SELECT s.signal,max(s.observed_at) AS latest
        FROM telemetry_simulation.samples s JOIN telemetry_simulation.batches b USING(source_id,batch_id)
        WHERE s.source_id=$1 AND b.consent_version=$2 GROUP BY s.signal`, [source.id, source.consent_version]);
      const highwater = new Map(highs.rows.map(r => [r.signal, r.latest.getTime()]));
      const seen = new Set<string>();
      const seenTimes = new Set<string>();
      const inserts: { sample: TelemetryBatch['samples'][number]; hash: string; late: boolean }[] = [];
      let duplicates = 0;
      for (const sample of batch.samples) {
        const time = Date.parse(sample.observedAt);
        if (!Number.isFinite(time) || new Date(time).toISOString() !== sample.observedAt ||
            time > now + 300000 || time < now - 86400000) throw new TelemetryError(422, 'TIMESTAMP_OUT_OF_WINDOW');
        if (time < source.consent_at!.getTime()) throw new TelemetryError(403, 'SAMPLE_PRECEDES_CONSENT');
        if (seen.has(sample.sampleId)) throw new TelemetryError(422, 'DUPLICATE_SAMPLE_IN_BATCH');
        const timeKey = sample.signal + ':' + sample.observedAt;
        if (seenTimes.has(timeKey)) throw new TelemetryError(409, 'SAMPLE_TIME_CONFLICT');
        seen.add(sample.sampleId); seenTimes.add(timeKey);
        const sampleHash = fingerprint(sample);
        const existing = await c.query<{ sample_hash: string }>(
          'SELECT sample_hash FROM telemetry_simulation.samples WHERE source_id=$1 AND sample_id=$2', [source.id, sample.sampleId]);
        if (existing.rowCount) {
          if (existing.rows[0].sample_hash !== sampleHash) throw new TelemetryError(409, 'SAMPLE_CONTENT_CONFLICT');
          duplicates++; continue;
        }
        const sameTime = await c.query('SELECT 1 FROM telemetry_simulation.samples WHERE source_id=$1 AND signal=$2 AND observed_at=$3', [source.id, sample.signal, sample.observedAt]);
        if (sameTime.rowCount) throw new TelemetryError(409, 'SAMPLE_TIME_CONFLICT');
        const latest = highwater.get(sample.signal);
        const late = latest !== undefined && time < latest;
        highwater.set(sample.signal, Math.max(latest ?? time, time));
        inserts.push({ sample, hash: sampleHash, late });
      }
      const receipt: TelemetryReceipt = { schemaVersion: '1.0.0', sourceId: source.id, batchId: batch.batchId,
        consentVersion: source.consent_version, receivedAt: clock.now.toISOString(), acceptedCount: inserts.length,
        duplicateCount: duplicates, outOfOrderCount: inserts.filter(i => i.late).length };
      await c.query(`INSERT INTO telemetry_simulation.batches(source_id,batch_id,consent_version,request_hash,receipt)
        VALUES ($1,$2,$3,$4,$5)`, [source.id, batch.batchId, batch.consentVersion, hash, JSON.stringify(receipt)]);
      for (const { sample, hash: sampleHash, late } of inserts) {
        await c.query(`INSERT INTO telemetry_simulation.samples
          (source_id,sample_id,batch_id,signal,observed_at,unit,value,sample_hash,out_of_order)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [source.id, sample.sampleId, batch.batchId, sample.signal, sample.observedAt, sample.unit, sample.value, sampleHash, late]);
      }
      return { replay: false, receipt };
    });
  }

  async receipt(owner: string, sourceId: string, batchId: string) {
    return this.db.transaction(async c => {
      const source = await this.source(c, owner, sourceId);
      if (!source.active) throw new TelemetryError(403, 'SOURCE_REVOKED');
      const result = await c.query<{ receipt: TelemetryReceipt; signals: Signal[] }>(`SELECT b.receipt,
        ARRAY(SELECT DISTINCT signal FROM telemetry_simulation.samples s WHERE s.source_id=b.source_id AND s.batch_id=b.batch_id) AS signals
        FROM telemetry_simulation.batches b WHERE b.source_id=$1 AND b.batch_id=$2`, [sourceId, batchId]);
      if (!result.rowCount) throw new TelemetryError(404, 'BATCH_NOT_FOUND');
      const record = result.rows[0];
      // Un lote sin inserciones contiene solo duplicados; el versionado también protege su recibo.
      authorize(source, record.receipt.consentVersion, record.signals);
      return record.receipt;
    });
  }

  async summary(owner: string, id: string) {
    return this.db.transaction(async c => {
      const source = await this.source(c, owner, id);
      if (!source.grants.length) throw new TelemetryError(403, source.active ? 'CONSENT_NOT_CURRENT' : 'SOURCE_REVOKED');
      authorize(source, source.consent_version, source.grants.map(g => g.signal));
      const result = await c.query<{ signal: Signal; sample_count: number; late_count: number; latest: Date }>(`SELECT s.signal,
        count(*)::integer AS sample_count,count(*) FILTER (WHERE s.out_of_order)::integer AS late_count,max(s.observed_at) AS latest
        FROM telemetry_simulation.samples s JOIN telemetry_simulation.batches b USING(source_id,batch_id)
        WHERE s.source_id=$1 AND b.consent_version=$2 AND s.signal=ANY($3::text[])
        GROUP BY s.signal ORDER BY s.signal`, [id, source.consent_version, source.grants.map(g => g.signal)]);
      return { sourceId: id, consentVersion: source.consent_version, scope: 'synthetic-current-consent',
        items: result.rows.map(r => ({ signal: r.signal, sampleCount: r.sample_count, outOfOrderCount: r.late_count, latestObservedAt: r.latest.toISOString() })) };
    });
  }
}
