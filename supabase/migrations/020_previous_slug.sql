-- Permet de rediriger les anciens slugs après un changement d'URL boutique
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS previous_slug TEXT NULL;

-- Index pour les lookups de redirection dans le layout
CREATE INDEX IF NOT EXISTS shops_previous_slug_idx
  ON shops (previous_slug)
  WHERE previous_slug IS NOT NULL;

COMMENT ON COLUMN shops.previous_slug IS 'Ancien slug conservé pour redirection 301 après changement d URL';
