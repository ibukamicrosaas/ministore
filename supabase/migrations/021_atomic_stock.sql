-- Fonction inverse de decrement_product_stock : restaure le stock si la commande échoue.
-- Utilisée comme rollback quand la création de la commande tombe après un décrément réussi.
CREATE OR REPLACE FUNCTION increment_product_stock(
  p_product_id UUID,
  p_shop_id    UUID,
  p_quantity   INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_count = stock_count + p_quantity,
      updated_at  = NOW()
  WHERE id      = p_product_id
    AND shop_id = p_shop_id
    AND stock_count IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_product_stock IS
  'Restaure le stock après un rollback de commande. Symétrique de decrement_product_stock.';
