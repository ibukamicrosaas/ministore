-- Vérification indépendante et rejouable de la migration 100
-- (supabase/migrations/100_notification_logs_push.sql). À exécuter juste
-- après application :
--
--   supabase db query -f scripts/check-notification-logs-push.sql --linked
--
-- Trois points contrôlés : recipient_phone accepte NULL, push_endpoint
-- existe, 'delivery_confirmed' est une valeur valide de notification_type —
-- sans jamais insérer de ligne réelle (tout est fait dans une transaction
-- annulée).

BEGIN;

DO $$
DECLARE
  test_shop_id uuid;
BEGIN
  -- shop_id arbitraire existant, requis par la FK — jamais commité (ROLLBACK
  -- en fin de script), donc aucun risque de polluer une vraie boutique.
  SELECT id INTO test_shop_id FROM shops LIMIT 1;

  IF test_shop_id IS NULL THEN
    RAISE EXCEPTION 'Aucune boutique en base — impossible de tester la FK shop_id';
  END IF;

  -- 1. recipient_phone NULL acceptée, push_endpoint accepté, nouveau type accepté
  INSERT INTO notification_logs (
    shop_id, recipient_phone, notification_type, channel, message, status, push_endpoint
  ) VALUES (
    test_shop_id, NULL, 'delivery_confirmed', 'push', 'test migration 100', 'sent', 'https://web.push.apple.com/test-endpoint'
  );

  RAISE NOTICE 'OK — ligne push (recipient_phone NULL, push_endpoint, delivery_confirmed) acceptée';

  -- 2. Ancien usage SMS/WhatsApp toujours valide (non-régression) —
  -- recipient_phone renseigné, channel/notification_type déjà existants.
  INSERT INTO notification_logs (
    shop_id, recipient_phone, notification_type, channel, message, status
  ) VALUES (
    test_shop_id, '+221770000000', 'new_order_shop', 'sms', 'test migration 100 — non-régression SMS', 'sent'
  );

  RAISE NOTICE 'OK — ligne SMS/WhatsApp existante toujours acceptée (non-régression)';
END $$;

-- 3. Un notification_type hors liste doit toujours être rejeté — la
-- contrainte CHECK doit avoir été recréée, pas simplement supprimée.
DO $$
BEGIN
  BEGIN
    INSERT INTO notification_logs (shop_id, notification_type, channel, message, status)
    VALUES ((SELECT id FROM shops LIMIT 1), 'valeur_invalide', 'push', 'test', 'sent');
    RAISE EXCEPTION 'ÉCHEC — une valeur invalide de notification_type a été acceptée, la contrainte CHECK a disparu';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK — une valeur invalide de notification_type est toujours rejetée';
  END;
END $$;

ROLLBACK;
