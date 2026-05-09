-- Table de suivi des tentatives de connexion pour le rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier   TEXT NOT NULL,        -- email interne (phone@beautydesk.app)
  attempt_type TEXT NOT NULL,        -- 'login'
  success      BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_attempts_identifier_idx
  ON login_attempts (identifier, attempted_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
-- Pas de policy utilisateur : accès uniquement via service_role (client admin)

-- Nettoyage automatique des tentatives de plus de 24h (optionnel, peut être fait via cron)
-- DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
