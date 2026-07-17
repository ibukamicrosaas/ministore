-- Coût d'achat / de fabrication du produit
-- Permet au marchand de suivre sa marge brute par produit et par vente

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT NULL;

COMMENT ON COLUMN products.cost_price IS 'Coût d''achat ou de fabrication (en FCFA / monnaie locale). Utilisé pour calculer la marge brute. Non visible par les clients.';
