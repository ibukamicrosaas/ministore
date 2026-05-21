-- Toggle "Paiement à la livraison" par boutique
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS accept_cash_on_delivery BOOLEAN NOT NULL DEFAULT TRUE;
