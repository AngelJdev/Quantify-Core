const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { randomUUID, randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const { migrate } = require('../scripts/migrate.cjs');
const { makeBatch } = require('../scripts/fixtures.cjs');
const { createSimulation } = require('../dist/main.js');
const assert = require('node:assert/strict');
const Ajv = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function environment(options = {}) {
  if (process.getuid?.() === 0) throw new Error('Ejecutar pruebas como usuario sin privilegios; no se crean usuarios del sistema.');
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'quantify-telemetry-'));
  const port = await freePort(), password = randomBytes(24).toString('hex');
  const pg = new EmbeddedPostgres({ databaseDir: path.join(directory,'pgdata'), user: 'postgres', password, port,
    persistent: true, createPostgresUser: false, postgresFlags: ['-h','127.0.0.1','-k',directory], onLog() {}, onError() {} });
  let pool, issuerServer, app;
  async function close() {
    if (app) await app.close();
    if (issuerServer) await new Promise(resolve => issuerServer.close(resolve));
    if (pool) await pool.end();
    await pg.stop();
    // Solo se elimina el directorio aleatorio que esta ejecución creó.
    await fs.rm(directory, { recursive: true, force: true });
  }
  try {
    await pg.initialise(); await pg.start();
    const databaseUrl = `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
    pool = new Pool({ connectionString: databaseUrl });
    const coreSchema = process.env.TELEMETRY_CORE_SCHEMA_FILE;
    if (coreSchema) await pool.query(await fs.readFile(coreSchema,'utf8'));
    else await pool.query(`CREATE TABLE public.profiles (
      id uuid PRIMARY KEY, oidc_issuer text NOT NULL, oidc_subject text NOT NULL,
      status text NOT NULL CHECK (status IN ('active','suspended')), UNIQUE(oidc_issuer,oidc_subject))`);
    const firstMigration = await migrate(pool), repeatMigration = await migrate(pool);
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = { ...await exportJWK(publicKey), kid: 'synthetic-test-key', alg: 'RS256', use: 'sig' };
    issuerServer = http.createServer((request,response) => {
      if (request.url !== '/realms/synthetic-test/protocol/openid-connect/certs') { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type','application/json'); response.end(JSON.stringify({ keys: [jwk] }));
    });
    await new Promise(resolve => issuerServer.listen(0,'127.0.0.1',resolve));
    const issuer = `http://127.0.0.1:${issuerServer.address().port}/realms/synthetic-test`;
    const audience = 'quantify-api';
    async function token(subject, changes = {}, options = {}) {
      return new SignJWT({ typ: 'Bearer', realm_access: { roles: ['user'] }, ...changes })
        .setProtectedHeader({ alg:'RS256',kid:jwk.kid }).setIssuer(options.issuer ?? issuer).setAudience(options.audience ?? audience)
        .setSubject(subject).setIssuedAt().setExpirationTime(options.expiration ?? '5m').sign(privateKey);
    }
    const owners = [randomUUID(),randomUUID()];
    await pool.query(`INSERT INTO public.profiles(id,oidc_issuer,oidc_subject,status)
      VALUES ($1,$3,'synthetic-a','active'),($2,$3,'synthetic-b','active')`,[...owners,issuer]);
    const tokens = [await token('synthetic-a'),await token('synthetic-b',{ realm_access:{ roles:['admin'] } })];
    const config = { databaseUrl,issuer,audience,...(options.mongo ? {mongo:options.mongo} : {}) };
    app = await createSimulation(config); await app.listen(0,'127.0.0.1');
    let base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1/telemetry/simulation`;
    const ajv = new Ajv({ strict:true });addFormats(ajv);
    const schemas = {};
    for (const name of ['receipt','source-state','summary','error']) {
      const schema = JSON.parse(await fs.readFile(path.resolve(__dirname,`../../../../packages/contracts/telemetry/v1/${name}.schema.json`),'utf8'));
      schemas[name] = ajv.compile(schema);
    }
    const parser=require('@apidevtools/json-schema-ref-parser');
    for(const name of ['projection-result','event-list','audit-list']) {
      schemas[name]=ajv.compile(await parser.dereference(path.resolve(__dirname,`../../../../packages/contracts/events/telemetry/v1/${name}.schema.json`)));
    }
    async function request(route, { method='GET',body,actor=0,authorization } = {}) {
      const response = await fetch(base + route, { method,headers:{ 'Content-Type':'application/json',
        ...(authorization === null ? {} : { Authorization:authorization ?? `Bearer ${tokens[actor]}` }) },body:body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
      const result={ status:response.status,body:await response.json() };
      const name=result.status>=400 ? 'error' : route.includes('/mongodb/project') ? 'projection-result' :
        route.includes('/events') ? 'event-list' : route.includes('/audit') ? 'audit-list' : route.endsWith('/summary') ? 'summary' :
        route==='/batches' || route.includes('/batches/') ? 'receipt' : 'source-state';
      assert.equal(schemas[name](result.body),true,`Respuesta ${name} fuera de contrato: ${JSON.stringify(schemas[name].errors)}`);
      assert.equal(response.headers.get('cache-control'),'no-store');
      if(result.status>=400)assert.ok(response.headers.get('content-type').startsWith('application/problem+json'));
      return result;
    }
    async function fixture(signals = ['heartRate','stepCount']) {
      const sourceId = randomUUID();
      const registered = await request('/sources',{ method:'POST',body:{ sourceId,schemaVersion:'1.0.0',origin:'synthetic-generator' } });
      if (registered.status !== 201) throw new Error('Falló registro sintético');
      const consent = await request(`/sources/${sourceId}/consent`,{method:'PUT',body:{ expectedVersion:0,noticeVersion:'synthetic-notice-v1',grants:signals.map(signal => ({ signal,purpose:'personal-analytics' })) }});
      if (consent.status !== 200) throw new Error('Falló consentimiento sintético');
      const at = new Date(Date.parse(consent.body.consentAt) + 1000).toISOString();
      return { sourceId,consent:consent.body,batch:makeBatch({sourceId,batchId:randomUUID(),at}) };
    }
    async function count(sourceId) {
      const result = await pool.query('SELECT count(*)::integer AS count FROM telemetry_simulation.samples WHERE source_id=$1',[sourceId]);
      return result.rows[0].count;
    }
    async function restart() {
      await app.close();
      app = await createSimulation(config); await app.listen(0,'127.0.0.1');
      base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1/telemetry/simulation`;
    }
    return { pool,request,fixture,count,close,restart,token,owners,firstMigration,repeatMigration,
      databaseVersion:(await pool.query('SHOW server_version')).rows[0].server_version,coreSchema:coreSchema ? 'QUANCORE-21/23 externo' : 'fixture mínimo de perfiles' };
  } catch(error) { await close().catch(() => {}); throw error; }
}
module.exports = { environment };
