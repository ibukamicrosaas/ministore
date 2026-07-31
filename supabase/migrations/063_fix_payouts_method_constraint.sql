-- ─────────────────────────────────────────────────────────────────────────────
-- 063 : Élargir la contrainte payout_method pour tous les pays
-- ─────────────────────────────────────────────────────────────────────────────
-- La contrainte initiale limitait à ('wave', 'orange_money') — Sénégal uniquement.
-- Les marchands des autres pays (Togo, Bénin, Mali…) ne pouvaient pas faire de retrait.

ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_payout_method_check;

ALTER TABLE payouts
  ADD CONSTRAINT payouts_payout_method_check
  CHECK (payout_method IN (
    'wave', 'orange_money', 'mtn', 'moov', 'tmoney', 'flooz', 'airtel', 'mvola'
  ));
