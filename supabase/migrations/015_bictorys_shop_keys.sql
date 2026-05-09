-- Clés Bictorys propres pour les boutiques Pro (paiements directs, 0% commission)
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS bictorys_secret_key TEXT,
  ADD COLUMN IF NOT EXISTS bictorys_webhook_secret TEXT;
