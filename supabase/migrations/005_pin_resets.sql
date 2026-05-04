-- ============================================================
-- MINISTORE — Réinitialisation PIN
-- Migration 005
-- ============================================================

CREATE TABLE IF NOT EXISTS pin_resets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_email TEXT        NOT NULL,
  token       TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pin_resets_phone_email_idx ON pin_resets(phone_email);

ALTER TABLE pin_resets ENABLE ROW LEVEL SECURITY;
-- Toutes les opérations passent par le service role uniquement

CREATE OR REPLACE FUNCTION cleanup_pin_resets()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM pin_resets WHERE expires_at < now() - INTERVAL '1 day';
$$;
