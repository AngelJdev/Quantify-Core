import { Body, Controller, Get, Headers, Inject, Injectable, Module, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { TelemetryIdentity, TelemetryRequest, VerifiedBearerIdentity } from '../../../telemetry/src/auth';
import { CONFIG } from '../../../telemetry/src/config';
import { TelemetryDatabase as Database } from '../../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../../telemetry/src/errors';
import type { CoreConfig } from '../../platform/config';
import { body, fingerprint, uuid } from '../../platform/contracts';
import { isValidIanaTimeZone } from '../checkins/domain/businessDate';
@Injectable()
export class Profiles {
  constructor(private readonly db: Database, @Inject(CONFIG) private readonly config: CoreConfig) {}
  async get(owner: string,roles: ('user'|'admin')[]) {
    const row = (await this.db.query('SELECT id,time_zone,status FROM profiles WHERE id=$1',[owner])).rows[0];
    if (row?.status !== 'active') throw new ApiError(403,'PROFILE_NOT_ACTIVE');
    return {id:row.id,timeZone:row.time_zone,roles,status:row.status};
  }
  async provision(subject: string, roles: ('user'|'admin')[], rawKey: unknown, input: unknown) {
    if (!this.config.writesEnabled) throw new ApiError(503,'REVIEW_WRITES_DISABLED');
    const key = uuid(rawKey), d = body('ProfileProvision', input);
    if (!isValidIanaTimeZone(d.timeZone)) throw new ApiError(422,'INVALID_TIME_ZONE');
    const hash = fingerprint({ operation: 'profile:provision', command: d });
    return this.db.transaction(async client => {
      let row = (await client.query<{ id: string; time_zone: string; status: string }>(
        'SELECT id,time_zone,status FROM public.profiles WHERE oidc_issuer=$1 AND oidc_subject=$2 FOR UPDATE',
        [this.config.issuer, subject])).rows[0];
      let created = false;
      if (!row) {
        const inserted = await client.query<{ id: string; time_zone: string; status: string }>(
          `INSERT INTO public.profiles(oidc_issuer,oidc_subject,time_zone) VALUES($1,$2,$3)
           ON CONFLICT(oidc_issuer,oidc_subject) DO NOTHING RETURNING id,time_zone,status`,
          [this.config.issuer, subject, d.timeZone]);
        if (inserted.rowCount) {
          row = inserted.rows[0];
          created = true;
        } else {
          row = (await client.query<{ id: string; time_zone: string; status: string }>(
            'SELECT id,time_zone,status FROM public.profiles WHERE oidc_issuer=$1 AND oidc_subject=$2 FOR UPDATE',
            [this.config.issuer, subject])).rows[0];
        }
      }
      if (row?.status !== 'active') throw new ApiError(403,'PROFILE_NOT_ACTIVE');
      const prior = await client.query<{ fingerprint: string; http_status: number }>(
        'SELECT fingerprint,http_status FROM api_receipts WHERE owner_id=$1 AND operation=$2 AND idempotency_key=$3',
        [row.id, 'profile:provision', key]);
      const responseBody = { id: row.id, timeZone: row.time_zone, roles, status: row.status };
      if (prior.rowCount) {
        if (prior.rows[0].fingerprint !== hash) throw new ApiError(409,'IDEMPOTENCY_KEY_CONFLICT');
        return { status: prior.rows[0].http_status, body: responseBody };
      }
      const status = created ? 201 : 200;
      if (created) {
        await client.query(
          `INSERT INTO audit_outbox(aggregate_type,aggregate_id,event_type,aggregate_version,owner_id,payload)
           VALUES('profile',$1,'profile.created',1,$1,$2)`,
          [row.id, JSON.stringify({ profileId: row.id, timeZone: row.time_zone })]);
      }
      await client.query(
        `INSERT INTO api_receipts(owner_id,operation,idempotency_key,fingerprint,response,http_status)
         VALUES($1,'profile:provision',$2,$3,$4,$5)`,
        [row.id, key, hash, responseBody, status]);
      return { status, body: responseBody };
    });
  }
}
@Controller('me')
class ProfilesController {
  constructor(private readonly profiles: Profiles) {}
  @Get()
  @UseGuards(TelemetryIdentity)
  profile(@Req() req: TelemetryRequest) { return this.profiles.get(req.telemetryOwner,req.coreRoles); }
  @Post()
  @UseGuards(VerifiedBearerIdentity)
  async provision(@Req() req: TelemetryRequest, @Headers('idempotency-key') key: string,
    @Body() input: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.profiles.provision(req.oidcSubject!, req.coreRoles, key, input);
    res.status(result.status);
    return result.body;
  }
}
@Module({controllers:[ProfilesController],providers:[Profiles]})
export class ProfilesModule {}
