-- Migration 046 : corriger les FK manquant ON DELETE sur shops
--
-- Sans ces clauses, supprimer un shop échoue avec :
-- "update or delete on table shops violates foreign key constraint"
-- car profiles, payments et notification_logs référencent toujours le shop.
--
-- profiles.shop_id    → SET NULL  (colonne nullable, profil persiste après suppression boutique)
-- payments.shop_id    → CASCADE   (paiements appartiennent à la boutique)
-- notification_logs.shop_id → CASCADE (logs appartiennent à la boutique)

-- profiles ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_shop_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL;

-- payments ─────────────────────────────────────────────────────────────────
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_shop_id_fkey;

ALTER TABLE payments
  ADD CONSTRAINT payments_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE;

-- notification_logs ────────────────────────────────────────────────────────
ALTER TABLE notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_shop_id_fkey;

ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE;
