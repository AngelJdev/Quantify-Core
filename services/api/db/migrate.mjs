import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatorio');
const dir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock($1)', [210023]);
  await client.query(\`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
  )\`);
  const files = (await readdir(dir)).filter(f => /^\d+_.+\.sql$/.test(f)).sort();
  for (const file of files) {
    const sql = await readFile(join(dir,file),'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const { rows } = await client.query('SELECT checksum FROM schema_migrations WHERE filename=$1',[file]);
    if (rows.length) {
      if (rows[0].checksum !== checksum) throw new Error('Migración modificada: '+file);
      console.log('Sin cambios:',file);
      continue;
    }
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(filename,checksum) VALUES($1,$2)',[file,checksum]);
    console.log('Aplicada:',file);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
