-- Products: slug SEO éditable + champs méta
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Unicité par boutique (slug nullable — les anciens produits n'ont pas encore de slug)
CREATE UNIQUE INDEX IF NOT EXISTS products_shop_id_slug_unique
  ON products(shop_id, slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN products.slug             IS 'Slug SEO — remplace l''UUID dans les URLs publiques du produit';
COMMENT ON COLUMN products.meta_title       IS 'Meta title personnalisé (SEO) — affiché dans Google/Meta Ads';
COMMENT ON COLUMN products.meta_description IS 'Meta description personnalisée (SEO)';
