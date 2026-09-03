-- Lot 1 du chantier "bascule variantes produit, système A → B" (REPRISE.md §76).
--
-- Backfill de product_variants (table relationnelle, schéma posé par 086,
-- jamais alimentée depuis — 0 ligne) depuis products.variants (JSONB, système
-- A, 162 produits actifs+inactifs sur 58 boutiques, mesuré le 2026-09-03).
--
-- Purement additif :
--   - products.variants (JSONB) N'EST PAS touché ni supprimé. Reste la source
--     lue par le code applicatif tant que les Lots 2-4 (api/orders/route.ts,
--     VariantSelectorCta.tsx + surfaces prix associées, ProductForm.tsx) ne
--     sont pas déployés — filet de sécurité en lecture seule, sa suppression
--     sera un chantier séparé, plus tard, une fois le système B éprouvé.
--   - order_items n'est référencé nulle part dans cette migration. Aucune de
--     ses 676 lignes (dont 61 avec variant_label renseigné, mesuré le
--     2026-09-03) n'est lue ni modifiée — order_items.variant_label est une
--     colonne texte simple, sans clé étrangère vers products.variants ni vers
--     product_variants, figée au moment de la commande.
--
-- Étiquette générique par défaut : products.variant_label n'a jamais été posé
-- par ProductForm.tsx jusqu'ici (0 ligne renseignée, vérifié) — impossible de
-- reconstituer la vraie intention du marchand (Couleur, Taille...). 'Format'
-- reprend le choix déjà documenté dans SPEC-v2-refonte-boutiques-publiques.md
-- §3. Renommable en un clic par le marchand une fois le Lot 4 en production.

INSERT INTO product_variants (product_id, name, price, stock, position, is_active)
SELECT
  p.id,
  (elem.value ->> 'label')::text,
  (elem.value ->> 'price')::integer,
  CASE
    WHEN elem.value ? 'stock_count' AND elem.value ->> 'stock_count' IS NOT NULL
      THEN (elem.value ->> 'stock_count')::integer
    ELSE NULL
  END,
  (elem.ordinality - 1)::integer,
  true
FROM products p
CROSS JOIN LATERAL jsonb_array_elements(p.variants) WITH ORDINALITY AS elem(value, ordinality)
WHERE p.variants IS NOT NULL
  AND jsonb_array_length(p.variants) > 0;

UPDATE products
SET variant_label = 'Format'
WHERE variants IS NOT NULL
  AND jsonb_array_length(variants) > 0
  AND variant_label IS NULL;
