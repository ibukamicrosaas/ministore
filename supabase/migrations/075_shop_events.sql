-- Événements de mesure du modèle free_orders (spec §11). Se posent au niveau
-- des transitions (trigger SQL + code serveur), pas de l'interface — le
-- tableau de bord n'existe pas encore, mais les données doivent s'accumuler
-- dès maintenant pour pouvoir mesurer le taux d'activation par motif de sortie.

CREATE TABLE shop_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  event_name TEXT        NOT NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_events_shop_id    ON shop_events (shop_id);
CREATE INDEX idx_shop_events_event_name ON shop_events (event_name);

ALTER TABLE shop_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_events_no_public_access" ON shop_events FOR ALL USING (false);
-- Aucun accès direct : écriture via le trigger (SECURITY DEFINER) et l'admin client,
-- lecture réservée à l'analyse interne (service_role / futur dashboard interne).
