-- QUANCORE-22: auditoría transaccional y outbox de referencias, nunca biometría en logs.
CREATE TABLE telemetry_simulation.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  source_id uuid NOT NULL REFERENCES telemetry_simulation.sources(id),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK(action IN ('source.registered','consent.updated','source.revoked','batch.accepted')),
  consent_version integer NOT NULL CHECK(consent_version >= 0),
  occurred_at timestamptz NOT NULL DEFAULT date_trunc('milliseconds',clock_timestamp())
);
CREATE INDEX audit_events_owner_source_idx ON telemetry_simulation.audit_events(owner_id,source_id,occurred_at);
CREATE TABLE telemetry_simulation.mongo_outbox (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES telemetry_simulation.audit_events(id),
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  source_id uuid NOT NULL REFERENCES telemetry_simulation.sources(id),
  batch_id uuid,
  kind text NOT NULL CHECK(kind IN ('telemetry.batch.accepted','telemetry.audit.recorded')),
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','delivered','discarded')),
  created_at timestamptz NOT NULL DEFAULT date_trunc('milliseconds',clock_timestamp()),
  delivered_at timestamptz,
  UNIQUE(audit_id,kind)
);
CREATE INDEX mongo_outbox_pending_idx ON telemetry_simulation.mongo_outbox(owner_id,source_id,created_at) WHERE state='pending';
CREATE FUNCTION telemetry_simulation.audit_source() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE action_name text; audit_id uuid;
BEGIN
  IF TG_OP='INSERT' THEN action_name := 'source.registered';
  ELSIF OLD.active AND NOT NEW.active THEN action_name := 'source.revoked';
  ELSIF OLD.consent_version <> NEW.consent_version THEN action_name := 'consent.updated';
  ELSE RETURN NEW;
  END IF;
  INSERT INTO telemetry_simulation.audit_events(owner_id,source_id,entity_id,action,consent_version)
    VALUES(NEW.owner_id,NEW.id,NEW.id,action_name,NEW.consent_version) RETURNING id INTO audit_id;
  INSERT INTO telemetry_simulation.mongo_outbox(audit_id,owner_id,source_id,kind)
    VALUES(audit_id,NEW.owner_id,NEW.id,'telemetry.audit.recorded');
  RETURN NEW;
END $$;
CREATE TRIGGER source_audit AFTER INSERT OR UPDATE ON telemetry_simulation.sources
  FOR EACH ROW EXECUTE FUNCTION telemetry_simulation.audit_source();
CREATE FUNCTION telemetry_simulation.audit_batch() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid; audit_id uuid;
BEGIN
  SELECT owner_id INTO actor FROM telemetry_simulation.sources WHERE id=NEW.source_id;
  INSERT INTO telemetry_simulation.audit_events(owner_id,source_id,entity_id,action,consent_version,occurred_at)
    VALUES(actor,NEW.source_id,NEW.batch_id,'batch.accepted',NEW.consent_version,(NEW.receipt->>'receivedAt')::timestamptz)
    RETURNING id INTO audit_id;
  INSERT INTO telemetry_simulation.mongo_outbox(audit_id,owner_id,source_id,batch_id,kind)
    VALUES(audit_id,actor,NEW.source_id,NEW.batch_id,'telemetry.batch.accepted'),
          (audit_id,actor,NEW.source_id,NEW.batch_id,'telemetry.audit.recorded');
  RETURN NEW;
END $$;
CREATE TRIGGER batch_audit AFTER INSERT ON telemetry_simulation.batches
  FOR EACH ROW EXECUTE FUNCTION telemetry_simulation.audit_batch();
CREATE FUNCTION telemetry_simulation.keep_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit is append-only'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON telemetry_simulation.audit_events
  FOR EACH ROW EXECUTE FUNCTION telemetry_simulation.keep_audit();
