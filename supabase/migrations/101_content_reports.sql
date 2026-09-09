-- Signalement côté acheteur (chantier modération, REPRISE.md) — lot 1.
-- Écriture faite côté serveur avec le client admin (même pattern que
-- product_reviews/api/reviews), pas de policy RLS d'insertion publique.

CREATE TABLE IF NOT EXISTS content_reports (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           UUID        NOT NULL REFERENCES shops(id)    ON DELETE CASCADE,
  product_id        UUID        REFERENCES products(id)          ON DELETE SET NULL,
  reason            TEXT        NOT NULL CHECK (reason IN (
                        'sexual_no_consent',
                        'impersonation',
                        'scam',
                        'other'
                      )),
  detail            TEXT,
  reporter_contact  TEXT,
  status            TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_reports_shop_id_idx    ON content_reports (shop_id);
CREATE INDEX IF NOT EXISTS content_reports_created_at_idx ON content_reports (created_at DESC);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
-- Aucune policy : ni lecture ni écriture publique. Le flux applicatif passe
-- entièrement par le client admin (service_role, contourne RLS) côté API et
-- côté page /admin/reports — même principe que product_reviews pour l'écriture,
-- mais sans le "public_read_reviews" de ce dernier : un signalement n'a pas à
-- être lisible publiquement, contrairement à un avis client.
