-- QUANCORE-35: solo señales sintéticas. No crea ni sustituye maestros QUANCORE-22.
CREATE SCHEMA IF NOT EXISTS telemetry_simulation;
CREATE TABLE telemetry_simulation.sources (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  origin text NOT NULL CHECK (origin = 'synthetic-generator'),
  active boolean NOT NULL DEFAULT true,
  consent_version integer NOT NULL DEFAULT 0 CHECK (consent_version >= 0),
  grants jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(grants) = 'array'),
  consent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (id, owner_id)
);
CREATE TABLE telemetry_simulation.consent_revisions (
  source_id uuid NOT NULL REFERENCES telemetry_simulation.sources(id),
  version integer NOT NULL CHECK (version > 0),
  notice_version text NOT NULL,
  grants jsonb NOT NULL,
  recorded_at timestamptz NOT NULL,
  PRIMARY KEY (source_id, version)
);
CREATE TABLE telemetry_simulation.batches (
  source_id uuid NOT NULL REFERENCES telemetry_simulation.sources(id),
  batch_id uuid NOT NULL,
  consent_version integer NOT NULL,
  request_hash char(64) NOT NULL,
  receipt jsonb NOT NULL,
  PRIMARY KEY (source_id, batch_id),
  FOREIGN KEY (source_id, consent_version)
    REFERENCES telemetry_simulation.consent_revisions(source_id, version)
);
CREATE TABLE telemetry_simulation.samples (
  source_id uuid NOT NULL,
  sample_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  signal text NOT NULL CHECK (signal IN ('heartRate', 'stepCount')),
  observed_at timestamptz NOT NULL,
  unit text NOT NULL,
  value integer NOT NULL,
  sample_hash char(64) NOT NULL,
  out_of_order boolean NOT NULL,
  PRIMARY KEY (source_id, sample_id),
  UNIQUE (source_id, signal, observed_at),
  FOREIGN KEY (source_id, batch_id) REFERENCES telemetry_simulation.batches(source_id, batch_id),
  CHECK ((signal = 'heartRate' AND unit = 'bpm' AND value BETWEEN 1 AND 300)
      OR (signal = 'stepCount' AND unit = 'count' AND value BETWEEN 0 AND 1000000))
);
CREATE INDEX samples_source_time_idx ON telemetry_simulation.samples(source_id, observed_at);
COMMENT ON SCHEMA telemetry_simulation IS
  'QUANCORE-35 synthetic-only staging; no biometría real, no métricas/logs QUANCORE-46 ni progreso de hábitos';
