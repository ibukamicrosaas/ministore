-- 1. Flag annulation abonnement à la fin de période
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS plan_cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Préserver les transactions lors de la suppression d'un compte
--    (ON DELETE CASCADE → ON DELETE SET NULL pour garder l'historique)
ALTER TABLE subscription_transactions
  DROP CONSTRAINT IF EXISTS subscription_transactions_shop_id_fkey;

ALTER TABLE subscription_transactions
  ALTER COLUMN shop_id DROP NOT NULL;

ALTER TABLE subscription_transactions
  ADD CONSTRAINT subscription_transactions_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL;
