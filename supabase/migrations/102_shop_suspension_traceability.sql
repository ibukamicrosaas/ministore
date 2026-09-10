-- Traçabilité des suspensions de boutique (chantier modération, REPRISE.md §93) — lot 2.
--
-- Aujourd'hui, updateShopPlan (lib/actions/admin.ts) fait un simple UPDATE
-- plan/is_active/... : aucune trace de qui a suspendu une boutique ni pourquoi.
-- Une suspension peut aussi se faire directement en base (cas "Rose photos"),
-- sans laisser la moindre trace.
--
-- Les trois colonnes ci-dessous représentent la DERNIÈRE suspension connue —
-- elles ne sont PAS effacées à la réactivation (is_active repassé à true),
-- pour rester visibles même sur une boutique redevenue active (décision
-- explicite, utile pour repérer un cas récidiviste).
--
-- Historique complet (pas seulement le dernier état) porté séparément par
-- shop_events ('shop_suspended' / 'shop_reactivated', réutilise le mécanisme
-- déjà en place pour free_order_used/order_held/trial_expired) — corrigé côté
-- applicatif dans lib/actions/admin.ts, pas dans cette migration.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspended_at      TIMESTAMPTZ;

COMMENT ON COLUMN shops.suspension_reason IS
  'Raison de la dernière suspension (admin, texte libre, obligatoire depuis
   l''UI). NULL si la boutique n''a jamais été suspendue via ce chemin.
   Pas effacé à la réactivation — reflète la dernière suspension connue,
   pas "suspendue actuellement" (utiliser is_active pour ça).';

COMMENT ON COLUMN shops.suspended_by IS
  'Admin (auth.users.id) ayant effectué la dernière suspension. NULL si
   jamais suspendue via updateShopPlan, ou si suspendue directement en base
   hors de ce chemin (ex. cas "Rose photos").';

COMMENT ON COLUMN shops.suspended_at IS
  'Horodatage dédié de la dernière suspension, jamais écrasé par une autre
   modification (contrairement à updated_at). NULL si jamais suspendue via
   updateShopPlan.';
