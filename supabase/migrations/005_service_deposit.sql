-- ============================================================
-- BEAUTYDESK — Politique d'acompte par service
-- Migration 005
-- ============================================================

-- NULL = utiliser la politique par défaut du salon
-- 0 = pas d'acompte requis pour ce service
-- 1-100 = pourcentage d'acompte spécifique à ce service
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER
    CHECK (deposit_percentage BETWEEN 0 AND 100);
