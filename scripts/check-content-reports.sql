-- Vérification indépendante et rejouable de la migration 101
-- (supabase/migrations/101_content_reports.sql). À exécuter juste après
-- application :
--
--   supabase db query -f scripts/check-content-reports.sql --linked
--
-- Tout est fait dans une transaction annulée (ROLLBACK en fin de script) —
-- aucune ligne réelle n'est jamais commitée.

BEGIN;

DO $$
DECLARE
  test_shop_id    uuid;
  test_product_id uuid;
BEGIN
  SELECT id INTO test_shop_id FROM shops LIMIT 1;
  IF test_shop_id IS NULL THEN
    RAISE EXCEPTION 'Aucune boutique en base — impossible de tester la FK shop_id';
  END IF;

  SELECT id INTO test_product_id FROM products WHERE shop_id = test_shop_id LIMIT 1;

  -- 1. Signalement niveau boutique (product_id NULL) — cas "Campus France"
  INSERT INTO content_reports (shop_id, reason, detail)
  VALUES (test_shop_id, 'impersonation', 'test migration 101 — boutique entière');
  RAISE NOTICE 'OK — signalement niveau boutique (product_id NULL) accepté';

  -- 2. Signalement niveau produit, avec contact — cas "Rose photos"
  IF test_product_id IS NOT NULL THEN
    INSERT INTO content_reports (shop_id, product_id, reason, detail, reporter_contact)
    VALUES (test_shop_id, test_product_id, 'sexual_no_consent', 'test migration 101 — produit précis', '+221700000000');
    RAISE NOTICE 'OK — signalement niveau produit, avec contact, accepté';
  ELSE
    RAISE NOTICE 'SKIP — aucun produit trouvé pour cette boutique, cas 2 non testé';
  END IF;

  -- 3. status par défaut = 'new'
  IF (SELECT status FROM content_reports WHERE shop_id = test_shop_id AND detail = 'test migration 101 — boutique entière') = 'new' THEN
    RAISE NOTICE 'OK — status par défaut = new';
  ELSE
    RAISE EXCEPTION 'ÉCHEC — status par défaut incorrect';
  END IF;
END $$;

-- 4. Une valeur de reason hors liste doit être rejetée
DO $$
BEGIN
  BEGIN
    INSERT INTO content_reports (shop_id, reason)
    VALUES ((SELECT id FROM shops LIMIT 1), 'valeur_invalide');
    RAISE EXCEPTION 'ÉCHEC — une valeur de reason invalide a été acceptée';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK — une valeur de reason invalide est rejetée';
  END;
END $$;

-- 5. Un shop_id inexistant doit être rejeté (FK)
DO $$
BEGIN
  BEGIN
    INSERT INTO content_reports (shop_id, reason)
    VALUES ('00000000-0000-0000-0000-000000000000', 'other');
    RAISE EXCEPTION 'ÉCHEC — un shop_id inexistant a été accepté';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'OK — un shop_id inexistant est rejeté (FK)';
  END;
END $$;

ROLLBACK;
