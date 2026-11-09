import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request } from 'express';
import { CONFIG, TelemetryConfig } from './config';
import { TelemetryDatabase } from './database';
import { TelemetryError } from './errors';
export interface TelemetryRequest extends Request { telemetryOwner: string; }
@Injectable()
export class TelemetryIdentity implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  constructor(@Inject(CONFIG) private readonly config: TelemetryConfig, private readonly db: TelemetryDatabase) {
    this.jwks = createRemoteJWKSet(new URL(config.issuer.replace(/\/$/, '') + '/protocol/openid-connect/certs'), { timeoutDuration: 3000 });
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TelemetryRequest>();
    const match = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '');
    if (!match) throw new TelemetryError(401, 'ACCESS_TOKEN_REQUIRED');
    let subject: string;
    try {
      const { payload } = await jwtVerify(match[1], this.jwks, {
        issuer: this.config.issuer, audience: this.config.audience, algorithms: ['RS256'], requiredClaims: ['sub', 'iat', 'exp']
      });
      if (payload.typ !== 'Bearer' || !payload.sub) throw new Error('No es access token');
      subject = payload.sub;
    } catch { throw new TelemetryError(401, 'INVALID_ACCESS_TOKEN'); }
    const result = await this.db.query<{ id: string; status: string }>(
      'SELECT id,status FROM public.profiles WHERE oidc_issuer=$1 AND oidc_subject=$2', [this.config.issuer, subject]);
    if (result.rows[0]?.status !== 'active') throw new TelemetryError(403, 'PROFILE_NOT_ACTIVE');
    request.telemetryOwner = result.rows[0].id;
    return true;
  }
}
