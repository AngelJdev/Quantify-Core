import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../', import.meta.url));
const command = process.argv[2];
const files = ['infrastructure/docker/.env.local', 'services/api/.env.local',
  'services/api/.env.migrate.local', 'apps/web/.env.local'];
const secret = () => randomBytes(32).toString('hex');
function run(program, args, cwd = root, env = process.env) {
  // shell:false; never interpolate credentials or output environment values.
  const result = spawnSync(program, args, { cwd, env, stdio: 'inherit', shell: false });
  if (result.error || result.status !== 0) throw new Error('Command failed; check prerequisites');
}
function localEnv(relative) {
  return process.loadEnvFile(resolve(root, relative));
}
try {
  if (command === 'init') {
    if (files.some(f => existsSync(resolve(root, f)))) throw new Error('Local configuration exists; preserve it and configure missing files manually');
    const owner = secret(), runtime = secret(), admin = secret();
    const common = 'KEYCLOAK_ISSUER=http://localhost:8180/realms/quantify\nKEYCLOAK_AUDIENCE=quantify-api\n';
    const contents = [
      `POSTGRES_PASSWORD=${owner}\nCORE_RUNTIME_PASSWORD=${runtime}\nKC_BOOTSTRAP_ADMIN_USERNAME=quantify-bootstrap\nKC_BOOTSTRAP_ADMIN_PASSWORD=${admin}\n`,
      `DATABASE_URL=postgresql://quantify_api:${runtime}@127.0.0.1:55432/quantify_core_dev\n${common}HOST=127.0.0.1\nPORT=3000\nCORS_ALLOWED_ORIGINS=http://localhost:5173\nCORE_REVIEW_WRITES_ENABLED=1\nCORE_AUTO_PROVISION_PROFILES=1\n`,
      `DATABASE_URL=postgresql://quantify_owner:${owner}@127.0.0.1:55432/quantify_core_dev\nCORE_RUNTIME_PASSWORD=${runtime}\n`,
      'VITE_API_BASE_URL=http://localhost:3000/api/v1\nVITE_API_HEALTH_PATH=health/ready\n',
    ];
    files.forEach((f, i) => writeFileSync(resolve(root, f), contents[i], { flag: 'wx', mode: 0o600 }));
    console.log('Private configuration created; values omitted. Writes are disabled by default.');
  } else if (['up', 'stop', 'status', 'config', 'web-docker', 'web-stop', 'web-static', 'docker-up', 'docker-migrate'].includes(command)) {
    localEnv(files[0]);
    const compose = ['compose', '--env-file', resolve(root, files[0]), '-f', resolve(root, 'infrastructure/docker/compose.yaml')];
    if (['web-docker', 'web-static', 'docker-up'].includes(command)) {
      run('docker', [...compose, '--profile', 'web', '--profile', 'web-static', 'stop', command === 'web-docker' ? 'web-static' : 'web']);
    }
    const args = { up: ['up', '-d'], stop: ['--profile', 'web', '--profile', 'web-static', '--profile', 'app', 'stop'], status: ['ps'],
      config: ['--profile', 'web', '--profile', 'web-static', '--profile', 'app', '--profile', 'tools', 'config', '--quiet'],
      'web-docker': ['--profile', 'web', 'up', '-d', '--build', 'web'],
      'web-static': ['--profile', 'web-static', 'up', '-d', '--build', 'web-static'],
      'docker-up': ['--profile', 'web-static', '--profile', 'app', 'up', '-d', '--build', 'postgres', 'keycloak', 'api', 'web-static'],
      'docker-migrate': ['--profile', 'tools', 'run', '--rm', '--build', 'migrate'],
      'web-stop': ['--profile', 'web', '--profile', 'web-static', 'stop', 'web', 'web-static'] }[command];
    run('docker', [...compose, ...args]);
  } else if (command === 'migrate') {
    localEnv(files[2]);
    const url = new URL(process.env.DATABASE_URL);
    if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/quantify_core_dev' || url.username !== 'quantify_owner')
      throw new Error('This helper only migrates the isolated local development database');
    const require = createRequire(resolve(root, 'services/api/package.json'));
    const { Pool } = require('pg');
    const { migrate } = require('./db/migrate.cjs');
    const { provisionRuntime } = require('./db/provision-runtime.cjs');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
    try {
      const applied = await migrate(pool);
      await provisionRuntime(pool, process.env.CORE_RUNTIME_PASSWORD);
      console.log('Migrations and runtime permissions ready:', applied.length, 'new migrations');
    } finally { await pool.end(); }
  } else if (command === 'api') {
    localEnv(files[1]);
    run(process.execPath, ['build/src/main.js'], resolve(root, 'services/api'));
  } else if (command === 'web') {
    run(process.execPath, ['node_modules/vite/bin/vite.js', '--host', 'localhost', '--port', '5173', '--strictPort'], resolve(root, 'apps/web'));
  } else {
    throw new Error('Usage: node scripts/dev-base.mjs init|config|up|migrate|api|web|web-docker|web-static|web-stop|docker-up|docker-migrate|status|stop');
  }
} catch (error) {
  // Do not print nested driver errors, DSNs or command environment.
  console.error(['init','migrate'].includes(command) ? 'Development setup failed; preserve existing configuration and check the local guide.' : error.message);
  process.exitCode = 1;
}
