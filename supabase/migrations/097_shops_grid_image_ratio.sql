-- Refonte boutiques publiques — Lot 3, Vague 4d : le cadrage carré/portrait de
-- la grille produits devient un réglage boutique, plus un choix par produit
-- (SPEC-v2 §4.7 : "Cadrage carré imposé côté plateforme... Le réglage
-- Carré/Portrait par produit disparaît du formulaire et remonte en réglage
-- de boutique"). Voir REPRISE.md §53/§54.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS grid_image_ratio TEXT NOT NULL DEFAULT 'square'
    CHECK (grid_image_ratio IN ('square', 'portrait'));

-- products.image_ratio n'est pas supprimée : retirer une colonne est
-- irréversible, sans bénéfice immédiat. Elle n'est simplement plus lue ni
-- écrite après cette vague — nettoyage différé si confirmé inutile plus tard.

-- Backfill mesuré avant écriture (voir REPRISE.md §53) : une règle de
-- majorité brute sur tout le catalogue ferait basculer 32 boutiques en
-- 'portrait', dont 21 n'ont qu'UN SEUL produit actif — un choix ponctuel sur
-- une fiche, pas une préférence répétée. Seuil retenu, validé explicitement
-- par l'utilisateur : au moins 3 produits actifs ET majorité stricte parmi
-- eux en portrait. En dessous de ce seuil, la boutique reste au nouveau
-- défaut plateforme ('square'), quel que soit son ratio actuel.
--
-- Avec ce seuil, 7 boutiques basculent en 'portrait' (vérifié avant écriture) :
--   Ton Mentor (2/3), Rhema (3/3), Chez Trésor U-novateur (3/4),
--   My Bio-Farma Shop (5/6), AEA Cosmetics (5/7), Zoustore221 (9/9),
--   Noah Collection (11/11).
UPDATE shops s
SET grid_image_ratio = 'portrait'
WHERE (
  SELECT count(*) FILTER (WHERE p.image_ratio = 'portrait')
  FROM products p WHERE p.shop_id = s.id AND p.is_active = true
) > (
  SELECT count(*) / 2
  FROM products p WHERE p.shop_id = s.id AND p.is_active = true
)
AND (
  SELECT count(*)
  FROM products p WHERE p.shop_id = s.id AND p.is_active = true
) >= 3;
