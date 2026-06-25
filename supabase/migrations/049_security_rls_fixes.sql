-- 049_security_rls_fixes.sql
-- Suppression des politiques RLS trop permissives sur orders et order_items.
--
-- Problèmes corrigés :
--  CRIT-2 / HIGH-4 — "orders_token_read"   : USING (client_token IS NOT NULL) exposait
--                     TOUTES les commandes (tous les orders ont un client_token).
--  CRIT-2          — "orders_delivery_token_read" : USING (true) exposait TOUTES les commandes.
--  HIGH-4          — "orders_public_insert" : WITH CHECK (true) permettait à n'importe qui
--                     d'insérer des commandes directement via le client Supabase.
--  HIGH-4          — "order_items_public_insert" : idem pour les lignes de commande.
--
-- Impact : aucun. Toutes les opérations sur orders/order_items passent par des routes API
-- qui utilisent createAdminClient() (service_role), lequel contourne le RLS.
-- Les marchands authentifiés continuent à lire leurs commandes via "orders_owner_all".

DROP POLICY IF EXISTS "orders_token_read"          ON orders;
DROP POLICY IF EXISTS "orders_delivery_token_read"  ON orders;
DROP POLICY IF EXISTS "orders_public_insert"        ON orders;
DROP POLICY IF EXISTS "order_items_public_insert"   ON order_items;
