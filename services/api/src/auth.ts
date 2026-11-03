import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request } from 'express';
import { Db } from './db';
type Actor = {id:string, issuer:string, subject:string};
declare module 'express-serve-static-core' { interface Request { actor?:Actor } }
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly issuer:string;
  private readonly audience:string;
  private readonly jwks:ReturnType<typeof createRemoteJWKSet>;
  constructor(private readonly db:Db) {
    this.issuer=process.env.KEYCLOAK_ISSUER||'';
    this.audience=process.env.KEYCLOAK_AUDIENCE||'';
    if (!this.issuer || !this.audience) throw new Error('KEYCLOAK_ISSUER / KEYCLOAK_AUDIENCE obligatorios');
    const url=new URL(this.issuer);
    if (!['https:','http:'].includes(url.protocol)) throw new Error('Issuer inválido');
    if (url.protocol!=='https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('OIDC remoto requiere HTTPS');
    this.jwks=createRemoteJWKSet(new URL(this.issuer.replace(/\/$/,'')+'/protocol/openid-connect/certs'));
  }
  async canActivate(context:ExecutionContext):Promise<boolean> {
    const req=context.switchToHttp().getRequest<Request>();
    const raw=req.headers.authorization;
    if (!raw?.startsWith('Bearer ')) throw new UnauthorizedException('Access token requerido');
    let payload;
    try {
      ({payload}=await jwtVerify(raw.slice(7),this.jwks,{issuer:this.issuer,audience:this.audience,algorithms:['RS256']}));
    } catch {throw new UnauthorizedException('Access token inválido');}
    if (!payload.sub) throw new UnauthorizedException('Token sin subject');
    // El perfil se provisiona por separado. No aceptar identidad suministrada por cliente.
    const result=await this.db.query<Actor & {status:string}>(
      'SELECT id,oidc_issuer as issuer,oidc_subject as subject,status FROM profiles WHERE oidc_issuer=$1 AND oidc_subject=$2',
      [this.issuer,payload.sub]
    );
    if (!result.rowCount) throw new ForbiddenException('Perfil no habilitado');
    if (result.rows[0].status!=='active') throw new ForbiddenException('Perfil suspendido');
    req.actor=result.rows[0];
    return true;
  }
}
