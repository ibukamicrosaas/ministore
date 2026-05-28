-- Affiliation / parrainage
-- Chaque boutique reçoit un code de parrainage unique (8 chars uppercase)
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS ref_code TEXT UNIQUE;

-- Générer le code pour les boutiques existantes
UPDATE shops
SET ref_code = upper(substring(replace(id::text, '-', ''), 1, 8))
WHERE ref_code IS NULL;

-- Contrainte NOT NULL après le backfill
ALTER TABLE shops
  ALTER COLUMN ref_code SET NOT NULL;

-- Index pour le lookup rapide via lien d'affiliation
CREATE INDEX IF NOT EXISTS shops_ref_code_idx ON shops (ref_code);

-- Commissions de parrainage
CREATE TABLE IF NOT EXISTS referral_commissions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_shop_id UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  referred_shop_id UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  plan             TEXT        NOT NULL,
  commission_amount INTEGER    NOT NULL, -- en FCFA
  status           TEXT        NOT NULL DEFAULT 'pending', -- pending | paid
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at          TIMESTAMPTZ,
  UNIQUE (referred_shop_id) -- un seul parrain par boutique
);

CREATE INDEX IF NOT EXISTS referral_commissions_referrer_idx ON referral_commissions (referrer_shop_id);

-- RLS
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- Le propriétaire d'une boutique ne voit que ses propres commissions
CREATE POLICY "owner_read_commissions" ON referral_commissions
  FOR SELECT USING (
    referrer_shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid()
    )
  );
