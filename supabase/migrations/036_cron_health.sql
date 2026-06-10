-- Monitoring des cron jobs : dernière exécution réussie par job
CREATE TABLE IF NOT EXISTS cron_health (
  job_name   text        PRIMARY KEY,
  last_run   timestamptz NOT NULL DEFAULT now(),
  last_status text       NOT NULL DEFAULT 'ok', -- 'ok' | 'error'
  details    jsonb
);

-- Pas de RLS : accès admin seulement (service_role key)
