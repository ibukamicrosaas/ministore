-- Vérification indépendante et rejouable des privilèges EXECUTE sur les
-- fonctions du schéma public. À exécuter après TOUTE migration qui crée ou
-- modifie une fonction dans public :
--
--   supabase db query -f scripts/check-function-privileges.sql --linked
--
-- Constat vérifié lors de la migration 089 (supabase/migrations/089_lockdown_
-- remaining_functions.sql) : sur cette base Supabase, ALTER DEFAULT
-- PRIVILEGES ne suffit pas à empêcher qu'une nouvelle fonction reçoive
-- EXECUTE pour PUBLIC — un mécanisme de plateforme, invisible dans pg_proc,
-- pg_event_trigger et pg_default_acl, l'ajoute inconditionnellement à la
-- création. La seule protection fiable est un REVOKE EXECUTE explicite,
-- écrit dans la même migration qui crée la fonction (voir AI_RULES.md).
-- Ce script est le filet qui détecte toute fonction ayant échappé à cette
-- règle, quelle qu'en soit la cause.
--
-- Les fonctions listées ici comme ayant besoin de service_role doivent être
-- tenues à jour manuellement si un nouveau chemin applicatif service_role
-- apparaît — ce script vérifie un état attendu, il ne le déduit pas.

DO $$
DECLARE
  exempt text[] := ARRAY[
    'get_my_shop_id()',
    'get_my_role()',
    'get_my_managed_country()'
  ];
  needs_service_role text[] := ARRAY[
    'decrement_product_stock(uuid, uuid, integer)',
    'increment_product_stock(uuid, uuid, integer)',
    'decrement_variant_stock(uuid, uuid, text, integer)',
    'increment_variant_stock(uuid, uuid, text, integer)',
    'upsert_client_from_order(uuid, text, text, text, text, text)',
    'reserve_promo_code(text, uuid)',
    'release_promo_code(uuid)',
    'expire_pending_orders()',
    'purge_draft_shops()',
    'increment_shop_visit(uuid)'
  ];
  fn record;
  checked int := 0;
BEGIN
  FOR fn IN
    SELECT p.oid,
           p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    checked := checked + 1;

    IF fn.signature = ANY(exempt) THEN
      CONTINUE;
    END IF;

    IF has_function_privilege('anon', fn.oid, 'EXECUTE') THEN
      RAISE EXCEPTION '% reste exécutable par anon — schéma non conforme', fn.signature;
    END IF;
    IF has_function_privilege('authenticated', fn.oid, 'EXECUTE') THEN
      RAISE EXCEPTION '% reste exécutable par authenticated — schéma non conforme', fn.signature;
    END IF;

    IF fn.signature = ANY(needs_service_role)
       AND NOT has_function_privilege('service_role', fn.oid, 'EXECUTE') THEN
      RAISE EXCEPTION '% n''est plus exécutable par service_role — un chemin légitime est cassé', fn.signature;
    END IF;
  END LOOP;

  RAISE NOTICE 'OK — % fonctions de public vérifiées, aucune anomalie.', checked;
END $$;
