import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const action = process.argv[2];
const local = resolve(root, 'infrastructure/observability/.env.local');
try {
  if (action === 'init') {
    if (existsSync(local)) throw new Error('Local monitoring configuration exists; preserved');
    writeFileSync(local, `GRAFANA_ADMIN_PASSWORD=${randomBytes(32).toString('hex')}\n`, { flag: 'wx', mode: 0o600 });
    console.log('Private Grafana configuration created; values omitted.');
  } else {
    const commands = { up: ['up','-d','--build'], stop: ['stop','api','prometheus','loki','grafana','alertmanager','alert-receiver'],
      status: ['ps'], config: ['config','--quiet'] };
    if (!Object.hasOwn(commands, action)) throw new Error('Usage: observability.mjs init|up|stop|status|config');
    process.loadEnvFile(resolve(root, 'infrastructure/docker/.env.local'));
    process.loadEnvFile(local);
    const revision = spawnSync('git',['rev-parse','--short','HEAD'],{ cwd: root, encoding:'utf8' });
    if (revision.status !== 0) throw new Error('Revision unavailable');
    const result = spawnSync('docker',['compose','--profile','app','-f','infrastructure/docker/compose.yaml',
      '-f','infrastructure/observability/compose.yaml',...commands[action]],
    { cwd: root, stdio:'inherit', shell:false, env:{...process.env,APP_REVISION:revision.stdout.trim()} });
    if (result.error || result.status !== 0) throw new Error('Monitoring command failed; check local prerequisites');
    if (action === 'up') {
      // Bind-mounted configuration is only loaded on process startup.
      const reload=spawnSync('docker',['compose','--profile','app','-f','infrastructure/docker/compose.yaml',
        '-f','infrastructure/observability/compose.yaml','restart','prometheus','alertmanager','loki','grafana'],
      {cwd:root,stdio:'inherit',shell:false,env:{...process.env,APP_REVISION:revision.stdout.trim()}});
      if(reload.status!==0)throw new Error('Monitoring configuration restart failed');
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
