-- Verrouillage d'urgence : activate_free_orders_shop est SECURITY DEFINER et
-- exécutable aujourd'hui par anon et authenticated — n'importe qui, avec la
-- clé publique du site, peut activer gratuitement n'importe quelle boutique
-- (libère aussi les commandes retenues et les fonds correspondants).
-- Seul appelant légitime : src/lib/billing/shop-status.ts:43, via le client
-- admin (service_role) — non affecté par ce REVOKE.
--
-- REVOKE explicite sur PUBLIC en plus de anon/authenticated : à la création,
-- Postgres accorde EXECUTE à PUBLIC, dont anon hérite. Un REVOKE qui ne cible
-- que anon/authenticated laisserait la fonction ouverte via cet héritage,
-- migration verte, trou toujours béant.

REVOKE EXECUTE ON FUNCTION activate_free_orders_shop(uuid)
  FROM PUBLIC, anon, authenticated;

-- Le REVOKE sur PUBLIC retire aussi le droit à service_role s'il ne le tenait
-- que par héritage de PUBLIC — sans ce GRANT explicite, shop-status.ts:43
-- cesserait de fonctionner en production. Restauré nommément, pas supposé acquis.
GRANT EXECUTE ON FUNCTION activate_free_orders_shop(uuid) TO service_role;

-- Vérification immédiate, pas une confiance aveugle dans l'absence d'erreur :
-- la migration échoue bruyamment si le retrait n'a pas pris, ET si le chemin
-- légitime (service_role) a été cassé au passage.
DO $$
BEGIN
  IF has_function_privilege('anon', 'activate_free_orders_shop(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'activate_free_orders_shop reste exécutable par anon après REVOKE — migration incomplète';
  END IF;
  IF has_function_privilege('authenticated', 'activate_free_orders_shop(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'activate_free_orders_shop reste exécutable par authenticated après REVOKE — migration incomplète';
  END IF;
  IF NOT has_function_privilege('service_role', 'activate_free_orders_shop(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'activate_free_orders_shop n''est plus exécutable par service_role — le chemin légitime (shop-status.ts) est cassé';
  END IF;
END $$;
