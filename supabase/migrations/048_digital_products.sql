-- Migration 048 : support des produits digitaux (téléchargeables)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'physical'
    CHECK (product_type IN ('physical', 'digital')),
  ADD COLUMN IF NOT EXISTS digital_file_path  TEXT,
  ADD COLUMN IF NOT EXISTS digital_file_name  TEXT,
  ADD COLUMN IF NOT EXISTS digital_file_size  INTEGER;

CREATE INDEX IF NOT EXISTS products_digital_idx
  ON products(shop_id, product_type)
  WHERE product_type = 'digital';

-- Table des tokens de téléchargement
CREATE TABLE IF NOT EXISTS download_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  token          TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at     TIMESTAMPTZ NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads  INTEGER NOT NULL DEFAULT 5,
  downloaded_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS download_tokens_token_idx ON download_tokens(token);
CREATE INDEX IF NOT EXISTS download_tokens_order_idx ON download_tokens(order_id);

ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;
-- Pas de policy publique — uniquement service_role via l'API route
