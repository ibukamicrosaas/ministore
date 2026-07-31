-- Table pour enregistrer les retraits de revenus d'abonnements par l'admin TEKKIShop
-- Permet de tracer tous les retraits et d'éviter les incohérences de solde

CREATE TABLE IF NOT EXISTS admin_withdrawals (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  amount               INTEGER     NOT NULL CHECK (amount > 0),
  method               TEXT        NOT NULL,
  phone_number         TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'processing'
                                   CHECK (status IN ('processing', 'completed', 'failed')),
  bictorys_transfer_id TEXT,
  notes                TEXT,
  withdrawn_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_withdrawals_no_public_access" ON admin_withdrawals FOR ALL USING (false);
