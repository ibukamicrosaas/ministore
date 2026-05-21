-- Gestion du renouvellement mensuel des abonnements payants
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Index pour les crons de renouvellement (cherchent par plan + date expiration)
CREATE INDEX IF NOT EXISTS shops_subscription_ends_at_idx
  ON shops (subscription_ends_at)
  WHERE plan != 'trial' AND subscription_ends_at IS NOT NULL;
