// Isolated, disposable Docker test. Does not mount private configuration or
// publish ports. Deletes only the container/network bearing this run's label.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const runId = randomUUID();
const name = `quantify-cold-${runId}`;
const label = `quantify.cold-test=${runId}`;
const ownerPassword = randomBytes(32).toString('hex');
const runtimePassword = randomBytes(32).toString('hex');
let containerCreated = false, networkCreated = false;
let phase = 'base and monitoring Compose configuration';
function docker(args, env = {}) {
  const result = spawnSync('docker', args, {
    cwd: root, encoding: 'utf8', timeout: 120000,
    env: { ...process.env, ...env }, maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0, 'Docker test command failed; sensitive output omitted');
  return result.stdout.trim();
}
try {
  const composeEnv = { POSTGRES_PASSWORD: ownerPassword, CORE_RUNTIME_PASSWORD: runtimePassword,
    KC_BOOTSTRAP_ADMIN_USERNAME: 'synthetic-admin', KC_BOOTSTRAP_ADMIN_PASSWORD: randomBytes(32).toString('hex'),
    GRAFANA_ADMIN_PASSWORD: randomBytes(32).toString('hex') };
  const composeArgs = ['compose', '-f', 'infrastructure/docker/compose.yaml'];
  const base = JSON.parse(docker([...composeArgs, '--profile', '*', 'config', '--format', 'json'], composeEnv));
  assert.equal(base.services.api.environment.LOKI_PUSH_URL, '');
  const monitoring = JSON.parse(docker([...composeArgs, '-f', 'infrastructure/observability/compose.yaml',
    '--profile', '*', 'config', '--format', 'json'], composeEnv));
  assert.equal(monitoring.services.api.environment.LOKI_PUSH_URL, 'http://loki:3100/loki/api/v1/push');
  console.log('PASS: base API has no Loki dependency; monitoring override enables the collector.');
  phase = 'private configuration initialization';
  const initCheck = `
    const fs = require('node:fs'), assert = require('node:assert/strict');
    const { spawnSync } = require('node:child_process');
    const files = ['infrastructure/docker/.env.local','services/api/.env.local',
      'services/api/.env.migrate.local','apps/web/.env.local'];
    for (const file of files) fs.mkdirSync(require('node:path').dirname(file), {recursive:true});
    const init = () => spawnSync(process.execPath,['scripts/dev-base.mjs','init'],{encoding:'utf8'});
    assert.equal(init().status,0);
    const before = files.map(file=>fs.readFileSync(file,'utf8'));
    assert.equal(init().status,1);
    assert.deepEqual(files.map(file=>fs.readFileSync(file,'utf8')),before);
  `;
  docker(['run', '--rm', '--mount', `type=bind,source=${fileURLToPath(new URL('./dev-base.mjs', import.meta.url))},target=/workspace/scripts/dev-base.mjs,readonly`,
    '--workdir', '/workspace', 'node:24.14.1-bookworm-slim', 'node', '-e', initCheck]);
  console.log('PASS: Docker-only init creates configuration and refuses to overwrite it.');
  phase = 'isolated empty PostgreSQL';
  docker(['network', 'create', '--label', label, name]); networkCreated = true;
  docker(['run', '-d', '--name', name, '--label', label, '--network', name, '--network-alias', 'postgres',
    '-e', 'POSTGRES_PASSWORD', '-e', 'POSTGRES_USER=quantify_owner', '-e', 'POSTGRES_DB=quantify_core_dev', 'postgres:18.6'],
  { POSTGRES_PASSWORD: ownerPassword }); containerCreated = true;
  const started = Date.now();
  while (true) {
    const ready = spawnSync('docker', ['exec', name, 'pg_isready', '-U', 'quantify_owner', '-d', 'quantify_core_dev'], { encoding: 'utf8', timeout: 10000 });
    if (ready.status === 0) break;
    assert.ok(Date.now() - started < 60000, 'Temporary PostgreSQL did not become ready');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  phase = 'fresh migrations and idempotency';
  const migrateArgs = ['run', '--rm', '--network', name, '-e', 'DATABASE_URL', '-e', 'CORE_RUNTIME_PASSWORD',
    'quantify-core-dev-migrate', 'node', 'db/docker-migrate.cjs'];
  const migrationEnv = { DATABASE_URL: `postgresql://quantify_owner:${ownerPassword}@postgres:5432/quantify_core_dev`, CORE_RUNTIME_PASSWORD: runtimePassword };
  assert.match(docker(migrateArgs, migrationEnv), /[1-9]\d* new migrations/);
  assert.match(docker(migrateArgs, migrationEnv), /0 new migrations/);
  phase = 'runtime SQL permissions';
  const sqlCheck = `
    const {Pool}=require('pg'), assert=require('node:assert/strict');
    (async()=>{const pool=new Pool({connectionString:process.env.DATABASE_URL});
    try {const {rows:[row]}=await pool.query(\`SELECT
      has_table_privilege(current_user,'profiles','SELECT') AS profile_read,
      has_table_privilege(current_user,'schema_migrations','INSERT') AS ledger_write,
      has_table_privilege(current_user,'habit_revisions','UPDATE') AS history_write,
      (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser\`);
      assert.deepEqual(row,{profile_read:true,ledger_write:false,history_write:false,superuser:false});
    } finally {await pool.end();}})().catch(()=>process.exitCode=1);
  `;
  docker(['run', '--rm', '--network', name, '-e', 'DATABASE_URL', 'quantify-core-dev-migrate', 'node', '-e', sqlCheck],
    { DATABASE_URL: `postgresql://quantify_api:${runtimePassword}@postgres:5432/quantify_core_dev` });
  console.log('PASS: empty PostgreSQL migrates, replay applies zero migrations, runtime has limited privileges.');
} catch (error) {
  console.error('FAIL:', phase, '(sensitive details omitted); category:', error.name);
  process.exitCode = 1;
} finally {
  if (containerCreated) {
    try {
      const inspected = JSON.parse(docker(['inspect', name]))[0];
      assert.equal(inspected.Config.Labels['quantify.cold-test'], runId);
      docker(['rm', '-f', '-v', name]);
    } catch { console.error('Temporary container cleanup failed:', name); process.exitCode = 1; }
  }
  if (networkCreated) {
    try {
      const inspected = JSON.parse(docker(['network', 'inspect', name]))[0];
      assert.equal(inspected.Labels['quantify.cold-test'], runId);
      docker(['network', 'rm', name]);
    } catch { console.error('Temporary network cleanup failed:', name); process.exitCode = 1; }
  }
}
