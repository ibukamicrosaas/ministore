-- Zones de livraison sur la boutique
ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery_zones JSONB DEFAULT '[]'::jsonb;

-- Zone et prix choisis par le client à la commande
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price INTEGER NOT NULL DEFAULT 0;
