-- QUANCORE-21 · PostgreSQL 15+ · migración inicial, transaccional
-- Los identificadores de Keycloak se guardan sin contraseñas, tokens ni credenciales.
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oidc_issuer text NOT NULL,
  oidc_subject text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (oidc_issuer, oidc_subject)
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id),
  name varchar(60) NOT NULL CHECK (length(btrim(name)) BETWEEN 3 AND 60),
  description varchar(240),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);
CREATE UNIQUE INDEX categories_owner_name_active_idx
  ON categories(owner_id, lower(name)) WHERE archived_at IS NULL;
CREATE INDEX categories_owner_active_idx ON categories(owner_id, created_at DESC) WHERE archived_at IS NULL;

CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id),
  category_id uuid,
  name varchar(60) NOT NULL CHECK (length(btrim(name)) BETWEEN 3 AND 60),
  target_value numeric(12,3) NOT NULL CHECK (target_value > 0),
  unit varchar(40) NOT NULL CHECK (length(btrim(unit)) > 0),
  weekdays smallint[] NOT NULL CHECK (
    cardinality(weekdays) BETWEEN 1 AND 7
    AND weekdays <@ ARRAY[1,2,3,4,5,6,7]::smallint[]
  ),
  effective_from date NOT NULL,
  time_zone text NOT NULL CHECK (length(btrim(time_zone)) > 0),
  status varchar(12) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','archived')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id),
  CONSTRAINT habits_category_owner_fk FOREIGN KEY (category_id,owner_id)
    REFERENCES categories(id,owner_id)
);
CREATE INDEX habits_owner_status_idx ON habits(owner_id,status,created_at DESC);

CREATE TABLE habit_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  habit_id uuid NOT NULL REFERENCES habits(id),
  version integer NOT NULL CHECK (version > 0),
  snapshot jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id,version)
);

CREATE TABLE audit_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  aggregate_version integer NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (aggregate_type,aggregate_id,aggregate_version)
);
CREATE INDEX audit_outbox_pending_idx ON audit_outbox(occurred_at) WHERE published_at IS NULL;

CREATE FUNCTION audit_habit_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO habit_revisions(habit_id,version,snapshot)
  VALUES (NEW.id,NEW.version,to_jsonb(NEW));
  INSERT INTO audit_outbox(aggregate_type,aggregate_id,event_type,aggregate_version,owner_id,payload)
  VALUES ('habit',NEW.id,CASE WHEN TG_OP='INSERT' THEN 'habit.created' ELSE 'habit.updated' END,
          NEW.version,NEW.owner_id,jsonb_build_object('habitId',NEW.id,'version',NEW.version));
  RETURN NEW;
END;
$$;
CREATE TRIGGER habit_audit_insert AFTER INSERT ON habits FOR EACH ROW EXECUTE FUNCTION audit_habit_change();
CREATE TRIGGER habit_audit_update AFTER UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION audit_habit_change();

COMMENT ON TABLE audit_outbox IS 'Outbox transaccional; publicación por worker pendiente (D-05).';
