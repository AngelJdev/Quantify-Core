import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { existsSync, realpathSync } from 'node:fs';
const root = fileURLToPath(new URL('../', import.meta.url));
// Resolve npm's JS entrypoint, avoiding a shell even for npm.cmd on Windows.
const located = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which',
  [process.platform === 'win32' ? 'npm.cmd' : 'npm'], { encoding: 'utf8', shell: false });
const executable = located.stdout?.trim().split(/\r?\n/)[0];
const npmCli = executable && (process.platform === 'win32'
  ? resolve(dirname(executable), 'node_modules/npm/bin/npm-cli.js') : realpathSync(executable));
if (!npmCli || !existsSync(npmCli)) throw new Error('npm CLI unavailable; install the documented Node/npm versions');
const checks = [
  ['.', 'node', ['scripts/check-keycloak.mjs']],
  ['.', 'node', ['scripts/check-docs.mjs']],
  ['services/api', 'npm', ['test']],
  ['services/api', 'npm', ['run', 'validate:openapi']],
  ['apps/web', 'npm', ['run', 'typecheck']],
  ['apps/web', 'npm', ['run', 'lint']],
  ['apps/web', 'npm', ['test']],
  ['apps/web', 'npm', ['run', 'build']],
];
for (const [directory, program, args] of checks) {
  const npm = program === 'npm';
  const result = spawnSync(process.execPath, npm ? [npmCli, ...args] : args,
    { cwd: resolve(root, directory), stdio: 'inherit', shell: false });
  if (result.error || result.status !== 0) {
    console.error('Base verification failed:', directory, args.join(' '));
    process.exit(result.status || 1);
  }
}
console.log('Base verification passed. Real Keycloak/Chrome: node scripts/verify-oidc-base.mjs');
