import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../', import.meta.url));
const command = process.argv[2];
const files = ['infrastructure/docker/.env.local', 'services/api/.env.local',
  'services/api/.env.migrate.local', 'apps/web/.env.local'];
const secret = () => randomBytes(32).toString('hex');
function run(program, args, cwd = root, env = process.env, options = {}) {
  // shell:false; never interpolate credentials or output environment values.
  const result = spawnSync(program, args, {
    cwd,
    env,
    stdio: options.stdio ?? 'inherit',
    input: options.input,
    encoding: options.encoding,
    shell: false,
  });
  if (result.error || result.status !== 0) throw new Error('Command failed; check prerequisites');
  return result;
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
    if (existsSync(resolve(root, files[0]))) localEnv(files[0]);
    run(process.execPath, ['build/src/main.js'], resolve(root, 'services/api'));
  } else if (command === 'web') {
    run(process.execPath, ['node_modules/vite/bin/vite.js', '--host', 'localhost', '--port', '5173', '--strictPort'], resolve(root, 'apps/web'));
  } else if (command === 'db-export') {
    localEnv(files[0]);
    const compose = ['compose', '--env-file', resolve(root, files[0]), '-f', resolve(root, 'infrastructure/docker/compose.yaml')];
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetPath = resolve(root, process.argv[3] ?? `infrastructure/docker/backups/quantify-db-${stamp}.sql`);
    mkdirSync(dirname(targetPath), { recursive: true });
    const dump = run(
      'docker',
      [
        ...compose, 'exec', '-T', 'postgres',
        'pg_dump', '-U', 'quantify_owner', '-d', 'quantify_core_dev',
        '--data-only', '--disable-triggers', '--exclude-table=schema_migrations',
      ],
      root,
      process.env,
      { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' },
    );
    writeFileSync(targetPath, dump.stdout, { encoding: 'utf8' });
    console.log(`Database data exported to: ${targetPath}`);
  } else if (command === 'db-import') {
    const inputArg = process.argv[3];
    if (!inputArg) throw new Error('Usage: node scripts/dev-base.mjs db-import <backup-file.sql>');
    const sourcePath = resolve(root, inputArg);
    if (!existsSync(sourcePath)) throw new Error(`Backup file not found: ${sourcePath}`);
    const sqlData = readFileSync(sourcePath, 'utf8');
    if (!sqlData.trim()) throw new Error('Backup file is empty');
    localEnv(files[0]);
    const compose = ['compose', '--env-file', resolve(root, files[0]), '-f', resolve(root, 'infrastructure/docker/compose.yaml')];
    const resetSql = [
      'DO $$',
      'DECLARE tbls text;',
      'BEGIN',
      "  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')",
      '  INTO tbls',
      '  FROM pg_tables',
      "  WHERE schemaname = 'public' AND tablename <> 'schema_migrations';",
      '  IF tbls IS NOT NULL THEN',
      "    EXECUTE 'TRUNCATE TABLE ' || tbls || ' RESTART IDENTITY CASCADE';",
      '  END IF;',
      'END $$;',
      '',
    ].join('\n');
    run(
      'docker',
      [
        ...compose, 'exec', '-T', 'postgres',
        'psql', '-U', 'quantify_owner', '-d', 'quantify_core_dev',
        '-v', 'ON_ERROR_STOP=1', '--single-transaction',
      ],
      root,
      process.env,
      { stdio: ['pipe', 'inherit', 'inherit'], input: `${resetSql}${sqlData}`, encoding: 'utf8' },
    );
    console.log(`Database data imported from: ${sourcePath}`);
  } else {
    throw new Error('Usage: node scripts/dev-base.mjs init|config|up|migrate|api|web|web-docker|web-static|web-stop|docker-up|docker-migrate|db-export|db-import|status|stop');
  }
} catch (error) {
  // Do not print nested driver errors, DSNs or command environment.
  console.error(['init','migrate'].includes(command) ? 'Development setup failed; preserve existing configuration and check the local guide.' : error.message);
  process.exitCode = 1;
}
