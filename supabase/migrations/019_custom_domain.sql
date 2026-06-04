-- Plan Pro : domaine personnalisé + suppression branding TekkiShop

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS hide_branding  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_domain  TEXT    NULL;

-- Un domaine ne peut appartenir qu'à une seule boutique
CREATE UNIQUE INDEX IF NOT EXISTS shops_custom_domain_idx
  ON shops (custom_domain)
  WHERE custom_domain IS NOT NULL;

COMMENT ON COLUMN shops.hide_branding  IS 'Plan Pro — masque le footer "Toi aussi, ouvre ta boutique avec TekkiShop"';
COMMENT ON COLUMN shops.custom_domain  IS 'Plan Pro — domaine personnalisé (ex: boutique.mondomaine.com)';
