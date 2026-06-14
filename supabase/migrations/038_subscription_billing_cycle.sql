-- Abonnements annuels : cycle de facturation
ALTER TABLE subscription_transactions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual'));

COMMENT ON COLUMN subscription_transactions.billing_cycle IS
  '''monthly'' (31 j) ou ''annual'' (365 j). Détermine la durée d''activation et le montant attendu.';
