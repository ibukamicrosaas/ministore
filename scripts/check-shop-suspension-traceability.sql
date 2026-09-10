-- Vérification indépendante et rejouable de la migration 102
-- (supabase/migrations/102_shop_suspension_traceability.sql). À exécuter
-- juste après application :
--
--   supabase db query -f scripts/check-shop-suspension-traceability.sql --linked
--
-- Tout est fait dans une transaction annulée (ROLLBACK en fin de script) —
-- aucune ligne réelle n'est jamais commitée, aucune boutique réelle n'est
-- jamais modifiée durablement.
--
-- `supabase db query` ne restitue pas RAISE NOTICE (AI_RULES.md) — résultat
-- rapporté par un SELECT final unique, colonnes booléennes, pas par des
-- messages pendant l'exécution.

BEGIN;

CREATE TEMP TABLE _check_results (check_name TEXT, passed BOOLEAN);

DO $$
DECLARE
  test_shop_id  uuid;
  test_admin_id uuid;
  v_reason      text;
  v_by          uuid;
  v_at          timestamptz;
  v_fk_rejected boolean := false;
BEGIN
  SELECT id INTO test_shop_id FROM shops LIMIT 1;
  SELECT id INTO test_admin_id FROM auth.users LIMIT 1;

  IF test_shop_id IS NULL OR test_admin_id IS NULL THEN
    INSERT INTO _check_results VALUES ('setup_prerequisites_present', false);
    RETURN;
  END IF;
  INSERT INTO _check_results VALUES ('setup_prerequisites_present', true);

  -- 1. Renseigner les 3 champs (simulate une suspension)
  UPDATE shops
     SET suspension_reason = 'test migration 102 — contenu non consenti signalé',
         suspended_by      = test_admin_id,
         suspended_at      = now()
   WHERE id = test_shop_id;

  SELECT suspension_reason, suspended_by, suspended_at
    INTO v_reason, v_by, v_at
    FROM shops WHERE id = test_shop_id;

  INSERT INTO _check_results VALUES (
    'fields_accept_and_return_values',
    v_reason = 'test migration 102 — contenu non consenti signalé'
      AND v_by = test_admin_id
      AND v_at IS NOT NULL
  );

  -- 2. suspended_by rejette un utilisateur inexistant (FK)
  BEGIN
    UPDATE shops SET suspended_by = '00000000-0000-0000-0000-000000000000' WHERE id = test_shop_id;
  EXCEPTION WHEN foreign_key_violation THEN
    v_fk_rejected := true;
  END;
  INSERT INTO _check_results VALUES ('nonexistent_suspended_by_rejected_by_fk', v_fk_rejected);
END $$;

-- 3. Contrainte ON DELETE SET NULL bien posée sur suspended_by
INSERT INTO _check_results
SELECT 'suspended_by_is_on_delete_set_null', EXISTS (
  SELECT 1
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'shops'
    AND c.contype = 'f'
    AND c.confrelid = 'auth.users'::regclass
    AND c.conkey = (
      SELECT array_agg(a.attnum)
      FROM pg_attribute a
      WHERE a.attrelid = t.oid AND a.attname = 'suspended_by'
    )
    AND c.confdeltype = 'n'
);

-- 4. Les 3 colonnes existent bien avec le bon type
INSERT INTO _check_results
SELECT 'columns_exist_with_expected_types', COUNT(*) = 3 FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'shops'
  AND (
    (column_name = 'suspension_reason' AND data_type = 'text')
    OR (column_name = 'suspended_by' AND data_type = 'uuid')
    OR (column_name = 'suspended_at' AND data_type = 'timestamp with time zone')
  );

SELECT check_name, passed FROM _check_results ORDER BY check_name;

ROLLBACK;
