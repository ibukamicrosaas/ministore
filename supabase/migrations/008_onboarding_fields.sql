-- ============================================================
-- BEAUTYDESK — Champs onboarding
-- Migration 008
-- ============================================================

-- Rendre city et phone_whatsapp optionnels pour l'onboarding progressif
ALTER TABLE salons ALTER COLUMN city DROP NOT NULL;
ALTER TABLE salons ALTER COLUMN phone_whatsapp DROP NOT NULL;

-- Champs métier collectés pendant l'onboarding
ALTER TABLE salons ADD COLUMN IF NOT EXISTS business_type TEXT
  CHECK (business_type IN ('independent', 'salon'));

ALTER TABLE salons ADD COLUMN IF NOT EXISTS specialty TEXT
  CHECK (specialty IN ('hair', 'nails', 'makeup', 'beauty', 'fashion', 'other'));

ALTER TABLE salons ADD COLUMN IF NOT EXISTS specialty_custom TEXT;

-- Suivi de complétion
ALTER TABLE salons ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Suivi de l'étape courante sur les profils (pour reprendre en cas d'interruption)
-- Valeurs : 1=début, 2=nom fait, 3=type fait, 4=info faite, 5=terminé
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
