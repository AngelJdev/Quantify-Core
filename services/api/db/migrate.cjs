const { readFile, readdir } = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { join } = require('node:path');
const { Pool } = require('pg');
async function migrate(pool, through) {
  const client = await pool.connect();
  const applied = [];
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [210023]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    const files = (await readdir(join(__dirname, 'migrations'))).filter(f => /^\d+_.+\.sql$/.test(f)).sort();
    for (const filename of files) {
      if (through && filename > through) continue;
      const sql = (await readFile(join(__dirname, 'migrations', filename), 'utf8')).replaceAll('\r\n','\n');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const prior = await client.query('SELECT checksum FROM schema_migrations WHERE filename=$1', [filename]);
      if (prior.rowCount) {
        const windowsChecksum = createHash('sha256').update(sql.replaceAll('\n','\r\n')).digest('hex');
        if (![checksum,windowsChecksum].includes(prior.rows[0].checksum)) throw new Error('Migration checksum mismatch: ' + filename);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename,checksum) VALUES($1,$2)', [filename,checksum]);
      applied.push(filename);
    }
    await client.query('COMMIT');
    return applied;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports = { migrate };
if (require.main === module) {
  (async () => {
    if (!process.env.DATABASE_URL) throw new Error('Database configuration required');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
    try { console.log('Applied migrations:', await migrate(pool)); } finally { await pool.end(); }
  })().catch(() => { console.error('Migration failed; inspect schema and checksums without altering history.'); process.exitCode = 1; });
}
