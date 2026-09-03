-- Lot 2 du chantier "bascule variantes produit, système A → B" (REPRISE.md
-- §76/§77). Équivalent de decrement_variant_stock/increment_variant_stock
-- (054, système A JSONB) mais pour product_variants (système B, relationnel).
--
-- Plus simple que la version JSONB : product_variants.id est une clé primaire
-- globalement unique, pas besoin de p_shop_id/p_product_id pour désambiguïser
-- (contrairement à p_variant_label, qui n'est unique qu'au sein d'un produit).
--
-- Les fonctions système A (054) restent inchangées, pour le chemin legacy
-- (variant_label sans variant_id) — voir api/orders/route.ts, compatibilité
-- double.

CREATE OR REPLACE FUNCTION decrement_variant_stock_v2(
  p_variant_id  uuid,
  p_quantity    integer
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock integer;
BEGIN
  SELECT stock INTO v_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_stock IS NULL THEN RETURN true; END IF; -- stock NULL = illimité
  IF v_stock < p_quantity THEN RETURN false; END IF;

  UPDATE product_variants
  SET stock = v_stock - p_quantity
  WHERE id = p_variant_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_stock_v2(
  p_variant_id  uuid,
  p_quantity    integer
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock integer;
BEGIN
  SELECT stock INTO v_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND OR v_stock IS NULL THEN RETURN; END IF;

  UPDATE product_variants
  SET stock = v_stock + p_quantity
  WHERE id = p_variant_id;
END;
$$;
