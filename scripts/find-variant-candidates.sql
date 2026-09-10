-- Repérage, en lecture seule, de produits sans variantes configurées dont la
-- description contient un mot-clé de choix (taille, couleur, pointure...)
-- suivi d'une vraie liste de valeurs numériques ou de tailles-lettres —
-- signal d'un marchand qui a probablement mis dans la description ce que le
-- système de variantes est fait pour porter (piège identifié via un vrai
-- marchand sneakers, REPRISE.md §100). Resserré par rapport à une première
-- version (168 correspondances, trop de bruit : une couleur mentionnée une
-- fois dans un texte marketing suffisait) — exige maintenant au moins deux
-- valeurs (chiffre ou XS/S/M/L/XL/XXL) séparées par une virgule, un slash,
-- un tiret ou "ou" juste après le mot-clé. Une correspondance reste un
-- signal à relire manuellement, pas une certitude — jamais de correctif
-- automatique à partir de ce seul résultat.
--
--   supabase db query -f scripts/find-variant-candidates.sql --linked

WITH candidates AS (
  SELECT
    p.id,
    s.slug            AS shop_slug,
    p.name            AS product_name,
    p.description,
    p.created_at,
    (regexp_matches(
      p.description,
      '(pointure|taille|couleur|coloris|format|poids|longueur|dimension)s?\s*:?\s*([^.\n]{0,80})',
      'i'
    ))[2] AS values_snippet
  FROM products p
  JOIN shops s ON s.id = p.shop_id
  WHERE
    p.product_type = 'physical'
    AND p.variant_label IS NULL
    AND (p.variants IS NULL OR p.variants = '[]'::jsonb)
    AND p.description IS NOT NULL
    AND p.description ~* '(pointure|taille|couleur|coloris|format|poids|longueur|dimension)s?\s*:?\s*'
)
SELECT id, shop_slug, product_name, description, values_snippet, created_at
FROM candidates
WHERE values_snippet ~* '\y(\d{1,3}|xs|s|m|l|xl|xxl)\y\s*(,|/|-|\bou\b|\bet\b)\s*\y(\d{1,3}|xs|s|m|l|xl|xxl)\y'
ORDER BY created_at DESC
LIMIT 200;
