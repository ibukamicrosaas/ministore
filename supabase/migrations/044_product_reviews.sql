-- Avis clients vérifiés — seuls les acheteurs (client_token valide) peuvent soumettre
CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id     UUID        NOT NULL REFERENCES shops(id)    ON DELETE CASCADE,
  order_id    UUID        REFERENCES orders(id)            ON DELETE SET NULL,
  client_name TEXT        NOT NULL,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON product_reviews (product_id);
CREATE INDEX IF NOT EXISTS product_reviews_shop_id_idx    ON product_reviews (shop_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique (page produit)
CREATE POLICY "public_read_reviews"
  ON product_reviews FOR SELECT
  USING (true);

-- Suppression par le propriétaire de la boutique (depuis le dashboard)
CREATE POLICY "owner_delete_reviews"
  ON product_reviews FOR DELETE
  USING (shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid()));
