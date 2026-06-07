-- Ajouter le numéro de téléphone du paiement Bictorys
ALTER TABLE subscription_transactions
ADD COLUMN payer_phone TEXT;

CREATE INDEX idx_subscription_transactions_payer_phone
ON subscription_transactions(payer_phone);
