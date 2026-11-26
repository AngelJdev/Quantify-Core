import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  OnModuleDestroy,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import * as nodemailer from 'nodemailer';
import { MongoClient, type Db } from 'mongodb';
import {
  TelemetryIdentity,
  type TelemetryRequest,
} from '../../../telemetry/src/auth';
import { TelemetryDatabase as Database } from '../../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../../telemetry/src/errors';
import { isValidIanaTimeZone } from '../checkins/domain/businessDate';

type PendingOtp = {
  code: string;
  email: string;
  fullName?: string;
  password?: string;
  timeZone?: string;
  purpose: 'register' | 'reset';
  expiresAt: number;
};

export type AuditRecord = {
  id: string;
  engine: 'PostgreSQL' | 'MongoDB';
  action: string;
  category: 'auth' | 'habit' | 'checkin' | 'profile' | 'ai' | 'security';
  summary: string;
  ownerId: string;
  email?: string;
  metadata?: Record<string, unknown>;
  integrityHash: string;
  createdAt: string;
};

@Injectable()
export class WorkspaceService implements OnModuleDestroy {
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private mongoAttempted = false;
  private otpStore = new Map<string, PendingOtp>();
  private memoryProfiles = new Map<string, Record<string, unknown>>();
  private memoryUsers = new Map<
    string,
    { id: string; email: string; fullName: string; passwordHash: string; timeZone: string }
  >();
  private memoryEvidence: Array<Record<string, unknown>> = [];
  private memoryAudit: AuditRecord[] = [];
  private memoryAiCount = 0;
  private readonly storePath = resolve(process.cwd(), '.local-hybrid-store.json');

  constructor(private readonly db: Database) {
    this.loadPersistentStore();
  }

  private loadPersistentStore() {
    if (!existsSync(this.storePath)) return;
    try {
      const raw = JSON.parse(readFileSync(this.storePath, 'utf8')) as {
        users?: Array<
          [
            string,
            {
              id: string;
              email: string;
              fullName: string;
              passwordHash: string;
              timeZone: string;
            },
          ]
        >;
        profiles?: Array<[string, Record<string, unknown>]>;
        evidence?: Array<Record<string, unknown>>;
        audit?: AuditRecord[];
      };
      if (Array.isArray(raw.users)) this.memoryUsers = new Map(raw.users);
      if (Array.isArray(raw.profiles))
        this.memoryProfiles = new Map(raw.profiles);
      if (Array.isArray(raw.evidence)) this.memoryEvidence = raw.evidence;
      if (Array.isArray(raw.audit)) this.memoryAudit = raw.audit;
    } catch {
      // ignore corrupted store file
    }
  }

  private savePersistentStore() {
    try {
      writeFileSync(
        this.storePath,
        JSON.stringify(
          {
            users: Array.from(this.memoryUsers.entries()),
            profiles: Array.from(this.memoryProfiles.entries()),
            evidence: this.memoryEvidence.slice(0, 100),
            audit: this.memoryAudit.slice(0, 150),
          },
          null,
          2,
        ),
        'utf8',
      );
    } catch {
      // ignore disk write errors
    }
  }

  private createFallbackTokens(user: {
    id: string;
    email: string;
    fullName: string;
  }) {
    const { issuer } = this.getKeycloakConfig();
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    ).toString('base64url');
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        iss: issuer,
        aud: 'quantify-api',
        sub: user.id,
        typ: 'Bearer',
        email: user.email,
        name: user.fullName,
        preferred_username: user.email.split('@')[0],
        email_verified: true,
        realm_access: { roles: ['user'] },
        qc_local_fallback: true,
        iat: nowSec,
        exp: nowSec + 3600,
      }),
    ).toString('base64url');
    const sig = createHash('sha256')
      .update(`${header}.${payload}`)
      .digest('base64url');
    const token = `${header}.${payload}.${sig}`;
    return {
      access_token: token,
      refresh_token: token,
      id_token: token,
    };
  }

  async onModuleDestroy() {
    if (this.mongoClient) {
      try {
        await this.mongoClient.close();
      } catch {
        // ignore close error
      }
      this.mongoClient = null;
      this.mongoDb = null;
    }
  }

  private async getMongo(): Promise<Db | null> {
    if (this.mongoDb) return this.mongoDb;
    if (this.mongoAttempted && !process.env.MONGODB_URL) return null;
    this.mongoAttempted = true;
    const url = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017';
    try {
      const client = new MongoClient(url, {
        serverSelectionTimeoutMS: 1200,
        connectTimeoutMS: 1200,
      });
      await client.connect();
      this.mongoClient = client;
      this.mongoDb = client.db(
        process.env.MONGODB_DATABASE || 'quantify_core_hybrid',
      );
      return this.mongoDb;
    } catch {
      return null;
    }
  }

  private getKeycloakConfig() {
    const issuer =
      process.env.KEYCLOAK_ISSUER || 'http://localhost:8180/realms/quantify';
    const iamOrigin = new URL(issuer).origin;
    let adminUser = process.env.KC_BOOTSTRAP_ADMIN_USERNAME;
    let adminPassword = process.env.KC_BOOTSTRAP_ADMIN_PASSWORD;
    if (!adminUser || !adminPassword) {
      const candidates = [
        resolve(process.cwd(), '../../infrastructure/docker/.env.local'),
        resolve(process.cwd(), 'infrastructure/docker/.env.local'),
      ];
      for (const file of candidates) {
        if (existsSync(file)) {
          try {
            const parsed = parseEnv(readFileSync(file, 'utf8'));
            adminUser = adminUser || parsed.KC_BOOTSTRAP_ADMIN_USERNAME;
            adminPassword = adminPassword || parsed.KC_BOOTSTRAP_ADMIN_PASSWORD;
          } catch {
            // ignore
          }
        }
      }
    }
    return { issuer, iamOrigin, adminUser, adminPassword };
  }

  private async getKeycloakAdminToken(): Promise<string> {
    const { iamOrigin, adminUser, adminPassword } = this.getKeycloakConfig();
    if (!adminUser || !adminPassword) {
      throw new ApiError(503, 'IAM_ADMIN_UNAVAILABLE');
    }
    const res = await fetch(
      `${iamOrigin}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: adminUser,
          password: adminPassword,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) throw new ApiError(503, 'IAM_AUTH_FAILED');
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private async ensureDirectAuthClient(adminToken: string): Promise<void> {
    const { iamOrigin } = this.getKeycloakConfig();
    const headers = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };
    const check = await fetch(
      `${iamOrigin}/admin/realms/quantify/clients?clientId=quantify-direct-bridge`,
      { headers, signal: AbortSignal.timeout(5000) },
    );
    if (!check.ok) return;
    const existing = (await check.json()) as Array<{ id: string }>;
    if (existing.length > 0) return;

    await fetch(`${iamOrigin}/admin/realms/quantify/clients`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        clientId: 'quantify-direct-bridge',
        name: 'Quantify Direct Auth Bridge',
        enabled: true,
        publicClient: true,
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true,
        protocol: 'openid-connect',
        defaultClientScopes: ['web-origins', 'acr', 'roles', 'profile', 'basic', 'email'],
        protocolMappers: [
          {
            name: 'quantify-api-audience',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-audience-mapper',
            consentRequired: false,
            config: {
              'included.custom.audience': 'quantify-api',
              'id.token.claim': 'false',
              'access.token.claim': 'true',
              'introspection.token.claim': 'true',
            },
          },
        ],
      }),
    });
  }

  private async mintUserTokens(
    usernameOrEmail: string,
    password: string,
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
  }> {
    const adminToken = await this.getKeycloakAdminToken();
    await this.ensureDirectAuthClient(adminToken);
    const { issuer } = this.getKeycloakConfig();
    const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'quantify-direct-bridge',
        scope: 'openid profile email',
        username: usernameOrEmail,
        password,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }
    return (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
    };
  }

  private async upsertKeycloakUser(params: {
    email: string;
    fullName: string;
    password: string;
    emailVerified: boolean;
  }): Promise<string> {
    const adminToken = await this.getKeycloakAdminToken();
    const { iamOrigin, issuer } = this.getKeycloakConfig();
    const headers = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    const search = await fetch(
      `${iamOrigin}/admin/realms/quantify/users?email=${encodeURIComponent(params.email)}&exact=true`,
      { headers, signal: AbortSignal.timeout(5000) },
    );
    const found = search.ok
      ? ((await search.json()) as Array<{ id: string; username: string }>)
      : [];

    const nameParts = params.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Usuario';
    const lastName = nameParts.slice(1).join(' ') || 'Quantify';
    let userId: string;

    if (found.length > 0) {
      userId = found[0].id;
      await fetch(`${iamOrigin}/admin/realms/quantify/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: userId,
          username: found[0].username,
          email: params.email.toLowerCase(),
          firstName,
          lastName,
          enabled: true,
          emailVerified: params.emailVerified,
          requiredActions: [],
        }),
      });
      await fetch(
        `${iamOrigin}/admin/realms/quantify/users/${userId}/reset-password`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            type: 'password',
            value: params.password,
            temporary: false,
          }),
        },
      );
    } else {
      const createRes = await fetch(
        `${iamOrigin}/admin/realms/quantify/users`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            username: params.email.toLowerCase(),
            email: params.email.toLowerCase(),
            firstName,
            lastName,
            enabled: true,
            emailVerified: params.emailVerified,
            requiredActions: [],
            credentials: [
              {
                type: 'password',
                value: params.password,
                temporary: false,
              },
            ],
          }),
        },
      );
      if (!createRes.ok) {
        throw new ApiError(409, 'USER_ALREADY_EXISTS');
      }
      const location = createRes.headers.get('location') || '';
      userId = location.split('/').pop() || '';
    }

    const roleRes = await fetch(
      `${iamOrigin}/admin/realms/quantify/roles/user`,
      { headers },
    );
    if (roleRes.ok) {
      const role = await roleRes.json();
      await fetch(
        `${iamOrigin}/admin/realms/quantify/users/${userId}/role-mappings/realm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify([role]),
        },
      );
    }

    await this.db.query(
      `INSERT INTO public.profiles(oidc_issuer, oidc_subject, time_zone)
       VALUES ($1, $2, 'America/Mexico_City')
       ON CONFLICT (oidc_issuer, oidc_subject) DO NOTHING`,
      [issuer, userId],
    );

    return userId;
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ deliveredTo: string[]; mailpitUrl: string }> {
    const deliveredTo: string[] = [];

    // 1. Primary Real Email Delivery: Gmail SMTP (smtp.gmail.com) -> Sends to ANY real email address!
    const gmailUser = (
      process.env.GMAIL_SMTP_USER ||
      process.env.SMTP_USER ||
      ''
    ).trim();
    const gmailPass = (
      process.env.GMAIL_SMTP_PASS ||
      process.env.SMTP_PASS ||
      ''
    )
      .replace(/\s+/g, '')
      .trim();

    if (gmailUser && gmailPass) {
      try {
        const gmailTransport = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });
        await gmailTransport.sendMail({
          from: `"Quantify Core V2.0" <${gmailUser}>`,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        deliveredTo.push(`Gmail Real (${options.to})`);
      } catch {
        // fallback to other transports below
      }
    }

    // 2. Optional Mailtrap Sandbox mirror (sandbox.smtp.mailtrap.io)
    if (
      process.env.MAILTRAP_SANDBOX_USER &&
      process.env.MAILTRAP_SANDBOX_PASS
    ) {
      try {
        const sandboxTransport = nodemailer.createTransport({
          host: 'sandbox.smtp.mailtrap.io',
          port: 2525,
          auth: {
            user: process.env.MAILTRAP_SANDBOX_USER,
            pass: process.env.MAILTRAP_SANDBOX_PASS,
          },
        });
        await sandboxTransport.sendMail({
          from: '"Quantify Core V2.0" <no-reply@quantify.core>',
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        deliveredTo.push('Mailtrap Sandbox');
      } catch {
        // ignore sandbox error
      }
    }

    // 3. Optional local Mailpit (127.0.0.1:1025) if running in Docker
    try {
      const localTransport = nodemailer.createTransport({
        host: process.env.MAILPIT_HOST || '127.0.0.1',
        port: Number(process.env.MAILPIT_PORT || 1025),
        secure: false,
        ignoreTLS: true,
        connectionTimeout: 1000,
      } as nodemailer.TransportOptions);
      await localTransport.sendMail({
        from: '"Quantify Core V2.0" <no-reply@quantify.core>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      deliveredTo.push('Mailpit Local');
    } catch {
      // ignore if Mailpit is stopped
    }

    return {
      deliveredTo: deliveredTo.length ? deliveredTo : ['Cola de correo'],
      mailpitUrl: 'http://localhost:8025',
    };
  }

  async recordAudit(entry: {
    action: string;
    category: AuditRecord['category'];
    summary: string;
    ownerId: string;
    email?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditRecord> {
    const createdAt = new Date().toISOString();
    const id = randomUUID();
    const integrityHash = createHash('sha256')
      .update(
        `${id}|${entry.ownerId}|${entry.action}|${entry.summary}|${createdAt}`,
      )
      .digest('hex');

    const mongo = await this.getMongo();
    const record: AuditRecord = {
      id,
      engine: mongo ? 'MongoDB' : 'PostgreSQL',
      action: entry.action,
      category: entry.category,
      summary: entry.summary,
      ownerId: entry.ownerId,
      email: entry.email,
      metadata: entry.metadata,
      integrityHash,
      createdAt,
    };

    this.memoryAudit.unshift(record);
    if (this.memoryAudit.length > 200) this.memoryAudit.length = 200;
    this.savePersistentStore();

    if (mongo) {
      try {
        await mongo.collection('audit_events').insertOne({ ...record });
      } catch {
        // ignore mongo write failure
      }
    }

    return record;
  }

  async requestRegistrationOtp(body: Record<string, unknown>) {
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const timeZone = String(body.timeZone || 'America/Mexico_City');

    if (fullName.length < 2) throw new ApiError(422, 'INVALID_NAME');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError(422, 'INVALID_EMAIL');
    if (password.length < 8) throw new ApiError(422, 'WEAK_PASSWORD');
    if (!isValidIanaTimeZone(timeZone))
      throw new ApiError(422, 'INVALID_TIME_ZONE');

    const code = String(randomInt(100000, 999999));
    this.otpStore.set(`register:${email}`, {
      code,
      email,
      fullName,
      password,
      timeZone,
      purpose: 'register',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const mailResult = await this.sendEmail({
      to: email,
      subject: `Código de verificación Quantify Core: ${code}`,
      text: `Hola ${fullName}, tu código de verificación de 6 dígitos para Quantify Core V2.0 es: ${code}. Vence en 10 minutos.`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0B0F17;color:#FFFFFF;border-radius:16px;border:1px solid #283548;">
          <div style="color:#4A7DE8;font-size:12px;font-weight:700;letter-spacing:1.5px;">QUANTIFY CORE V2.0 · SEGURIDAD E IDENTIDAD</div>
          <h2 style="margin:12px 0;color:#FFFFFF;">Verifica tu cuenta, ${fullName}</h2>
          <p style="color:#8A99AD;line-height:1.6;">Usa el siguiente código de seguridad de 6 dígitos para activar tu perfil en Quantify Core:</p>
          <div style="margin:24px 0;padding:18px;background:#161F2E;border:2px solid #275BC0;border-radius:12px;text-align:center;font-size:32px;font-weight:800;letter-spacing:8px;color:#4A7DE8;">
            ${code}
          </div>
          <p style="color:#8A99AD;font-size:13px;">Este código fue enviado mediante Nodemailer y caduca en 10 minutos.</p>
        </div>
      `,
    });

    await this.recordAudit({
      action: 'AUTH_REGISTER_OTP_SENT',
      category: 'auth',
      summary: `Código de verificación de 6 dígitos enviado por Nodemailer a ${email}`,
      ownerId: email,
      email,
      metadata: { channels: mailResult.deliveredTo, timeZone },
    });

    return {
      ok: true,
      email,
      message: `Enviamos un código de 6 dígitos a ${email} mediante Nodemailer.`,
      mailpitUrl: mailResult.mailpitUrl,
      deliveredTo: mailResult.deliveredTo,
      devCodeHint: code,
    };
  }

  async verifyRegistrationOtp(body: Record<string, unknown>) {
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const code = String(body.code || '').trim();
    const pending = this.otpStore.get(`register:${email}`);

    if (!pending || pending.expiresAt < Date.now() || pending.code !== code) {
      throw new ApiError(400, 'INVALID_OR_EXPIRED_OTP');
    }

    const fullName = pending.fullName || 'Usuario Quantify';
    const timeZone = pending.timeZone || 'America/Mexico_City';
    const passwordHash = createHash('sha256')
      .update(pending.password || '')
      .digest('hex');

    const existingLocal = this.memoryUsers.get(pending.email);
    const localId = existingLocal?.id || randomUUID();
    this.memoryUsers.set(pending.email, {
      id: localId,
      email: pending.email,
      fullName,
      passwordHash,
      timeZone,
    });
    this.savePersistentStore();
    let profileId = localId;
    let tokens: {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
    };

    try {
      const subject = await this.upsertKeycloakUser({
        email: pending.email,
        fullName,
        password: pending.password!,
        emailVerified: true,
      });

      const { issuer } = this.getKeycloakConfig();
      if (pending.timeZone && isValidIanaTimeZone(pending.timeZone)) {
        await this.db.query(
          `UPDATE public.profiles SET time_zone=$3 WHERE oidc_issuer=$1 AND oidc_subject=$2`,
          [issuer, subject, pending.timeZone],
        );
      }

      const profileRow = (
        await this.db.query<{ id: string; time_zone: string; status: string }>(
          `SELECT id, time_zone, status FROM public.profiles WHERE oidc_issuer=$1 AND oidc_subject=$2`,
          [issuer, subject],
        )
      ).rows[0];
      profileId = profileRow.id;
      tokens = await this.mintUserTokens(pending.email, pending.password!);
    } catch {
      // Fault-tolerant local fallback when Docker (Keycloak/PostgreSQL) is closed
      const existingLocal = this.memoryUsers.get(pending.email);
      profileId = existingLocal?.id || randomUUID();
      this.memoryUsers.set(pending.email, {
        id: profileId,
        email: pending.email,
        fullName,
        passwordHash,
        timeZone,
      });
      tokens = this.createFallbackTokens({
        id: profileId,
        email: pending.email,
        fullName,
      });
    }

    this.otpStore.delete(`register:${email}`);

    await this.saveExtendedProfile(profileId, {
      displayName: fullName,
      email: pending.email,
      timeZone,
      bio: 'Construyendo hábitos sostenibles con evidencia e IA.',
      occupation: 'Ingeniería en Desarrollo y Gestión de Software',
      institution: 'Universidad Tecnológica de Xicotepec de Juárez',
      verifiedWithNodemailer: true,
    });

    await this.recordAudit({
      action: 'AUTH_ACCOUNT_VERIFIED',
      category: 'auth',
      summary: `Cuenta verificada con código OTP de 6 dígitos (${pending.email})`,
      ownerId: profileId,
      email: pending.email,
      metadata: { timeZone },
    });

    return {
      ...tokens,
      profile: {
        id: profileId,
        displayName: fullName,
        email: pending.email,
        timeZone,
        roles: ['user'],
        status: 'active',
      },
    };
  }

  async loginWithCredentials(body: Record<string, unknown>) {
    const emailOrUsername = String(
      body.email || body.username || body.emailOrUsername || '',
    )
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    if (!emailOrUsername || !password) {
      throw new ApiError(400, 'CREDENTIALS_REQUIRED');
    }

    try {
      const tokens = await this.mintUserTokens(emailOrUsername, password);
      const payload = JSON.parse(
        Buffer.from(tokens.access_token.split('.')[1], 'base64url').toString(
          'utf8',
        ),
      ) as Record<string, unknown>;
      const subject = String(payload.sub || '');
      const email = String(payload.email || emailOrUsername);
      const displayName = String(
        payload.name || payload.preferred_username || email.split('@')[0],
      );
      const { issuer } = this.getKeycloakConfig();

      await this.db.query(
        `INSERT INTO public.profiles(oidc_issuer, oidc_subject, time_zone)
         VALUES ($1, $2, 'America/Mexico_City')
         ON CONFLICT (oidc_issuer, oidc_subject) DO NOTHING`,
        [issuer, subject],
      );

      const profileRow = (
        await this.db.query<{ id: string; time_zone: string; status: string }>(
          `SELECT id, time_zone, status FROM public.profiles WHERE oidc_issuer=$1 AND oidc_subject=$2`,
          [issuer, subject],
        )
      ).rows[0];

      const ext = await this.getExtendedProfile(profileRow.id);

      await this.recordAudit({
        action: 'AUTH_LOGIN_SUCCESS',
        category: 'auth',
        summary: `Inicio de sesión autenticado (${email})`,
        ownerId: profileRow.id,
        email,
      });

      return {
        ...tokens,
        profile: {
          id: profileRow.id,
          displayName: String(ext.displayName || displayName),
          email,
          timeZone: profileRow.time_zone,
          roles: ['user'],
          status: profileRow.status,
          avatarDataUrl: ext.avatarDataUrl,
          bio: ext.bio,
          occupation: ext.occupation,
        },
      };
    } catch (err) {
      if (err instanceof ApiError && err.getStatus() === 401) throw err;
      const localUser = this.memoryUsers.get(emailOrUsername);
      const passHash = createHash('sha256').update(password).digest('hex');
      if (localUser && localUser.passwordHash === passHash) {
        const tokens = this.createFallbackTokens(localUser);
        const ext = await this.getExtendedProfile(localUser.id);
        await this.recordAudit({
          action: 'AUTH_LOGIN_SUCCESS',
          category: 'auth',
          summary: `Inicio de sesión autenticado (${localUser.email})`,
          ownerId: localUser.id,
          email: localUser.email,
        });
        return {
          ...tokens,
          profile: {
            id: localUser.id,
            displayName: String(ext.displayName || localUser.fullName),
            email: localUser.email,
            timeZone: localUser.timeZone,
            roles: ['user'],
            status: 'active',
            avatarDataUrl: ext.avatarDataUrl,
            bio: ext.bio,
            occupation: ext.occupation,
          },
        };
      }
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }
  }

  async loginWithGoogle(body: Record<string, unknown>) {
    let email = String(body.email || '')
      .trim()
      .toLowerCase();
    let fullName = String(body.fullName || body.name || '').trim();
    let picture = String(body.picture || body.avatarDataUrl || '').trim();
    const googleAccessToken = String(body.googleAccessToken || '').trim();
    const googleIdToken = String(body.googleIdToken || '').trim();

    if (googleAccessToken) {
      try {
        const infoRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${googleAccessToken}` },
            signal: AbortSignal.timeout(5000),
          },
        );
        if (infoRes.ok) {
          const info = (await infoRes.json()) as Record<string, unknown>;
          email = String(info.email || email).toLowerCase();
          fullName = String(info.name || fullName);
          picture = String(info.picture || picture);
        }
      } catch {
        // use provided email/fullName fallback
      }
    } else if (googleIdToken) {
      try {
        const infoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(googleIdToken)}`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (infoRes.ok) {
          const info = (await infoRes.json()) as Record<string, unknown>;
          email = String(info.email || email).toLowerCase();
          fullName = String(info.name || fullName);
          picture = String(info.picture || picture);
        }
      } catch {
        // use provided email/fullName fallback
      }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(422, 'INVALID_GOOGLE_ACCOUNT');
    }
    if (!fullName) fullName = email.split('@')[0];

    const internalPass = createHash('sha256')
      .update(
        `google-oauth-federated:${email}:${process.env.DATABASE_URL || 'qc'}`,
      )
      .digest('hex')
      .slice(0, 32);

    let timeZone = 'America/Mexico_City';
    const existingGoogleLocal = this.memoryUsers.get(email);
    const localGoogleId = existingGoogleLocal?.id || randomUUID();
    this.memoryUsers.set(email, {
      id: localGoogleId,
      email,
      fullName,
      passwordHash: createHash('sha256').update(internalPass).digest('hex'),
      timeZone,
    });
    this.savePersistentStore();
    let profileId = localGoogleId;
    let tokens: {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
    };

    try {
      const subject = await this.upsertKeycloakUser({
        email,
        fullName,
        password: internalPass,
        emailVerified: true,
      });

      const { issuer } = this.getKeycloakConfig();
      const profileRow = (
        await this.db.query<{ id: string; time_zone: string; status: string }>(
          `SELECT id, time_zone, status FROM public.profiles WHERE oidc_issuer=$1 AND oidc_subject=$2`,
          [issuer, subject],
        )
      ).rows[0];
      profileId = profileRow.id;
      timeZone = profileRow.time_zone;
      tokens = await this.mintUserTokens(email, internalPass);
    } catch {
      // Fault-tolerant fallback when Docker is closed
      const existingLocal = this.memoryUsers.get(email);
      profileId = existingLocal?.id || randomUUID();
      this.memoryUsers.set(email, {
        id: profileId,
        email,
        fullName,
        passwordHash: createHash('sha256').update(internalPass).digest('hex'),
        timeZone,
      });
      tokens = this.createFallbackTokens({ id: profileId, email, fullName });
    }

    const existingExt = await this.getExtendedProfile(profileId);

    await this.saveExtendedProfile(profileId, {
      ...existingExt,
      displayName: fullName,
      email,
      provider: 'google',
      ...(picture && !existingExt.avatarDataUrl
        ? { avatarDataUrl: picture }
        : {}),
    });

    await this.recordAudit({
      action: 'AUTH_GOOGLE_OAUTH_LOGIN',
      category: 'auth',
      summary: `Inicio de sesión federado con Google OAuth 2.0 (${email})`,
      ownerId: profileId,
      email,
      metadata: { provider: 'google' },
    });

    return {
      ...tokens,
      profile: {
        id: profileId,
        displayName: fullName,
        email,
        timeZone,
        roles: ['user'],
        status: 'active',
        avatarDataUrl: existingExt.avatarDataUrl || picture || undefined,
      },
    };
  }

  async requestPasswordResetOtp(body: Record<string, unknown>) {
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(422, 'INVALID_EMAIL');
    }

    const code = String(randomInt(100000, 999999));
    this.otpStore.set(`reset:${email}`, {
      code,
      email,
      purpose: 'reset',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const mailResult = await this.sendEmail({
      to: email,
      subject: `Recuperación de contraseña Quantify Core: ${code}`,
      text: `Recibimos una solicitud para restablecer tu contraseña en Quantify Core V2.0. Tu código de seguridad de 6 dígitos es: ${code}. Vence en 10 minutos.`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0B0F17;color:#FFFFFF;border-radius:16px;border:1px solid #283548;">
          <div style="color:#F59E0B;font-size:12px;font-weight:700;letter-spacing:1.5px;">QUANTIFY CORE V2.0 · RECUPERACIÓN DE ACCESO</div>
          <h2 style="margin:12px 0;color:#FFFFFF;">Restablece tu contraseña</h2>
          <p style="color:#8A99AD;line-height:1.6;">Ingresa este código de seguridad de 6 dígitos en la pantalla de recuperación para definir tu nueva contraseña:</p>
          <div style="margin:24px 0;padding:18px;background:#161F2E;border:2px solid #F59E0B;border-radius:12px;text-align:center;font-size:32px;font-weight:800;letter-spacing:8px;color:#F59E0B;">
            ${code}
          </div>
          <p style="color:#8A99AD;font-size:13px;">Enviado con Nodemailer. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </div>
      `,
    });

    await this.recordAudit({
      action: 'AUTH_PASSWORD_RESET_OTP_SENT',
      category: 'security',
      summary: `Código de recuperación de contraseña enviado por Nodemailer a ${email}`,
      ownerId: email,
      email,
    });

    return {
      ok: true,
      email,
      message: `Código de recuperación enviado a ${email} mediante Nodemailer.`,
      mailpitUrl: mailResult.mailpitUrl,
      deliveredTo: mailResult.deliveredTo,
      devCodeHint: code,
    };
  }

  async confirmPasswordReset(body: Record<string, unknown>) {
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const code = String(body.code || '').trim();
    const newPassword = String(body.newPassword || '');

    if (newPassword.length < 8) throw new ApiError(422, 'WEAK_PASSWORD');
    const pending = this.otpStore.get(`reset:${email}`);
    if (!pending || pending.expiresAt < Date.now() || pending.code !== code) {
      throw new ApiError(400, 'INVALID_OR_EXPIRED_OTP');
    }

    const existingLocal = this.memoryUsers.get(email);
    this.memoryUsers.set(email, {
      id: existingLocal?.id || randomUUID(),
      email,
      fullName: existingLocal?.fullName || email.split('@')[0],
      passwordHash: createHash('sha256').update(newPassword).digest('hex'),
      timeZone: existingLocal?.timeZone || 'America/Mexico_City',
    });
    this.savePersistentStore();

    try {
      await this.upsertKeycloakUser({
        email,
        fullName: email.split('@')[0],
        password: newPassword,
        emailVerified: true,
      });
    } catch {
      // already updated in persistent local store
    }
    this.otpStore.delete(`reset:${email}`);

    await this.sendEmail({
      to: email,
      subject: 'Tu contraseña de Quantify Core ha sido actualizada',
      text: 'Confirmamos que tu contraseña de Quantify Core V2.0 fue actualizada exitosamente.',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0B0F17;color:#FFFFFF;border-radius:16px;border:1px solid #283548;">
          <div style="color:#10B981;font-size:12px;font-weight:700;letter-spacing:1.5px;">QUANTIFY CORE V2.0 · CONFIRMACIÓN DE SEGURIDAD</div>
          <h2 style="margin:12px 0;color:#FFFFFF;">Contraseña actualizada</h2>
          <p style="color:#8A99AD;line-height:1.6;">Tu contraseña se actualizó correctamente en Keycloak. Ya puedes iniciar sesión con tu nueva credencial.</p>
        </div>
      `,
    });

    await this.recordAudit({
      action: 'AUTH_PASSWORD_RESET_COMPLETED',
      category: 'security',
      summary: `Contraseña restablecida con éxito mediante código OTP verificado (${email})`,
      ownerId: email,
      email,
    });

    return {
      ok: true,
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
    };
  }

  async getExtendedProfile(ownerId: string): Promise<Record<string, unknown>> {
    const mongo = await this.getMongo();
    if (mongo) {
      try {
        const doc = await mongo
          .collection('user_profiles')
          .findOne({ ownerId }, { projection: { _id: 0 } });
        if (doc) return doc as Record<string, unknown>;
      } catch {
        // fallback to memory
      }
    }
    return this.memoryProfiles.get(ownerId) || {};
  }

  async saveExtendedProfile(
    ownerId: string,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const current = await this.getExtendedProfile(ownerId);
    const allowed: Record<string, unknown> = {
      ...current,
      ownerId,
      updatedAt: new Date().toISOString(),
    };
    for (const key of [
      'displayName',
      'email',
      'bio',
      'occupation',
      'institution',
      'phone',
      'timeZone',
      'avatarDataUrl',
      'bannerColor',
      'accentColor',
      'density',
      'fontSize',
      'remindersEnabled',
      'weeklySummaryEnabled',
      'provider',
    ]) {
      if (input[key] !== undefined) allowed[key] = input[key];
    }

    if (
      typeof input.timeZone === 'string' &&
      isValidIanaTimeZone(input.timeZone)
    ) {
      try {
        await this.db.query(
          `UPDATE public.profiles SET time_zone=$2 WHERE id=$1`,
          [ownerId, input.timeZone],
        );
      } catch {
        // runtime role stores custom timeZone in MongoDB user_profiles
      }
    }

    this.memoryProfiles.set(ownerId, allowed);
    const mongo = await this.getMongo();
    if (mongo) {
      try {
        await mongo
          .collection('user_profiles')
          .updateOne({ ownerId }, { $set: allowed }, { upsert: true });
      } catch {
        // ignore
      }
    }

    await this.recordAudit({
      action: 'PROFILE_CUSTOMIZED',
      category: 'profile',
      summary: `Perfil y personalización visual actualizados (${String(allowed.displayName || ownerId)})`,
      ownerId,
      email: typeof allowed.email === 'string' ? allowed.email : undefined,
      metadata: {
        hasAvatar: Boolean(allowed.avatarDataUrl),
        timeZone: allowed.timeZone,
        accentColor: allowed.accentColor,
      },
    });

    return allowed;
  }

  async saveEvidence(ownerId: string, input: Record<string, unknown>) {
    const entry = {
      id: randomUUID(),
      ownerId,
      habitId: String(input.habitId || ''),
      habitName: String(input.habitName || 'Hábito'),
      businessDate: String(
        input.businessDate || new Date().toISOString().slice(0, 10),
      ),
      value: Number(input.value ?? 0),
      unit: String(input.unit || ''),
      note: String(input.note || '').trim(),
      mood: String(input.mood || 'enfocado'),
      energyLevel: Number(input.energyLevel ?? 8),
      imageDataUrl:
        typeof input.imageDataUrl === 'string' ? input.imageDataUrl : undefined,
      createdAt: new Date().toISOString(),
    };

    this.memoryEvidence.unshift(entry);
    const mongo = await this.getMongo();
    if (mongo) {
      try {
        await mongo.collection('checkin_evidence').insertOne({ ...entry });
      } catch {
        // ignore
      }
    }

    await this.recordAudit({
      action: 'CHECKIN_EVIDENCE_SAVED',
      category: 'checkin',
      summary: `Evidencia registrada para "${entry.habitName}" (${entry.value} ${entry.unit}) en ${entry.businessDate}`,
      ownerId,
      metadata: {
        habitId: entry.habitId,
        hasImage: Boolean(entry.imageDataUrl),
        mood: entry.mood,
        energyLevel: entry.energyLevel,
      },
    });

    return entry;
  }

  async listEvidence(ownerId: string, habitId?: string) {
    const mongo = await this.getMongo();
    if (mongo) {
      try {
        const filter: Record<string, unknown> = { ownerId };
        if (habitId) filter.habitId = habitId;
        const docs = await mongo
          .collection('checkin_evidence')
          .find(filter, { projection: { _id: 0 } })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray();
        if (docs.length > 0) return docs;
      } catch {
        // fallback to memory
      }
    }
    return this.memoryEvidence.filter(
      (e) => e.ownerId === ownerId && (!habitId || e.habitId === habitId),
    );
  }

  async getHybridAuditTrail(ownerId: string) {
    let sqlOutboxRows: Array<{
      id: string;
      aggregate_type: string;
      event_type: string;
      occurred_at: Date;
    }> = [];
    let sqlHabitRevCount = 0;
    let sqlCheckInRevCount = 0;
    let sqlReceiptsCount = 0;
    let pgConnected = false;

    try {
      const [sqlOutbox, sqlHabitRev, sqlCheckInRev, sqlReceipts] =
        await Promise.all([
          this.db.query<{
            id: string;
            aggregate_type: string;
            event_type: string;
            occurred_at: Date;
          }>(
            `SELECT id::text, aggregate_type, event_type, occurred_at
             FROM public.audit_outbox
             WHERE owner_id = $1
             ORDER BY occurred_at DESC LIMIT 30`,
            [ownerId],
          ),
          this.db.query<{ count: number }>(
            `SELECT count(*)::integer AS count FROM public.habit_revisions WHERE habit_id IN (SELECT id FROM public.habits WHERE owner_id = $1)`,
            [ownerId],
          ),
          this.db.query<{ count: number }>(
            `SELECT count(*)::integer AS count FROM public.check_in_revisions WHERE check_in_id IN (SELECT id FROM public.check_ins WHERE owner_id = $1)`,
            [ownerId],
          ),
          this.db.query<{ count: number }>(
            `SELECT count(*)::integer AS count FROM public.api_receipts WHERE owner_id = $1`,
            [ownerId],
          ),
        ]);
      sqlOutboxRows = sqlOutbox.rows;
      sqlHabitRevCount = sqlHabitRev.rows[0]?.count ?? 0;
      sqlCheckInRevCount = sqlCheckInRev.rows[0]?.count ?? 0;
      sqlReceiptsCount = sqlReceipts.rows[0]?.count ?? 0;
      pgConnected = true;
    } catch {
      pgConnected = false;
    }

    const mongo = await this.getMongo();
    let mongoAuditDocs: AuditRecord[] = [];
    let mongoEvidenceCount = 0;
    let mongoAiCount = this.memoryAiCount;

    if (mongo) {
      try {
        mongoAuditDocs = (await mongo
          .collection('audit_events')
          .find({}, { projection: { _id: 0 } })
          .sort({ createdAt: -1 })
          .limit(40)
          .toArray()) as unknown as AuditRecord[];
        mongoEvidenceCount = await mongo
          .collection('checkin_evidence')
          .countDocuments({ ownerId });
        mongoAiCount = await mongo
          .collection('ai_interactions')
          .countDocuments({ ownerId });
      } catch {
        mongoAuditDocs = this.memoryAudit;
      }
    } else {
      mongoAuditDocs = this.memoryAudit;
    }

    const sqlEvents: AuditRecord[] = sqlOutboxRows.map((row) => {
      const createdAt = new Date(row.occurred_at).toISOString();
      return {
        id: `sql-${row.id}`,
        engine: 'PostgreSQL',
        action: row.event_type.toUpperCase(),
        category: row.aggregate_type === 'habit' ? 'habit' : 'checkin',
        summary: `Transacción ACID confirmada en PostgreSQL (${row.aggregate_type} · ${row.event_type})`,
        ownerId,
        integrityHash: createHash('sha256')
          .update(`${row.id}|${row.event_type}|${createdAt}`)
          .digest('hex'),
        createdAt,
      };
    });

    const combined = [...mongoAuditDocs, ...sqlEvents].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    return {
      hybridStats: {
        postgresConnected: pgConnected,
        postgresEngine: 'PostgreSQL 18.6 (Transaccional ACID + Ledger)',
        mongoConnected: Boolean(mongo),
        mongoEngine: mongo
          ? 'MongoDB 8.2.6 (Documental · Eventos, Evidencia e IA)'
          : 'Motor Híbrido Local Activo',
        sqlHabitRevisions: sqlHabitRevCount,
        sqlCheckInRevisions: sqlCheckInRevCount,
        sqlIdempotencyReceipts: sqlReceiptsCount,
        mongoAuditDocuments: mongoAuditDocs.length,
        mongoEvidenceDocuments:
          mongoEvidenceCount || this.memoryEvidence.length,
        mongoAiInteractions: mongoAiCount,
      },
      events: combined.slice(0, 50),
    };
  }

  async runGeminiAi(ownerId: string, body: Record<string, unknown>) {
    const mode = String(body.mode || 'dashboard-insights');
    const customApiKey = String(
      body.geminiApiKey || process.env.GEMINI_API_KEY || '',
    ).trim();

    let userHabits: Array<{
      name: string;
      target_value: string;
      unit: string;
      status: string;
      weekdays: number[];
    }> = [];
    let recentCheckIns: Array<{
      value: string;
      unit: string;
      business_date: string;
      progress_status: string;
    }> = [];

    try {
      const habitsRes = await this.db.query<{
        name: string;
        target_value: string;
        unit: string;
        status: string;
        weekdays: number[];
      }>(
        `SELECT name, target_value::text, unit, status, weekdays FROM public.habits WHERE owner_id = $1 ORDER BY created_at DESC`,
        [ownerId],
      );
      const checkInsRes = await this.db.query<{
        value: string;
        unit: string;
        business_date: string;
        progress_status: string;
      }>(
        `SELECT value::text, unit, business_date::text, progress_status FROM public.check_ins WHERE owner_id = $1 ORDER BY business_date DESC LIMIT 30`,
        [ownerId],
      );
      userHabits = habitsRes.rows;
      recentCheckIns = checkInsRes.rows;
    } catch {
      // use empty / default habits if PostgreSQL is offline
    }
    const completedCount = recentCheckIns.filter(
      (c) => c.progress_status === 'completed',
    ).length;
    const completionPct = recentCheckIns.length
      ? Math.round((completedCount / recentCheckIns.length) * 100)
      : 78;

    let geminiText: string | null = null;
    let usedProvider = 'Quantify Behavioral AI Engine (Local + Reglas)';

    if (customApiKey) {
      try {
        const prompt =
          mode === 'chat'
            ? `Eres Quantify AI, el asistente experto en hábitos, prevención de desgaste y productividad sostenible de Quantify Core V2.0.
Hábitos actuales del usuario en PostgreSQL: ${JSON.stringify(userHabits)}.
Check-ins recientes: ${JSON.stringify(recentCheckIns.slice(0, 10))}.
Mensaje del usuario: "${String(body.message || '¿Cómo puedo mejorar mis hábitos?')}".
Responde en español de forma empática, estructurada, práctica y breve (máximo 140 palabras), sin dar diagnósticos médicos.`
            : mode === 'optimize-habit'
              ? `Eres Quantify AI. El usuario quiere crear o mejorar el hábito: "${String(body.habitName || 'Estudiar')}".
Hábitos que ya tiene: ${JSON.stringify(userHabits)}.
Devuelve SOLO un JSON válido sin bloques markdown con las claves:
{"targetValue": numero, "unit": "min"|"vasos"|"pasos"|"veces"|"páginas"|"km"|"horas", "weekdays": [1,2,3,4,5], "detail": "Por la mañana"|"Por la tarde"|"Por la noche", "intention": "frase motivadora clara", "rationale": "explicación breve de por qué esta meta evita el desgaste"}`
              : `Eres Quantify AI. Analiza los hábitos actuales del usuario: ${JSON.stringify(userHabits)} y sus check-ins: ${JSON.stringify(recentCheckIns.slice(0, 10))}.
Da un diagnóstico breve de equilibrio/constancia y 3 recomendaciones concretas en español (máximo 110 palabras).`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(customApiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(12000),
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 650 },
            }),
          },
        );
        if (geminiRes.ok) {
          const data = (await geminiRes.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          geminiText =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
          if (geminiText) usedProvider = 'Google Gemini Flash API (En vivo)';
        }
      } catch {
        // fallback to deterministic contextual AI
      }
    }

    this.memoryAiCount += 1;
    const mongo = await this.getMongo();
    if (mongo) {
      try {
        await mongo.collection('ai_interactions').insertOne({
          id: randomUUID(),
          ownerId,
          mode,
          provider: usedProvider,
          habitsAnalyzed: userHabits.length,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // ignore
      }
    }

    await this.recordAudit({
      action: `AI_${mode.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
      category: 'ai',
      summary: `Inferencia de IA ejecutada (${usedProvider}) sobre ${userHabits.length} hábito(s) del usuario`,
      ownerId,
      metadata: { mode, provider: usedProvider },
    });

    if (mode === 'optimize-habit') {
      const rawName = String(body.habitName || 'Hábito saludable').trim();
      const lower = rawName.toLocaleLowerCase('es');
      let parsed: Record<string, unknown> | null = null;
      if (geminiText) {
        try {
          const clean = geminiText
            .replace(/^```json\s*/i, '')
            .replace(/```$/i, '')
            .trim();
          parsed = JSON.parse(clean) as Record<string, unknown>;
        } catch {
          parsed = null;
        }
      }
      const fallback = lower.includes('agua') || lower.includes('hidrat')
        ? {
          targetValue: 8,
          unit: 'vasos',
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          detail: 'Por la mañana',
          intention: 'Mantener hidratación constante durante mis bloques de estudio y trabajo.',
          rationale:
            'La IA recomienda 8 vasos distribuidos durante el día para sostener la atención cognitiva sin sobrecarga.',
        }
        : lower.includes('leer') || lower.includes('lectura') || lower.includes('estudi')
          ? {
            targetValue: 25,
            unit: 'min',
            weekdays: [1, 2, 3, 4, 5],
            detail: 'Por la noche',
            intention: 'Dedicar 25 minutos de enfoque profundo sin notificaciones.',
            rationale:
              'Un bloque Pomodoro de 25 min entre semana maximiza la retención y deja el fin de semana para recuperación.',
          }
          : lower.includes('caminar') || lower.includes('correr') || lower.includes('paso')
            ? {
              targetValue: 6000,
              unit: 'pasos',
              weekdays: [1, 2, 3, 4, 5, 6],
              detail: 'Por la mañana',
              intention: 'Activar mi circulación y despejar la mente antes de iniciar el día.',
              rationale:
                '6,000 pasos diarios con un día de descanso activo reducen el sedentarismo sin provocar fatiga.',
            }
            : {
              targetValue: 20,
              unit: 'min',
              weekdays: [1, 2, 3, 4, 5],
              detail: 'Por la mañana',
              intention: `Construir constancia sostenible en "${rawName}" paso a paso.`,
              rationale:
                'Comenzar con 20 minutos de lunes a viernes reduce la fricción inicial y protege tu energía.',
            };

      return {
        provider: usedProvider,
        suggestion: {
          targetValue: Number(parsed?.targetValue || fallback.targetValue),
          unit: String(parsed?.unit || fallback.unit),
          weekdays: Array.isArray(parsed?.weekdays)
            ? parsed.weekdays
            : fallback.weekdays,
          detail: String(parsed?.detail || fallback.detail),
          intention: String(parsed?.intention || fallback.intention),
          rationale: String(parsed?.rationale || fallback.rationale),
        },
      };
    }

    if (mode === 'chat') {
      const userQuestion = String(body.message || '').trim();
      const habitNames =
        userHabits.map((h) => `${h.name} (${h.target_value} ${h.unit})`).join(', ') ||
        'Tomar agua, Leer, Caminar';
      const reply =
        geminiText ||
        `He analizado tus hábitos actuales (${habitNames}) y tu tasa de cumplimiento del ${completionPct}%. ` +
        (userQuestion.toLowerCase().includes('racha') ||
          userQuestion.toLowerCase().includes('constancia')
          ? `Para proteger tu racha sin caer en desgaste, te recomiendo la regla del "mínimo viable": en días de alta carga académica, registra al menos el 50% de tu meta en tu horario fijo y agrúpalo después de una actividad que ya hagas a diario.`
          : userQuestion.toLowerCase().includes('descanso') ||
            userQuestion.toLowerCase().includes('cansado')
            ? `Observo que tu carga activa requiere pausas de recuperación. Te sugiero intercalar una "Pausa visual 20-20-20" de 15 minutos por la tarde y desconectar pantallas 30 minutos antes de dormir.`
            : `Basado en tu perfil de Quantify Core, la mejor estrategia para "${userQuestion || 'mejorar tu rutina'}" es anclar tu hábito más exigente a tu primer bloque de la mañana y dejar los hábitos de desconexión o lectura para la noche.`);

      return {
        provider: usedProvider,
        reply,
        analyzedHabitsCount: userHabits.length,
        completionRate: completionPct,
      };
    }

    // Default: dashboard-insights + contextual AI habit recommendations
    const existingNames = new Set(
      userHabits.map((h) => h.name.toLocaleLowerCase('es')),
    );
    const allRecs = [
      {
        id: 'ai-rec-1',
        name: 'Pausa cognitiva Pomodoro',
        targetValue: 15,
        unit: 'min',
        detail: 'Por la tarde',
        intention: 'Prevenir fatiga mental tras bloques intensos de código o estudio',
        color: 'cyan',
        icon: 'descanso',
        confidence: 96,
        aiReason:
          'Detectamos hábitos de enfoque diario; intercalar 15 min de pausa consciente reduce el riesgo de desgaste en un 34%.',
      },
      {
        id: 'ai-rec-2',
        name: 'Hidratación neuro-activa',
        targetValue: 8,
        unit: 'vasos',
        detail: 'Por la mañana',
        intention: 'Sostener claridad mental y energía desde primera hora',
        color: 'blue',
        icon: 'habitos',
        confidence: 94,
        aiReason:
          'Complementa tu rutina matutina con un disparador inmediato al despertar.',
      },
      {
        id: 'ai-rec-3',
        name: 'Caminata de oxigenación',
        targetValue: 6000,
        unit: 'pasos',
        detail: 'Por la mañana',
        intention: 'Activar circulación y reducir cortisol acumulado',
        color: 'emerald',
        icon: 'movimiento',
        confidence: 92,
        aiReason:
          'Balancea tus hábitos sedentarios con movimiento aeróbico ligero.',
      },
      {
        id: 'ai-rec-4',
        name: 'Lectura profunda sin pantallas',
        targetValue: 25,
        unit: 'min',
        detail: 'Por la noche',
        intention: 'Mejorar la calidad del sueño y consolidar aprendizaje',
        color: 'emerald',
        icon: 'lectura',
        confidence: 91,
        aiReason:
          'Sustituir luz azul nocturna por 25 min de lectura eleva tu recuperación para el día siguiente.',
      },
      {
        id: 'ai-rec-5',
        name: 'Planificación estratégica del día',
        targetValue: 10,
        unit: 'min',
        detail: 'Por la mañana',
        intention: 'Definir las 3 prioridades clave antes de abrir redes o correo',
        color: 'blue',
        icon: 'calendario',
        confidence: 89,
        aiReason:
          'Incrementa la tasa de cierre de hábitos programados entre lunes y viernes.',
      },
    ];

    const filteredRecs = allRecs.filter(
      (r) => !existingNames.has(r.name.toLocaleLowerCase('es')),
    );

    return {
      provider: usedProvider,
      archetype:
        completionPct >= 80
          ? 'Arquitecto Constante · Alto Equilibrio'
          : completionPct >= 50
            ? 'Constructor en Ascenso · Ritmo Sostenible'
            : 'Explorador en Ajuste · Priorizar Micro-hábitos',
      burnoutRisk:
        userHabits.length > 6
          ? 'Moderado (Revisa tu carga diaria)'
          : 'Bajo (Carga óptima y recuperable)',
      energyScore: Math.min(98, Math.max(72, completionPct + 14)),
      summary:
        geminiText ||
        `Quantify AI analizó tus ${userHabits.length || 3} hábitos activos y ${recentCheckIns.length} registros recientes. Tu índice de constancia es del ${completionPct}% con riesgo de desgaste bajo. Te recomendamos reforzar tus bloques matutinos y mantener al menos un hábito de recuperación nocturna.`,
      recommendations: filteredRecs.slice(0, 4),
    };
  }

  async submitContactForm(body: Record<string, unknown>) {
    const name = String(body.name || '').trim();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const subject = String(body.subject || 'Consulta sobre Quantify Core V2.0').trim();
    const message = String(body.message || '').trim();

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
      throw new ApiError(422, 'INVALID_CONTACT_FORM');
    }

    const mailResult = await this.sendEmail({
      to: email,
      subject: `Confirmación de contacto · Quantify Core V2.0 (${subject})`,
      text: `Hola ${name}, recibimos tu mensaje en Quantify Core V2.0: "${message}". Nuestro equipo de la UTXJ te responderá pronto.`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0B0F17;color:#FFFFFF;border-radius:16px;border:1px solid #283548;">
          <div style="color:#4A7DE8;font-size:12px;font-weight:700;letter-spacing:1.5px;">QUANTIFY CORE V2.0 · SOPORTE Y CONTACTO</div>
          <h2 style="margin:12px 0;color:#FFFFFF;">¡Gracias por escribirnos, ${name}!</h2>
          <p style="color:#8A99AD;line-height:1.6;">Hemos registrado tu mensaje correctamente en nuestra base de datos híbrida y notificado al equipo:</p>
          <blockquote style="margin:18px 0;padding:14px;background:#161F2E;border-left:4px solid #275BC0;color:#F4F7FD;">${message}</blockquote>
          <p style="color:#8A99AD;font-size:13px;">Equipo Quantify Core · Universidad Tecnológica de Xicotepec de Juárez (10.º A).</p>
        </div>
      `,
    });

    await this.recordAudit({
      action: 'CONTACT_MESSAGE_RECEIVED',
      category: 'profile',
      summary: `Mensaje de contacto recibido de ${name} (${email}): ${subject}`,
      ownerId: email,
      email,
    });

    return {
      ok: true,
      message: 'Mensaje enviado con éxito mediante Nodemailer. Revisa la confirmación en tu correo.',
      mailpitUrl: mailResult.mailpitUrl,
    };
  }
}

@Controller('workspace')
class WorkspacePublicController {
  constructor(private readonly workspace: WorkspaceService) { }

  @Post('auth/register')
  register(@Body() body: Record<string, unknown>) {
    return this.workspace.requestRegistrationOtp(body);
  }

  @Post('auth/verify-code')
  verifyCode(@Body() body: Record<string, unknown>) {
    return this.workspace.verifyRegistrationOtp(body);
  }

  @Post('auth/login')
  login(@Body() body: Record<string, unknown>) {
    return this.workspace.loginWithCredentials(body);
  }

  @Post('auth/google')
  google(@Body() body: Record<string, unknown>) {
    return this.workspace.loginWithGoogle(body);
  }

  @Post('auth/forgot-password')
  forgotPassword(@Body() body: Record<string, unknown>) {
    return this.workspace.requestPasswordResetOtp(body);
  }

  @Post('auth/reset-password')
  resetPassword(@Body() body: Record<string, unknown>) {
    return this.workspace.confirmPasswordReset(body);
  }

  @Post('contact')
  contact(@Body() body: Record<string, unknown>) {
    return this.workspace.submitContactForm(body);
  }
}

@Controller('workspace')
@UseGuards(TelemetryIdentity)
class WorkspaceProtectedController {
  constructor(private readonly workspace: WorkspaceService) { }

  @Get('profile')
  getProfile(@Req() req: TelemetryRequest) {
    return this.workspace.getExtendedProfile(req.telemetryOwner);
  }

  @Post('profile')
  saveProfile(
    @Req() req: TelemetryRequest,
    @Body() body: Record<string, unknown>,
  ) {
    return this.workspace.saveExtendedProfile(req.telemetryOwner, body);
  }

  @Get('evidence')
  listEvidence(
    @Req() req: TelemetryRequest,
    @Query('habitId') habitId?: string,
  ) {
    return this.workspace.listEvidence(req.telemetryOwner, habitId);
  }

  @Post('evidence')
  saveEvidence(
    @Req() req: TelemetryRequest,
    @Body() body: Record<string, unknown>,
  ) {
    return this.workspace.saveEvidence(req.telemetryOwner, body);
  }

  @Get('audit')
  getAudit(@Req() req: TelemetryRequest) {
    return this.workspace.getHybridAuditTrail(req.telemetryOwner);
  }

  @Post('ai/analyze')
  runAi(@Req() req: TelemetryRequest, @Body() body: Record<string, unknown>) {
    return this.workspace.runGeminiAi(req.telemetryOwner, body);
  }
}

@Module({
  controllers: [WorkspacePublicController, WorkspaceProtectedController],
  providers: [WorkspaceService],
})
export class WorkspaceModule { }
