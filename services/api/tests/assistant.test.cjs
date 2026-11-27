const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { randomUUID, randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const Ajv = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const { migrate } = require('../db/migrate.cjs');
const { createApi } = require('../build/src/main');
const { GeminiAssistantProvider } = require('../build/src/modules/assistant/provider');

async function freePort() {
  const server = net.createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  await new Promise((r) => server.close(r));
  return port;
}

test('GeminiAssistantProvider sends x-goog-api-key header, enforces schema and maps errors safely', async (t) => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url: String(url), init });
    const parsedBody = JSON.parse(init.body);
    const lastText = parsedBody.contents[parsedBody.contents.length - 1].parts[0].text;

    if (lastText === 'TRIGGER_429') {
      return new Response(JSON.stringify({ error: { code: 429 } }), { status: 429 });
    }
    if (lastText === 'TRIGGER_SAFETY') {
      return new Response(
        JSON.stringify({ candidates: [{ finishReason: 'SAFETY' }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (lastText === 'TRIGGER_BAD_DRAFT') {
      return new Response(
        JSON.stringify({
          modelVersion: 'gemini-3.5-flash',
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      reply: 'Cuéntame cuántos minutos quieres dedicar.',
                      outOfScope: false,
                      missingFields: ['targetValue', 'invalidField'],
                      draft: { name: 'ab', targetValue: -5, unit: '', weekdays: [9], rationale: '' },
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        modelVersion: 'gemini-3.5-flash',
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    reply: 'Preparé un borrador de lectura. Revísalo y confírmalo si te sirve.',
                    outOfScope: false,
                    missingFields: [],
                    draft: {
                      name: '  Lectura nocturna  ',
                      targetValue: 20,
                      unit: ' min ',
                      weekdays: [5, 1, 3, 1],
                      rationale: ' Empezar con 20 minutos tres veces por semana facilita la constancia. ',
                    },
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  await t.test('fails closed with 503 when GEMINI_API_KEY is absent', async () => {
    const provider = new GeminiAssistantProvider({ assistant: { model: 'gemini-3.5-flash', baseUrl: 'https://example.test/v1beta', timeoutMs: 5000, maxRequestsPerWindow: 5, rateWindowMs: 60000 } }, fakeFetch);
    await assert.rejects(
      () => provider.generate({ messages: [{ role: 'user', text: 'Hola' }], contextHabits: [], includeHabitContext: false }),
      (err) => err.getStatus() === 503 && err.getResponse().code === 'ASSISTANT_UNAVAILABLE',
    );
    assert.equal(calls.length, 0);
  });

  const provider = new GeminiAssistantProvider(
    {
      assistant: {
        apiKey: 'synthetic-test-key-never-logged',
        model: 'gemini-3.5-flash',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        timeoutMs: 5000,
        maxRequestsPerWindow: 5,
        rateWindowMs: 60000,
      },
    },
    fakeFetch,
  );

  await t.test('never puts API key in URL query and normalizes valid draft', async () => {
    const result = await provider.generate({
      messages: [{ role: 'user', text: 'Recomiéndame lectura nocturna' }],
      contextHabits: [{ name: 'Tomar agua', targetValue: 8, unit: 'vasos', weekdays: [1, 2, 3, 4, 5], status: 'active' }],
      includeHabitContext: true,
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.includes('key='), false);
    assert.equal(calls[0].url.includes('synthetic-test-key'), false);
    assert.equal(calls[0].init.headers['x-goog-api-key'], 'synthetic-test-key-never-logged');
    assert.deepEqual(result.draft, {
      name: 'Lectura nocturna',
      targetValue: 20,
      unit: 'min',
      weekdays: [1, 3, 5],
      rationale: 'Empezar con 20 minutos tres veces por semana facilita la constancia.',
    });
    assert.deepEqual(result.missingFields, []);
    assert.equal(result.outOfScope, false);
  });

  await t.test('discards invalid draft fields and filters unknown missingFields', async () => {
    const result = await provider.generate({
      messages: [{ role: 'user', text: 'TRIGGER_BAD_DRAFT' }],
      contextHabits: [],
      includeHabitContext: false,
    });
    assert.equal(result.draft, null);
    assert.deepEqual(result.missingFields, ['targetValue']);
  });

  await t.test('maps provider 429 and safety blocks to contractual error codes', async () => {
    await assert.rejects(
      () => provider.generate({ messages: [{ role: 'user', text: 'TRIGGER_429' }], contextHabits: [], includeHabitContext: false }),
      (err) => err.getStatus() === 429 && err.getResponse().code === 'ASSISTANT_RATE_LIMITED',
    );
    await assert.rejects(
      () => provider.generate({ messages: [{ role: 'user', text: 'TRIGGER_SAFETY' }], contextHabits: [], includeHabitContext: false }),
      (err) => err.getStatus() === 422 && err.getResponse().code === 'ASSISTANT_RESPONSE_BLOCKED',
    );
  });
});

test('Assistant HTTP endpoints enforce OIDC, consent, owner isolation, rate limit and no implicit habit writes', async (t) => {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'quantify-assistant-'));
  const password = randomBytes(24).toString('hex');
  const port = await freePort();
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(directory, 'pgdata'),
    user: 'postgres',
    password,
    port,
    persistent: true,
    createPostgresUser: false,
    postgresFlags: ['-h', '127.0.0.1', '-k', directory, '-c', 'io_method=sync'],
    onLog() {},
    onError() {},
  });

  let pool;
  let app;
  let issuerServer;
  t.after(async () => {
    if (app) await app.close();
    if (issuerServer) await new Promise((r) => issuerServer.close(r));
    if (pool) await pool.end();
    await pg.stop();
    await fs.rm(path.resolve(directory), { recursive: true, force: true });
  });

  await pg.initialise();
  await pg.start();
  const databaseUrl = `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
  pool = new Pool({ connectionString: databaseUrl });
  await migrate(pool);

  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'assistant-test', alg: 'RS256', use: 'sig' };
  issuerServer = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise((r) => issuerServer.listen(0, '127.0.0.1', r));
  const issuer = `http://127.0.0.1:${issuerServer.address().port}/realms/synthetic`;

  const signToken = (subject, roles = ['user']) =>
    new SignJWT({ typ: 'Bearer', realm_access: { roles } })
      .setProtectedHeader({ alg: 'RS256', kid: jwk.kid })
      .setIssuer(issuer)
      .setAudience('quantify-api')
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

  const ownerA = randomUUID();
  const ownerB = randomUUID();
  await pool.query(
    `INSERT INTO profiles(id, oidc_issuer, oidc_subject, time_zone)
     VALUES ($1, $3, 'user-a', 'America/Mexico_City'),
            ($2, $3, 'admin-b', 'America/Mexico_City')`,
    [ownerA, ownerB, issuer],
  );
  await pool.query(
    `INSERT INTO habits(owner_id, name, target_value, unit, weekdays, effective_from, time_zone)
     VALUES ($1, 'Hábito privado A', 25, 'min', ARRAY[1,2,3,4,5]::smallint[], '2026-11-01', 'America/Mexico_City'),
            ($2, 'Hábito privado B', 10, 'páginas', ARRAY[6,7]::smallint[], '2026-11-01', 'America/Mexico_City')`,
    [ownerA, ownerB],
  );

  const providerCalls = [];
  const fakeProvider = {
    async generate(input) {
      providerCalls.push(input);
      const text = input.messages[input.messages.length - 1].text;
      if (text.includes('clima en Marte')) {
        return {
          reply: 'Solo puedo ayudarte con tus hábitos y rutinas dentro de Quantify Core.',
          draft: null,
          missingFields: [],
          outOfScope: true,
          model: 'gemini-3.5-flash',
        };
      }
      return {
        reply: 'Aquí tienes un borrador para hidratarte. Confírmalo si deseas guardarlo.',
        draft: {
          name: 'Tomar agua al despertar',
          targetValue: 8,
          unit: 'vasos',
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          rationale: 'Distribuir vasos durante el día facilita sostener el hábito sin fricción.',
        },
        missingFields: [],
        outOfScope: false,
        model: 'gemini-3.5-flash',
      };
    },
  };

  app = await createApi({
    databaseUrl,
    issuer,
    audience: 'quantify-api',
    port: 3000,
    host: '127.0.0.1',
    corsOrigins: ['http://localhost:5173'],
    dashboardEnabled: true,
    writesEnabled: true,
    assistant: {
      apiKey: 'configured',
      model: 'gemini-3.5-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      timeoutMs: 5000,
      maxRequestsPerWindow: 3,
      rateWindowMs: 60000,
    },
    assistantProvider: fakeProvider,
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;

  const tokens = [await signToken('user-a', ['user']), await signToken('admin-b', ['admin'])];
  const spec = JSON.parse(await fs.readFile(path.resolve(__dirname, '../../../packages/contracts/openapi.json'), 'utf8'));
  const ajv = new Ajv({ strict: true });
  addFormats(ajv);
  const defs = JSON.parse(JSON.stringify(spec.components.schemas).replaceAll('#/components/schemas/', '#/$defs/'));
  const schemas = Object.fromEntries(Object.keys(defs).map((name) => [name, ajv.compile({ $defs: defs, $ref: '#/$defs/' + name })]));

  async function request(route, { method = 'GET', body, actor = 0, key, auth, schema } = {}) {
    const response = await fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth === null ? {} : { Authorization: auth ?? `Bearer ${tokens[actor]}` }),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = { status: response.status, body: await response.json(), headers: response.headers };
    const validator = response.status >= 400 ? schemas.Problem : schema ? schemas[schema] : undefined;
    if (validator) {
      assert.equal(validator(result.body), true, JSON.stringify(validator.errors));
    }
    return result;
  }

  await t.test('requires valid OIDC token and blocks provider before consent', async () => {
    assert.equal((await request('/me/assistant-consent', { auth: null })).status, 401);
    const initialConsent = await request('/me/assistant-consent', { schema: 'AssistantConsent' });
    assert.equal(initialConsent.status, 200);
    assert.equal(initialConsent.body.granted, false);
    assert.equal(initialConsent.body.updatedAt, null);

    const blocked = await request('/assistant/messages', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'Recomiéndame un hábito' }], includeHabitContext: true },
    });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.code, 'ASSISTANT_CONSENT_REQUIRED');
    assert.equal(providerCalls.length, 0);
  });

  await t.test('grants consent idempotently and rejects client-supplied API keys', async () => {
    const consentKey = randomUUID();
    const granted = await request('/me/assistant-consent', {
      method: 'POST',
      key: consentKey,
      body: { granted: true },
      schema: 'AssistantConsent',
    });
    assert.equal(granted.status, 200);
    assert.equal(granted.body.granted, true);
    assert.ok(granted.body.updatedAt);

    const replay = await request('/me/assistant-consent', {
      method: 'POST',
      key: consentKey,
      body: { granted: true },
      schema: 'AssistantConsent',
    });
    assert.deepEqual(replay.body, granted.body);

    const conflict = await request('/me/assistant-consent', {
      method: 'POST',
      key: consentKey,
      body: { granted: false },
    });
    assert.equal(conflict.status, 409);

    const clientKeyAttempt = await request('/assistant/messages', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', text: 'Hola' }],
        includeHabitContext: false,
        geminiApiKey: 'leaked-client-key',
      },
    });
    assert.equal(clientKeyAttempt.status, 400);
    assert.equal(clientKeyAttempt.body.code, 'INVALID_JSON_OR_PARAMETER');

    const badTurn = await request('/assistant/messages', {
      method: 'POST',
      body: {
        messages: [{ role: 'assistant', text: 'Turno inválido final' }],
        includeHabitContext: false,
      },
    });
    assert.equal(badTurn.status, 422);
    assert.equal(badTurn.body.code, 'INVALID_CONVERSATION_TURN');
  });

  await t.test('scopes habit context strictly to owner and never persists draft automatically', async () => {
    const beforeHabits = (await pool.query('SELECT count(*)::integer AS n FROM habits WHERE owner_id = $1', [ownerA])).rows[0].n;

    const reply = await request('/assistant/messages', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', text: 'Recomiéndame hidratación diaria' }],
        includeHabitContext: true,
      },
      schema: 'AssistantReply',
    });
    assert.equal(reply.status, 200);
    assert.equal(reply.body.contextUsed, true);
    assert.equal(reply.body.draft.name, 'Tomar agua al despertar');
    assert.equal(providerCalls.length, 1);
    assert.deepEqual(
      providerCalls[0].contextHabits.map((h) => h.name),
      ['Hábito privado A'],
    );

    const afterHabits = (await pool.query('SELECT count(*)::integer AS n FROM habits WHERE owner_id = $1', [ownerA])).rows[0].n;
    assert.equal(afterHabits, beforeHabits);

    // Admin B only sees Admin B's own habits, never User A's.
    await request('/me/assistant-consent', {
      method: 'POST',
      actor: 1,
      key: randomUUID(),
      body: { granted: true },
      schema: 'AssistantConsent',
    });
    const adminReply = await request('/assistant/messages', {
      method: 'POST',
      actor: 1,
      body: {
        messages: [{ role: 'user', text: '¿Cómo es el clima en Marte?' }],
        includeHabitContext: true,
      },
      schema: 'AssistantReply',
    });
    assert.equal(adminReply.status, 200);
    assert.equal(adminReply.body.outOfScope, true);
    assert.equal(adminReply.body.draft, null);
    assert.deepEqual(
      providerCalls[1].contextHabits.map((h) => h.name),
      ['Hábito privado B'],
    );
  });

  await t.test('enforces rate limit with Retry-After and supports immediate consent revocation', async () => {
    // Owner A already used 1 request out of 3 in window; send 2 more to fill bucket, then 4th must 429.
    assert.equal(
      (await request('/assistant/messages', {
        method: 'POST',
        body: { messages: [{ role: 'user', text: 'Consulta 2' }], includeHabitContext: false },
        schema: 'AssistantReply',
      })).status,
      200,
    );
    assert.equal(
      (await request('/assistant/messages', {
        method: 'POST',
        body: { messages: [{ role: 'user', text: 'Consulta 3' }], includeHabitContext: false },
        schema: 'AssistantReply',
      })).status,
      200,
    );
    const limited = await request('/assistant/messages', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'Consulta 4' }], includeHabitContext: false },
    });
    assert.equal(limited.status, 429);
    assert.equal(limited.body.code, 'ASSISTANT_RATE_LIMITED');
    assert.ok(Number(limited.headers.get('retry-after')) >= 1);

    // Revoking consent on Admin B immediately blocks further messages.
    const revoked = await request('/me/assistant-consent', {
      method: 'POST',
      actor: 1,
      key: randomUUID(),
      body: { granted: false },
      schema: 'AssistantConsent',
    });
    assert.equal(revoked.status, 200);
    assert.equal(revoked.body.granted, false);

    const afterRevoke = await request('/assistant/messages', {
      method: 'POST',
      actor: 1,
      body: { messages: [{ role: 'user', text: 'Otra consulta' }], includeHabitContext: false },
    });
    assert.equal(afterRevoke.status, 403);
    assert.equal(afterRevoke.body.code, 'ASSISTANT_CONSENT_REQUIRED');
  });
});
