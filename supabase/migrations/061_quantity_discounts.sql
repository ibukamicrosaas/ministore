ALTER TABLE products
  ADD COLUMN IF NOT EXISTS quantity_discounts JSONB DEFAULT NULL;

COMMENT ON COLUMN products.quantity_discounts IS
  'Paliers de remise par quantité. Ex: [{"min_qty":3,"discount_pct":10},{"min_qty":5,"discount_pct":15}]';
