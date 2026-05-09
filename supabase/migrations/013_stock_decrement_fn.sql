-- Décrémente le stock d'un produit de façon atomique.
-- Retourne TRUE si décrémenté, FALSE si stock insuffisant ou null (illimité).
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_shop_id    UUID,
  p_quantity   INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE products
  SET stock_count = stock_count - p_quantity,
      updated_at  = NOW()
  WHERE id        = p_product_id
    AND shop_id   = p_shop_id
    AND stock_count IS NOT NULL
    AND stock_count >= p_quantity;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
