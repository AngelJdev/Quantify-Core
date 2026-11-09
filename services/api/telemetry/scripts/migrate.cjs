const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { Pool } = require('pg');
async function migrate(pool) {
  const files = ['001_telemetry_simulation.sql','002_mongo_outbox.sql'];
  const migrations = files.map((name,index) => {
    const sql=fs.readFileSync(path.resolve(__dirname,'../db',name),'utf8');
    return {version:index+1,sql,sha256:createHash('sha256').update(sql).digest('hex')};
  });
  const hash=createHash('sha256').update(migrations.map(m=>m.sha256).join(':')).digest('hex');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '3s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('quantify-telemetry-simulation-migrations',0))");
    const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles'");
    if (!['id','oidc_issuer','oidc_subject','status'].every(name => columns.rows.some(row => row.column_name === name))) {
      throw new Error('Requiere public.profiles de QUANCORE-22 con identidad OIDC; no se crean perfiles automáticamente.');
    }
    await client.query(`CREATE SCHEMA IF NOT EXISTS telemetry_simulation;
      CREATE TABLE IF NOT EXISTS telemetry_simulation.schema_migrations (
        version integer PRIMARY KEY, sha256 char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    let applied=false;
    for(const migration of migrations) {
      const prior=await client.query('SELECT sha256 FROM telemetry_simulation.schema_migrations WHERE version=$1',[migration.version]);
      if(prior.rowCount && prior.rows[0].sha256!==migration.sha256) throw new Error('Migration checksum conflict');
      if(!prior.rowCount) {
        await client.query(migration.sql);
        await client.query('INSERT INTO telemetry_simulation.schema_migrations(version,sha256) VALUES ($1,$2)',[migration.version,migration.sha256]);
        applied=true;
      }
    }
    await client.query('COMMIT');
    return { version: migrations.length, sha256: hash, applied };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports = { migrate };
if (require.main === module) {
  (async () => {
    if (process.env.TELEMETRY_SIMULATION_ENABLED !== '1' || !process.env.DATABASE_URL) throw new Error('Configuración incompleta.');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
    try { console.info(await migrate(pool)); }
    finally { await pool.end(); }
  })().catch(() => { console.error('Migración no aplicada. Revisa configuración, permisos y prerrequisito QUANCORE-22.'); process.exitCode = 1; });
}
