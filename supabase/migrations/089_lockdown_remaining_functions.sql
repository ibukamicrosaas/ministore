-- Suite du verrouillage d'urgence (088) : les 17 fonctions restantes du
-- schéma public (hors activate_free_orders_shop, traitée en 088, et hors
-- get_my_shop_id/get_my_role/get_my_managed_country, intouchées) avaient
-- toutes EXECUTE ouvert à anon et authenticated — comportement par défaut
-- de Postgres à la création (GRANT implicite à PUBLIC), jamais corrigé.
-- Chaque REVOKE cible explicitement PUBLIC en plus de anon/authenticated :
-- anon hérite de PUBLIC, un REVOKE qui ne viserait que anon/authenticated
-- laisserait la porte ouverte par héritage.

BEGIN;

REVOKE EXECUTE ON FUNCTION decrement_product_stock(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_product_stock(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION decrement_variant_stock(uuid, uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_variant_stock(uuid, uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION upsert_client_from_order(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION reserve_promo_code(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION release_promo_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION expire_pending_orders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION purge_draft_shops() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_shop_visit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION cleanup_old_login_attempts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION cleanup_pin_resets() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_promo_used_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION handle_free_order_quota() FROM PUBLIC, anon, authenticated;

-- Restauration nommée, uniquement pour les fonctions dont l'appelant
-- applicatif réel utilise le client admin (service_role). Rien de supposé
-- acquis : chaque appelant a été vérifié plus haut ou dans les échanges
-- précédents (api/orders/route.ts pour les 7 premières, les routes cron et
-- api/shop-visit pour les 3 suivantes).
GRANT EXECUTE ON FUNCTION decrement_product_stock(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION increment_product_stock(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_variant_stock(uuid, uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION increment_variant_stock(uuid, uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_client_from_order(uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION reserve_promo_code(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION release_promo_code(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION expire_pending_orders() TO service_role;
GRANT EXECUTE ON FUNCTION purge_draft_shops() TO service_role;
GRANT EXECUTE ON FUNCTION increment_shop_visit(uuid) TO service_role;

-- cleanup_old_login_attempts, cleanup_pin_resets, increment_promo_used_count :
-- aucun GRANT. Rien ne les appelle aujourd'hui ; inventer un accès non
-- utilisé irait à l'encontre du principe qui motive cette migration.
-- handle_new_user, update_updated_at, rls_auto_enable, handle_free_order_quota :
-- aucun GRANT non plus — fonctions de trigger/événement, invoquées par le
-- moteur, pas par un rôle.

-- Le défaut de configuration lui-même, scopé au rôle qui crée réellement les
-- fonctions (postgres — vérifié : proowner des 21 fonctions ET current_user
-- de la connexion de migration). Sans le FOR ROLE, la clause ne protège rien
-- si les migrations tournaient sous un autre rôle que le propriétaire.
--
-- FROM PUBLIC, anon, authenticated — et pas seulement PUBLIC. Vérifié via
-- pg_default_acl : ce n'est pas l'octroi implicite de Postgres à PUBLIC qui
-- est en cause ici, mais un default ACL propre à Supabase
-- (FOR ROLE postgres IN SCHEMA public) qui accorde EXECUTE nommément à anon
-- et authenticated pour toute fonction future créée par postgres — sans
-- jamais passer par PUBLIC. Un REVOKE ... FROM PUBLIC seul est un no-op sur
-- cette entrée-là.
--
-- CONSTAT VÉRIFIÉ, à ne pas reperdre (trouvé par élimination directe lors de
-- l'application de cette migration, pas supposé) : sur cette base Supabase,
-- cette clause ne suffit PAS à empêcher qu'une fonction nouvellement créée
-- reçoive quand même EXECUTE pour PUBLIC. Preuve : dans une transaction
-- isolée, après avoir confirmé via SELECT que la ligne pg_default_acl
-- (postgres, public, fonctions) ne contenait plus ni PUBLIC ni
-- anon/authenticated, une fonction créée dans la foulée obtenait tout de
-- même EXECUTE pour PUBLIC (proacl le montrait explicitement : un item
-- "=X/postgres" absent de la ligne pg_default_acl consultée). Les 7 triggers
-- d'événement de la base ont été lus un par un pour écarter cette piste :
-- rls_auto_enable ne cible que les CREATE TABLE, les trois
-- grant_pg_{cron,net,graphql}_access ne se déclenchent que sur CREATE
-- EXTENSION, pgrst_ddl_watch se contente d'un NOTIFY. Aucun n'accorde
-- EXECUTE sur une fonction. Conclusion : un mécanisme de plateforme
-- invisible en SQL (absent de pg_proc, pg_event_trigger, pg_default_acl)
-- ajoute PUBLIC de façon inconditionnelle à la création. Cette clause reste
-- utile pour ce qu'elle couvre réellement (empêcher un GRANT par défaut
-- nommé à anon/authenticated), mais aucune fonction future ne doit compter
-- dessus seule — voir AI_RULES.md, règle sur la création de fonctions.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Preuve du seul mécanisme fiable sur cette base (voir constat ci-dessus) :
-- pas ALTER DEFAULT PRIVILEGES seule, mais un REVOKE explicite juste après
-- la création — exactement le chemin que 088 a déjà validé en production, et
-- celui que toute fonction future devra suivre. Fonction créée, REVOKE posé,
-- vérifiée dans les deux sens, supprimée, dans la même transaction que le
-- reste de la migration : sert aussi de canari — si ce test échoue un jour,
-- c'est que le REVOKE explicite lui-même a cessé de protéger, pas seulement
-- ALTER DEFAULT PRIVILEGES.
CREATE FUNCTION public.__test_default_privileges() RETURNS void
LANGUAGE plpgsql AS $fn$ BEGIN END; $fn$;

REVOKE EXECUTE ON FUNCTION public.__test_default_privileges() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.__test_default_privileges()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Le REVOKE explicite ne protège pas — anon peut encore exécuter public.__test_default_privileges() après REVOKE FROM PUBLIC, anon, authenticated. Le mécanisme de verrouillage lui-même est cassé.';
  END IF;
  IF has_function_privilege('authenticated', 'public.__test_default_privileges()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Le REVOKE explicite ne protège pas — authenticated peut encore exécuter public.__test_default_privileges() après REVOKE FROM PUBLIC, anon, authenticated. Le mécanisme de verrouillage lui-même est cassé.';
  END IF;
END $$;

DROP FUNCTION public.__test_default_privileges();

-- Vérification structurelle : interroge pg_proc directement pour TOUTES les
-- fonctions du schéma public, pas une liste tapée à la main — c'est ce qui a
-- fait rater handle_free_order_quota la première fois. Toute fonction non
-- exemptée qui reste exécutable par anon/authenticated fait échouer la
-- migration, en la nommant.
--
-- has_function_privilege reçoit p.oid directement (pas la signature texte) :
-- la résolution par chaîne dépend du search_path de la session et peut faire
-- échouer la migration pour une raison sans rapport avec son objet. p.oid
-- est déjà disponible dans le curseur, aucune résolution par nom nécessaire.
--
-- prokind = 'f' exclut procédures/agrégats/window functions (hors sujet ici),
-- et le NOT EXISTS sur pg_depend (deptype='e') exclut toute fonction
-- appartenant à une extension installée dans public — une extension future
-- ne doit pas faire échouer cette vérification, ses fonctions ont leur
-- propre modèle de privilèges et ne sont pas concernées par ce nettoyage.
DO $$
DECLARE
  exempt text[] := ARRAY[
    'get_my_shop_id()',
    'get_my_role()',
    'get_my_managed_country()'
  ];
  fn record;
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
    IF fn.signature = ANY(exempt) THEN
      CONTINUE;
    END IF;
    IF has_function_privilege('anon', fn.oid, 'EXECUTE') THEN
      RAISE EXCEPTION '% reste exécutable par anon après cette migration — schéma non conforme', fn.signature;
    END IF;
    IF has_function_privilege('authenticated', fn.oid, 'EXECUTE') THEN
      RAISE EXCEPTION '% reste exécutable par authenticated après cette migration — schéma non conforme', fn.signature;
    END IF;
  END LOOP;
END $$;

-- Vérification ciblée : les 10 fonctions dont un chemin applicatif réel
-- dépend doivent avoir gardé EXECUTE pour service_role. Colonne nommée
-- explicitement (signature) — pas de fn.column1 implicite.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT * FROM (VALUES
      ('decrement_product_stock(uuid, uuid, integer)'),
      ('increment_product_stock(uuid, uuid, integer)'),
      ('decrement_variant_stock(uuid, uuid, text, integer)'),
      ('increment_variant_stock(uuid, uuid, text, integer)'),
      ('upsert_client_from_order(uuid, text, text, text, text, text)'),
      ('reserve_promo_code(text, uuid)'),
      ('release_promo_code(uuid)'),
      ('expire_pending_orders()'),
      ('purge_draft_shops()'),
      ('increment_shop_visit(uuid)')
    ) AS t(signature)
  LOOP
    IF NOT has_function_privilege('service_role', fn.signature, 'EXECUTE') THEN
      RAISE EXCEPTION '% n''est plus exécutable par service_role — un chemin légitime (api/orders, cron, shop-visit) est cassé', fn.signature;
    END IF;
  END LOOP;
END $$;

COMMIT;
