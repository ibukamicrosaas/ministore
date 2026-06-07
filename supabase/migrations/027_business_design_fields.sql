-- Plan Business : champs de design avancés
-- Support pour cover image, catégorie métier, badges, et liens sociaux

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS business_category TEXT,
  ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Indexes pour recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_shops_business_category
  ON shops (business_category)
  WHERE business_category IS NOT NULL;

-- Indexes pour plan Business
CREATE INDEX IF NOT EXISTS idx_shops_business_design
  ON shops (plan)
  WHERE plan = 'business';

COMMENT ON COLUMN shops.cover_image_url IS 'Plan Business — image de couverture (bannière) du shop';
COMMENT ON COLUMN shops.business_category IS 'Plan Business — domaine d''activité/catégorie (ex: "Électroménager", "Mode")';
COMMENT ON COLUMN shops.badges IS 'Plan Business — array de badges/certifications (ex: ["Livraison gratuite", "Paiement sécurisé"])';
COMMENT ON COLUMN shops.social_links IS 'Plan Business — JSON avec liens sociaux {instagram: url, tiktok: url, facebook: url, whatsapp: url, website: url}';
