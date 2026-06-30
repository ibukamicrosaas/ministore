-- Migration 053 : Restreindre l'accès à digital_file_path via les rôles anon/authenticated
--
-- Contexte : la politique products_public_read permet SELECT sur TOUTES les colonnes
-- des produits actifs. digital_file_path (chemin Storage interne) ne doit jamais
-- être lisible par des requêtes directes à l'API Supabase (clé anon ou JWT).
-- Le service_role (createAdminClient) conserve un accès complet.
--
-- Après cette migration, une requête directe type :
--   GET /rest/v1/products?select=digital_file_path
-- retournera une erreur de permission, même avec un JWT valide.

REVOKE SELECT (digital_file_path) ON products FROM anon;
REVOKE SELECT (digital_file_path) ON products FROM authenticated;
