-- Badges produit : jusqu'à 4 bénéfices clés affichés sur la page produit
-- Prix avant réduction (barré) : prix original facultatif pour montrer une promo
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS badges       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS original_price INTEGER;
