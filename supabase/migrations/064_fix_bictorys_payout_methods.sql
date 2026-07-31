-- Fix: ajouter mobicash et maxit à la contrainte de la table payouts
-- T-Money (Togo) = togocell dans l'API Bictorys (pas moov)
-- Mobicash : Burkina Faso + Mali
-- Maxit    : Sénégal

ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_payout_method_check;
ALTER TABLE payouts ADD CONSTRAINT payouts_payout_method_check
  CHECK (payout_method IN (
    'wave', 'orange_money', 'mtn', 'moov', 'tmoney', 'flooz',
    'mobicash', 'maxit',
    'airtel', 'mvola'
  ));
