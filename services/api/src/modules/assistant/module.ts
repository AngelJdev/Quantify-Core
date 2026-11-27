import { Body, Controller, Get, Headers, HttpCode, Inject, Injectable, Module, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { TelemetryIdentity, TelemetryRequest } from '../../../telemetry/src/auth';
import { CONFIG } from '../../../telemetry/src/config';
import { TelemetryDatabase as Database } from '../../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../../telemetry/src/errors';
import type { CoreConfig } from '../../platform/config';
import { body, fingerprint, uuid } from '../../platform/contracts';
import {
  ASSISTANT_PROVIDER,
  AssistantHabitContext,
  AssistantProvider,
  AssistantTurnInput,
  GeminiAssistantProvider,
} from './provider';

export const ASSISTANT_POLICY_VERSION = 'assistant-v1';

@Injectable()
export class AssistantService {
  private readonly rateBuckets = new Map<string, number[]>();

  constructor(
    private readonly db: Database,
    @Inject(CONFIG) private readonly config: CoreConfig,
    @Inject(ASSISTANT_PROVIDER) private readonly provider: AssistantProvider,
  ) {}

  async getConsent(ownerId: string) {
    const result = await this.db.query<{
      granted: boolean;
      policy_version: string;
      updated_at: Date | string;
    }>(
      'SELECT granted, policy_version, updated_at FROM assistant_consents WHERE owner_id = $1',
      [ownerId],
    );
    const row = result.rows[0];
    if (!row) {
      return {
        granted: false,
        policyVersion: ASSISTANT_POLICY_VERSION,
        updatedAt: null,
      };
    }
    return {
      granted: row.granted,
      policyVersion: row.policy_version,
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  async setConsent(ownerId: string, rawKey: unknown, input: unknown) {
    if (!this.config.writesEnabled) {
      throw new ApiError(503, 'REVIEW_WRITES_DISABLED');
    }
    const key = uuid(rawKey);
    const d = body('AssistantConsentUpdate', input) as { granted: boolean };
    const hash = fingerprint({ operation: 'assistant:consent', command: d });

    return this.db.transaction(async (client) => {
      const actor = await client.query<{ status: string }>(
        'SELECT status FROM profiles WHERE id = $1 FOR UPDATE',
        [ownerId],
      );
      if (actor.rows[0]?.status !== 'active') {
        throw new ApiError(403, 'PROFILE_NOT_ACTIVE');
      }

      const prior = await client.query<{
        fingerprint: string;
        response: Record<string, unknown>;
      }>(
        'SELECT fingerprint, response FROM api_receipts WHERE owner_id = $1 AND operation = $2 AND idempotency_key = $3',
        [ownerId, 'assistant:consent', key],
      );
      if (prior.rowCount) {
        if (prior.rows[0].fingerprint !== hash) {
          throw new ApiError(409, 'IDEMPOTENCY_KEY_CONFLICT');
        }
        return prior.rows[0].response;
      }

      const upserted = await client.query<{
        granted: boolean;
        policy_version: string;
        version: number;
        updated_at: Date | string;
      }>(
        `INSERT INTO assistant_consents(owner_id, granted, policy_version, version, updated_at)
         VALUES($1, $2, $3, 1, clock_timestamp())
         ON CONFLICT (owner_id) DO UPDATE
           SET granted = EXCLUDED.granted,
               policy_version = EXCLUDED.policy_version,
               version = assistant_consents.version + 1,
               updated_at = clock_timestamp()
         RETURNING granted, policy_version, version, updated_at`,
        [ownerId, d.granted, ASSISTANT_POLICY_VERSION],
      );
      const saved = upserted.rows[0];
      const responseBody = {
        granted: saved.granted,
        policyVersion: saved.policy_version,
        updatedAt: new Date(saved.updated_at).toISOString(),
      };

      await client.query(
        `INSERT INTO audit_outbox(aggregate_type, aggregate_id, event_type, aggregate_version, owner_id, payload)
         VALUES('assistant-consent', $1, $2, $3, $1, $4)`,
        [
          ownerId,
          d.granted ? 'assistant.consent_granted' : 'assistant.consent_revoked',
          saved.version,
          JSON.stringify({ granted: d.granted, policyVersion: ASSISTANT_POLICY_VERSION }),
        ],
      );
      await client.query(
        `INSERT INTO api_receipts(owner_id, operation, idempotency_key, fingerprint, response, http_status)
         VALUES($1, 'assistant:consent', $2, $3, $4, 200)`,
        [ownerId, key, hash, responseBody],
      );
      return responseBody;
    });
  }

  async sendMessage(ownerId: string, input: unknown, res: Response) {
    const d = body('AssistantMessageRequest', input) as {
      messages: AssistantTurnInput[];
      includeHabitContext: boolean;
    };

    const messages: AssistantTurnInput[] = d.messages.map((turn) => ({
      role: turn.role,
      text: turn.text.trim(),
    }));
    if (
      messages.some((turn) => turn.text.length === 0) ||
      messages[messages.length - 1]?.role !== 'user'
    ) {
      throw new ApiError(422, 'INVALID_CONVERSATION_TURN');
    }

    const consent = await this.db.query<{ granted: boolean }>(
      'SELECT granted FROM assistant_consents WHERE owner_id = $1',
      [ownerId],
    );
    if (!consent.rows[0]?.granted) {
      throw new ApiError(403, 'ASSISTANT_CONSENT_REQUIRED');
    }

    this.enforceRateLimit(ownerId, res);

    let contextHabits: AssistantHabitContext[] = [];
    if (d.includeHabitContext) {
      const habitsResult = await this.db.query<{
        name: string;
        target_value: number;
        unit: string;
        weekdays: number[];
        status: string;
      }>(
        `SELECT name, target_value::float8 AS target_value, unit, weekdays, status
         FROM habits
         WHERE owner_id = $1 AND status IN ('active', 'paused')
         ORDER BY created_at DESC
         LIMIT 25`,
        [ownerId],
      );
      contextHabits = habitsResult.rows.map((row) => ({
        name: row.name,
        targetValue: Number(row.target_value),
        unit: row.unit,
        weekdays: Array.isArray(row.weekdays) ? row.weekdays.map(Number) : [],
        status: row.status,
      }));
    }

    // Never hold a database transaction open across an external provider call.
    const generated = await this.provider.generate({
      messages,
      contextHabits,
      includeHabitContext: d.includeHabitContext,
    });

    return {
      reply: generated.reply,
      draft: generated.draft,
      missingFields: generated.missingFields,
      outOfScope: generated.outOfScope,
      model: generated.model,
      contextUsed: d.includeHabitContext,
      generatedAt: new Date().toISOString(),
    };
  }

  private enforceRateLimit(ownerId: string, res: Response): void {
    const maxRequests = this.config.assistant?.maxRequestsPerWindow ?? 20;
    const windowMs = this.config.assistant?.rateWindowMs ?? 60000;
    const now = Date.now();
    const cutoff = now - windowMs;
    const existing = (this.rateBuckets.get(ownerId) ?? []).filter((ts) => ts > cutoff);
    if (existing.length >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing[0] + windowMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      this.rateBuckets.set(ownerId, existing);
      throw new ApiError(429, 'ASSISTANT_RATE_LIMITED');
    }
    existing.push(now);
    this.rateBuckets.set(ownerId, existing);
  }
}

@Controller('me/assistant-consent')
@UseGuards(TelemetryIdentity)
class AssistantConsentController {
  constructor(private readonly assistant: AssistantService) {}

  @Get()
  getOwn(@Req() req: TelemetryRequest) {
    return this.assistant.getConsent(req.telemetryOwner);
  }

  @Post()
  @HttpCode(200)
  setOwn(
    @Req() req: TelemetryRequest,
    @Headers('idempotency-key') key: string,
    @Body() input: unknown,
  ) {
    return this.assistant.setConsent(req.telemetryOwner, key, input);
  }
}

@Controller('assistant')
@UseGuards(TelemetryIdentity)
class AssistantMessagesController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('messages')
  @HttpCode(200)
  send(
    @Req() req: TelemetryRequest,
    @Body() input: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.assistant.sendMessage(req.telemetryOwner, input, res);
  }
}

@Module({
  controllers: [AssistantConsentController, AssistantMessagesController],
  providers: [
    AssistantService,
    {
      provide: ASSISTANT_PROVIDER,
      inject: [CONFIG],
      useFactory: (config: CoreConfig): AssistantProvider =>
        config.assistantProvider ?? new GeminiAssistantProvider(config),
    },
  ],
})
export class AssistantModule {}
