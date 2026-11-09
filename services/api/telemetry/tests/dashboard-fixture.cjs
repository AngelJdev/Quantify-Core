const {randomUUID}=require('node:crypto');
const portViews=`CREATE OR REPLACE VIEW dashboard_read.v1_revisions AS SELECT * FROM dashboard_fixture.revisions;
  CREATE OR REPLACE VIEW dashboard_read.v1_check_ins AS SELECT * FROM dashboard_fixture.check_ins`;
async function installDashboard(pool) {
  await pool.query(`CREATE SCHEMA dashboard_fixture;CREATE SCHEMA dashboard_read;
    CREATE TABLE dashboard_fixture.revisions (
      habit_id uuid NOT NULL,owner_id uuid NOT NULL REFERENCES public.profiles(id),revision integer NOT NULL,
      effective_from date NOT NULL,time_zone text NOT NULL,weekdays smallint[] NOT NULL,
      target_value numeric(12,3) NOT NULL,unit text NOT NULL,status text NOT NULL,PRIMARY KEY(habit_id,revision));
    CREATE TABLE dashboard_fixture.check_ins (
      habit_id uuid NOT NULL,owner_id uuid NOT NULL REFERENCES public.profiles(id),business_date date NOT NULL,
      habit_revision integer NOT NULL,version integer NOT NULL,time_zone text NOT NULL,unit text NOT NULL,
      value numeric(12,3) NOT NULL,recorded_at timestamptz NOT NULL DEFAULT date_trunc('milliseconds',clock_timestamp()),
      PRIMARY KEY(habit_id,business_date));${portViews}`);
}
async function seedDashboard(e,actor=0) {
  const owner=e.owners[actor],h1=randomUUID(),h2=randomUUID();
  const today=(await e.pool.query("SELECT (clock_timestamp() AT TIME ZONE 'UTC')::date::text AS today")).rows[0].today;
  const day=n=>new Date(Date.parse(today+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
  await e.pool.query(`INSERT INTO dashboard_fixture.revisions(habit_id,owner_id,revision,effective_from,time_zone,weekdays,target_value,unit,status)
    VALUES ($1,$3,1,$4,'UTC',ARRAY[1,2,3,4,5,6,7],10,'min','active'),
      ($1,$3,2,$5,'UTC',ARRAY[1,2,3,4,5,6,7],20,'min','active'),
      ($2,$3,1,$6,'UTC',ARRAY[1,2,3,4,5,6,7],1,'repeticiones','active')`,[h1,h2,owner,day(-4),day(-1),day(-3)]);
  await e.pool.query(`INSERT INTO dashboard_fixture.check_ins(habit_id,owner_id,business_date,habit_revision,version,time_zone,unit,value)
    VALUES ($1,$3,$4,1,1,'UTC','min',10),($1,$3,$5,1,1,'UTC','min',0),
      ($1,$3,$6,2,1,'UTC','min',5),($2,$3,$4,1,1,'UTC','repeticiones',1)`,[h1,h2,owner,day(-3),day(-2),day(-1)]);
  return {owner,h1,h2,today,day,from:day(-3),to:day(-1),qs:`from=${day(-3)}&to=${day(-1)}`};
}
module.exports={installDashboard,seedDashboard,portViews};
