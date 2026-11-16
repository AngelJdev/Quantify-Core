-- QUANCORE-43 extends QUANCORE-21/23 without replacing its masters/snapshots.
ALTER TABLE profiles ADD COLUMN time_zone text NOT NULL DEFAULT 'UTC';
-- Legacy snapshots with duplicate dates must be reviewed, never silently collapsed.
CREATE UNIQUE INDEX habit_revision_effective_idx ON habit_revisions(habit_id, (snapshot->>'effective_from'));

CREATE TABLE check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  business_date date NOT NULL,
  habit_revision integer NOT NULL,
  client_event_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  time_zone text NOT NULL,
  unit text NOT NULL,
  value numeric(12,3) NOT NULL CHECK(value >= 0),
  version integer NOT NULL CHECK(version > 0),
  progress_status text NOT NULL CHECK(progress_status IN ('zero','partial','completed')),
  correction_reason text,
  UNIQUE(habit_id,business_date),
  FOREIGN KEY(habit_id,owner_id) REFERENCES habits(id,owner_id),
  FOREIGN KEY(habit_id,habit_revision) REFERENCES habit_revisions(habit_id,version)
);
CREATE INDEX check_ins_owner_date_idx ON check_ins(owner_id,habit_id,business_date);
CREATE TABLE check_in_revisions (
  check_in_id uuid NOT NULL REFERENCES check_ins(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(check_in_id,version)
);
CREATE FUNCTION audit_check_in_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO check_in_revisions(check_in_id,version,snapshot) VALUES(NEW.id,NEW.version,to_jsonb(NEW));
  INSERT INTO audit_outbox(aggregate_type,aggregate_id,event_type,aggregate_version,owner_id,payload)
    VALUES('check-in',NEW.id,CASE WHEN TG_OP='INSERT' THEN 'check-in.created' ELSE 'check-in.corrected' END,
      NEW.version,NEW.owner_id,jsonb_build_object('habitId',NEW.habit_id,'businessDate',NEW.business_date,'version',NEW.version));
  RETURN NEW;
END;
$$;
CREATE TRIGGER check_in_audit_insert AFTER INSERT ON check_ins FOR EACH ROW EXECUTE FUNCTION audit_check_in_change();
CREATE TRIGGER check_in_audit_update AFTER UPDATE ON check_ins FOR EACH ROW EXECUTE FUNCTION audit_check_in_change();

CREATE TABLE api_receipts (
  owner_id uuid NOT NULL REFERENCES profiles(id),
  operation text NOT NULL,
  idempotency_key uuid NOT NULL,
  client_event_id uuid,
  fingerprint text NOT NULL,
  response jsonb NOT NULL,
  http_status integer NOT NULL CHECK(http_status IN (200,201)),
  etag text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(owner_id,operation,idempotency_key)
);
CREATE UNIQUE INDEX receipt_client_event_idx ON api_receipts(owner_id,client_event_id) WHERE client_event_id IS NOT NULL;
COMMENT ON TABLE api_receipts IS 'Durable dedupe; no automatic purge until D-04 retention review.';

CREATE SCHEMA dashboard_read;
CREATE VIEW dashboard_read.v1_revisions AS
  SELECT h.id AS habit_id,h.owner_id,r.version AS revision,
    (r.snapshot->>'effective_from')::date AS effective_from,
    r.snapshot->>'time_zone' AS time_zone,
    ARRAY(SELECT jsonb_array_elements_text(r.snapshot->'weekdays')::smallint) AS weekdays,
    (r.snapshot->>'target_value')::numeric(12,3) AS target_value,
    r.snapshot->>'unit' AS unit,r.snapshot->>'status' AS status
  FROM habits h JOIN habit_revisions r ON r.habit_id=h.id;
CREATE VIEW dashboard_read.v1_check_ins AS
  SELECT habit_id,owner_id,business_date,habit_revision,version,time_zone,unit,value,recorded_at FROM check_ins;
REVOKE ALL ON SCHEMA dashboard_read FROM PUBLIC;
