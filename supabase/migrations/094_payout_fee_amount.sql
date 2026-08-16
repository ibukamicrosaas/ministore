-- Frais de retrait Bictorys désormais facturés au marchand (décision du
-- 2026-08-16), affichés séparément de la commission sur l'encaissement,
-- jamais fondus dans commission_amount — voir lib/billing/payout-fees.ts.
ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS payout_fee_amount INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN payouts.payout_fee_amount IS
  'Frais de retrait Bictorys (opérateur + 0,5% Bictorys) déduits du montant transféré, distincts de commission_amount (frais sur l''encaissement). Voir lib/billing/payout-fees.ts.';
