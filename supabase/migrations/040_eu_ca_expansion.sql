-- Expansion EU/CA : Stripe Connect + devise + abonnements
-- stripe_account_id existait déjà ; on ajoute les nouveaux champs

ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_connect_enabled  BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS currency                TEXT DEFAULT 'XOF';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT;
