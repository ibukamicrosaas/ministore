-- Plan Pro : photo dédiée section À propos
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS about_photo_url TEXT;

COMMENT ON COLUMN shops.about_photo_url IS 'Plan Pro — photo de la section À propos (équipe, boutique physique, portrait)';

-- Politique RLS : le marchand peut modifier sa propre about_photo_url
-- (déjà couverte par la politique UPDATE générale sur la table shops)
