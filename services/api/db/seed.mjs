// Solo datos sintéticos locales; ejecución explícita, nunca al arrancar la API.
import pg from 'pg';
if (process.env.SEED_DEMO !== '1' || process.env.NODE_ENV === 'production')
  throw new Error('Semillas bloqueadas: requiere SEED_DEMO=1 y entorno no productivo');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatorio');
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
const c = await pool.connect();
try {
  await c.query('BEGIN');
  await c.query(\`INSERT INTO profiles(id,oidc_issuer,oidc_subject)
    VALUES('11111111-1111-4111-8111-111111111111','urn:quantify:synthetic','demo-user')
    ON CONFLICT(id) DO NOTHING\`);
  await c.query(\`INSERT INTO categories(id,owner_id,name,description)
    VALUES('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',
      'Salud y descanso','Ejemplo sintético')
    ON CONFLICT(id) DO NOTHING\`);
  await c.query(\`INSERT INTO habits(id,owner_id,category_id,name,target_value,unit,weekdays,effective_from,time_zone)
    VALUES('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222','Caminar 20 minutos',20,'min',
      ARRAY[1,2,3,4,5]::smallint[],DATE '2026-10-26','America/Mexico_City')
    ON CONFLICT(id) DO NOTHING\`);
  await c.query('COMMIT');
  console.log('Semillas sintéticas listas (idempotentes).');
} catch(e) { await c.query('ROLLBACK'); console.error(e); process.exitCode=1; }
finally { c.release(); await pool.end(); }
