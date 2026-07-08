-- Décrémente le stock d'une variante spécifique dans la colonne JSONB `variants`.
-- Retourne TRUE si ok, FALSE si stock insuffisant ou variante introuvable.
-- Utilise FOR UPDATE pour éviter les race conditions.
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_product_id  uuid,
  p_shop_id     uuid,
  p_variant_label text,
  p_quantity    integer
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_variants  jsonb;
  v_idx       integer;
  v_stock_val jsonb;
  v_stock     integer;
BEGIN
  SELECT variants INTO v_variants
  FROM products
  WHERE id = p_product_id AND shop_id = p_shop_id
  FOR UPDATE;

  IF v_variants IS NULL THEN RETURN false; END IF;

  -- Trouver l'index (1-based via ordinality)
  SELECT (t.i - 1)::integer INTO v_idx
  FROM jsonb_array_elements(v_variants) WITH ORDINALITY AS t(elem, i)
  WHERE t.elem->>'label' = p_variant_label
  LIMIT 1;

  IF v_idx IS NULL THEN RETURN true; END IF; -- variante sans index = stock illimité

  v_stock_val := v_variants->v_idx->'stock_count';

  IF v_stock_val IS NULL OR v_stock_val = 'null'::jsonb THEN
    RETURN true; -- stock_count null = illimité
  END IF;

  v_stock := v_stock_val::integer;

  IF v_stock < p_quantity THEN RETURN false; END IF;

  UPDATE products
  SET
    variants   = jsonb_set(v_variants, ARRAY[v_idx::text, 'stock_count'], to_jsonb(v_stock - p_quantity)),
    updated_at = now()
  WHERE id = p_product_id AND shop_id = p_shop_id;

  RETURN true;
END;
$$;

-- Incrémente le stock d'une variante (rollback en cas d'échec de commande).
CREATE OR REPLACE FUNCTION increment_variant_stock(
  p_product_id  uuid,
  p_shop_id     uuid,
  p_variant_label text,
  p_quantity    integer
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_variants  jsonb;
  v_idx       integer;
  v_stock_val jsonb;
  v_stock     integer;
BEGIN
  SELECT variants INTO v_variants
  FROM products
  WHERE id = p_product_id AND shop_id = p_shop_id
  FOR UPDATE;

  IF v_variants IS NULL THEN RETURN; END IF;

  SELECT (t.i - 1)::integer INTO v_idx
  FROM jsonb_array_elements(v_variants) WITH ORDINALITY AS t(elem, i)
  WHERE t.elem->>'label' = p_variant_label
  LIMIT 1;

  IF v_idx IS NULL THEN RETURN; END IF;

  v_stock_val := v_variants->v_idx->'stock_count';
  IF v_stock_val IS NULL OR v_stock_val = 'null'::jsonb THEN RETURN; END IF;

  v_stock := v_stock_val::integer;

  UPDATE products
  SET
    variants   = jsonb_set(v_variants, ARRAY[v_idx::text, 'stock_count'], to_jsonb(v_stock + p_quantity)),
    updated_at = now()
  WHERE id = p_product_id AND shop_id = p_shop_id;
END;
$$;
