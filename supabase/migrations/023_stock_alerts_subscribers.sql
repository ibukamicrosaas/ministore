-- MP-02 : Abonnés aux alertes de remise en stock
CREATE TABLE IF NOT EXISTS stock_alerts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id     UUID        NOT NULL REFERENCES shops(id)    ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  notified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts (product_id) WHERE notified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_alerts_shop    ON stock_alerts (shop_id);

-- Empêcher les doublons (même téléphone, même produit, pas encore notifié)
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_alerts_phone_product
  ON stock_alerts (product_id, phone)
  WHERE notified_at IS NULL;

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- N'importe qui peut s'inscrire (PWA publique)
CREATE POLICY "stock_alerts_insert_public"
  ON stock_alerts FOR INSERT
  WITH CHECK (true);

-- Seul le propriétaire de la boutique peut lire ses alertes
CREATE POLICY "stock_alerts_select_owner"
  ON stock_alerts FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );
