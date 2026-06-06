-- Enregistre chaque tentative de paiement d'abonnement
-- Permet au cron job de vérifier rétrospectivement les paiements non activés
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL,
  charge_id TEXT NOT NULL,
  merchant_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'verified' | 'activated' | 'failed'
  verified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, charge_id)
);

ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_access" ON subscription_transactions
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE id = (SELECT shop_id FROM profiles WHERE id = auth.uid()))
  );

-- Index pour les cron jobs et requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_status ON subscription_transactions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_shop_id ON subscription_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_created_at ON subscription_transactions(created_at DESC);
