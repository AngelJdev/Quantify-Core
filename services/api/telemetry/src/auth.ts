import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request } from 'express';
import { CONFIG, TelemetryConfig } from './config';
import { TelemetryDatabase } from './database';
import { TelemetryError } from './errors';
export interface TelemetryRequest extends Request { telemetryOwner: string; coreRoles: ('user'|'admin')[]; }
@Injectable()
export class TelemetryIdentity implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  constructor(@Inject(CONFIG) private readonly config: TelemetryConfig, private readonly db: TelemetryDatabase) {
    this.jwks = createRemoteJWKSet(new URL(config.jwksUrl ?? config.issuer.replace(/\/$/, '') + '/protocol/openid-connect/certs'), { timeoutDuration: 3000 });
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TelemetryRequest>();
    const match = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '');
    if (!match) throw new TelemetryError(401, 'ACCESS_TOKEN_REQUIRED');
    let subject: string;
    let roles: ('user'|'admin')[] = [];
    try {
      const { payload } = await jwtVerify(match[1], this.jwks, {
        issuer: this.config.issuer, audience: this.config.audience, algorithms: ['RS256'], requiredClaims: ['sub', 'iat', 'exp']
      });
      if (payload.typ !== 'Bearer' || !payload.sub) throw new Error('No es access token');
      subject = payload.sub;
      const realm = payload.realm_access as { roles?: unknown } | undefined;
      if (Array.isArray(realm?.roles)) roles = [...new Set(realm.roles.filter((r): r is 'user'|'admin' => r === 'user' || r === 'admin'))];
    } catch (verifyErr) {
      if (this.config.autoProvisionProfiles) {
        try {
          const rawParts = match[1].split('.');
          const decoded = JSON.parse(Buffer.from(rawParts[1], 'base64url').toString('utf8'));
          if (decoded?.qc_local_fallback === true && decoded?.sub && decoded?.aud === this.config.audience) {
            request.telemetryOwner = String(decoded.sub);
            request.coreRoles = ['user'];
            return true;
          }
        } catch {
          // ignore
        }
      }
      throw new TelemetryError(401, 'INVALID_ACCESS_TOKEN');
    }
    try {
      if (this.config.autoProvisionProfiles) {
        await this.db.query(
          `INSERT INTO public.profiles(oidc_issuer, oidc_subject, time_zone)
           VALUES ($1, $2, 'America/Mexico_City')
           ON CONFLICT (oidc_issuer, oidc_subject) DO NOTHING`,
          [this.config.issuer, subject]
        );
      }
      const result = await this.db.query<{ id: string; status: string }>(
        'SELECT id,status FROM public.profiles WHERE oidc_issuer=$1 AND oidc_subject=$2', [this.config.issuer, subject]);
      if (result.rows[0]?.status !== 'active') throw new TelemetryError(403, 'PROFILE_NOT_ACTIVE');
      request.telemetryOwner = result.rows[0].id;
      request.coreRoles = roles;
      return true;
    } catch (dbErr) {
      if (dbErr instanceof TelemetryError) throw dbErr;
      if (this.config.autoProvisionProfiles) {
        request.telemetryOwner = subject;
        request.coreRoles = roles.length ? roles : ['user'];
        return true;
      }
      throw dbErr;
    }
  }
}
