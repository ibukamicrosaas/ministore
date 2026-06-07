-- Intégration Meta Pixel (Facebook Pixel) pour tracking conversions
-- Migration 029

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;

-- Index pour rechercher par pixel ID
CREATE INDEX IF NOT EXISTS idx_shops_meta_pixel_id
  ON shops (meta_pixel_id)
  WHERE meta_pixel_id IS NOT NULL;

COMMENT ON COLUMN shops.meta_pixel_id IS 'Meta Pixel ID (Facebook Pixel) pour tracking conversions et optimisation campagnes publicitaires';
