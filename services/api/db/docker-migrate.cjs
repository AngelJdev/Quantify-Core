const { Pool } = require('pg');
const { migrate } = require('./migrate.cjs');
const { provisionRuntime } = require('./provision-runtime.cjs');
(async () => {
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname !== 'postgres' || url.port !== '5432' ||
      url.pathname !== '/quantify_core_dev' || url.username !== 'quantify_owner') {
    throw new Error('Dedicated Compose database required');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const applied = await migrate(pool);
    await provisionRuntime(pool, process.env.CORE_RUNTIME_PASSWORD);
    console.log('Migrations and runtime permissions ready:', applied.length, 'new migrations');
  } finally { await pool.end(); }
})().catch(() => {
  console.error('Compose migration failed; preserve volumes and check configuration/schema.');
  process.exitCode = 1;
});
