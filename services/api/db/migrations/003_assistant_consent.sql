CREATE TABLE assistant_consents (
  owner_id uuid PRIMARY KEY REFERENCES profiles(id),
  granted boolean NOT NULL,
  policy_version text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
COMMENT ON TABLE assistant_consents IS 'Explicit revocable consent per profile for RF-07 conversational assistant; no chat text is stored.';
