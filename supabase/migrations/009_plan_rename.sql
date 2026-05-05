-- Migration 009 : renommer les plans Sheka → TekkiShop
-- Sheka : trial / starter / pro / multi
-- TekkiShop : trial / decouverte / business / pro

-- 1. Migrer les données existantes avant de toucher la contrainte
UPDATE shops SET plan = 'decouverte' WHERE plan = 'starter';
UPDATE shops SET plan = 'pro'        WHERE plan = 'multi';

-- 2. Supprimer l'ancienne contrainte CHECK sur plan
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_plan_check;

-- 3. Ajouter la nouvelle contrainte avec les plans TekkiShop
ALTER TABLE shops
  ADD CONSTRAINT shops_plan_check
  CHECK (plan IN ('trial', 'decouverte', 'business', 'pro'));

-- 4. Ajouter la colonne image_ratio sur products (si pas déjà présente)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_ratio TEXT DEFAULT 'square'
  CHECK (image_ratio IN ('square', 'portrait'));
