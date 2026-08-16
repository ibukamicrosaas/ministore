-- Unifie le code pays du Burkina Faso vers 'BK' (seul code accepté par
-- l'API Bictorys — 'BF' est un code ISO 3166-1 valide mais n'existe pas
-- côté Bictorys, voir REPRISE.md §4 et lib/payments/bictorys.ts).
-- Vérifié avant écriture : aucune contrainte CHECK ni clé étrangère sur
-- shops.country, aucun trigger spécifique au pays (information_schema,
-- pg_constraint, pg_trigger interrogés directement sur la base liée).

-- 1. shops.country — 52 boutiques concernées (vérifié le 2026-08-16).
UPDATE shops SET country = 'BK', updated_at = now() WHERE country = 'BF';

-- 2. shops.target_countries (JSONB, liste des pays de livraison acceptés) —
-- 'BF' y figure aussi, hérité du DEFAULT posé par la migration 032.
-- 1498 boutiques concernées (vérifié le 2026-08-16, dry-run testé avant
-- écriture). Aucune boutique n'a déjà les deux valeurs à la fois (vérifié),
-- remplacement direct sans risque de doublon.
UPDATE shops
SET target_countries = (
  SELECT jsonb_agg(CASE WHEN value = 'BF' THEN 'BK' ELSE value END)
  FROM jsonb_array_elements_text(target_countries) AS value
),
    updated_at = now()
WHERE target_countries @> '["BF"]'::jsonb;

-- 3. Le DEFAULT de la colonne portait aussi 'BF' — sans ce correctif,
-- toute nouvelle boutique créée sans valeur explicite en hériterait encore.
ALTER TABLE shops
  ALTER COLUMN target_countries SET DEFAULT '["SN","CI","BJ","TG","ML","BK"]'::jsonb;
