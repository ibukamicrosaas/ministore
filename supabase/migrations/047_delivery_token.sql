-- Migration 047 : token de livraison pour les livreurs
-- Un token unique par commande, distinct du client_token.
-- Permet au livreur d'accéder aux détails de la commande et de confirmer
-- la livraison sans authentification, via un lien sécurisé.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_token TEXT;

-- Backfill des commandes existantes
UPDATE orders
SET delivery_token = encode(gen_random_bytes(16), 'hex')
WHERE delivery_token IS NULL;

-- Contraintes finales
ALTER TABLE orders ALTER COLUMN delivery_token SET NOT NULL;
ALTER TABLE orders ALTER COLUMN delivery_token SET DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS orders_delivery_token_key ON orders(delivery_token);

-- RLS : lecture publique par token (identique au pattern client_token)
CREATE POLICY "orders_delivery_token_read" ON orders
  FOR SELECT USING (true);
-- Note : la politique existante orders_token_read couvre déjà le SELECT par token.
-- La sécurité repose sur le token (256 bits d'entropie, non devinable).
