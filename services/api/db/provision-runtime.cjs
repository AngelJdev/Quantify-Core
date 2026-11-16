// Local development only. Migrations run as owner, HTTP runs with DML privileges.
async function provisionRuntime(pool, password) {
  if (!/^[a-f0-9]{64}$/.test(password ?? '')) throw new Error('Invalid generated runtime credential');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('quantify.runtime_password',$1,true)", [password]);
    await client.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='quantify_api') THEN
        CREATE ROLE quantify_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
        EXECUTE format('ALTER ROLE quantify_api PASSWORD %L',current_setting('quantify.runtime_password'));
      END IF;
    END $$`);
    await client.query('GRANT CONNECT ON DATABASE quantify_core_dev TO quantify_api');
    await client.query('GRANT USAGE ON SCHEMA public,dashboard_read TO quantify_api');
    await client.query(`GRANT SELECT,INSERT ON profiles,habits,habit_revisions,
      check_ins,check_in_revisions,api_receipts,audit_outbox TO quantify_api`);
    await client.query('GRANT UPDATE ON habits,check_ins TO quantify_api');
    // FOR UPDATE on the actor requires UPDATE privilege; no history is rewritten.
    await client.query('GRANT UPDATE(status) ON profiles TO quantify_api');
    await client.query('REVOKE UPDATE,DELETE ON habit_revisions,check_in_revisions,api_receipts,audit_outbox FROM quantify_api');
    await client.query('GRANT SELECT ON schema_migrations,dashboard_read.v1_revisions,dashboard_read.v1_check_ins TO quantify_api');
    await client.query('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO quantify_api');
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports = { provisionRuntime };
