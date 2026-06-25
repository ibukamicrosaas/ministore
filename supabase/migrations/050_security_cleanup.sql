-- 050_security_cleanup.sql
-- Fonction de nettoyage des anciennes tentatives de connexion.
-- Appelée depuis /api/cron/cleanup (créé dans cette migration).

CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS integer AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
