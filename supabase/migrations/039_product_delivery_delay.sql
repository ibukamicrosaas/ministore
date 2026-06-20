-- Délai de livraison estimé par produit
-- Ex : "24h", "2 à 3 jours", "10 à 15 jours"
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_delay TEXT;
