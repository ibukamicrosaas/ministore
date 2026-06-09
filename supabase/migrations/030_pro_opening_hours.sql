-- Plan Pro : horaires d'ouverture de la boutique

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS opening_hours TEXT;

COMMENT ON COLUMN shops.opening_hours IS 'Plan Pro — horaires d''ouverture (texte libre, ex: "Lun-Ven : 8h-20h\nSamedi : 9h-18h")';
