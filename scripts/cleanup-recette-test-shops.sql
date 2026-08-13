-- Nettoyage des boutiques de test créées pendant la recette de la Livraison 1
-- sur la préversion dev (base de production partagée — voir REPRISE.md §19).
-- Préparé, NON EXÉCUTÉ. Ne jamais lancer la partie DELETE sans avoir d'abord
-- relu la liste produite par le SELECT.

-- 1. Remplacer la date ci-dessous par l'instant réel de début de la recette,
--    puis lister les candidats — rien ne s'exécute avant la relecture.
select id, name, slug, status, trial_model, created_at
from shops
where trial_model = 'free_orders'
  and created_at >= '2026-08-14T00:00:00+00'  -- <-- ajuster
order by created_at;

-- 2. Une fois la liste confirmée boutique par boutique (aucune n'est un vrai
--    marchand qui aurait, par coïncidence, utilisé /start pendant la même
--    fenêtre — improbable tant que le nouveau /start n'est visible que sur
--    la préversion dev, mais à vérifier, pas supposer) :
delete from shops
where trial_model = 'free_orders'
  and created_at >= '2026-08-14T00:00:00+00'  -- <-- même valeur qu'au point 1
  and id in (/* coller ici les id confirmés du point 1, jamais un DELETE non filtré par id */);

-- Ce qui est cascadé automatiquement (vérifié via information_schema avant
-- d'écrire ce fichier) : orders, products, clients, payments, payouts,
-- promo_codes, product_reviews, download_tokens, shop_events,
-- shop_notifications, shop_visits, stock_alerts, notification_logs,
-- push_subscriptions, ai_conversations, ai_chat_usage,
-- referral_commissions — tout disparaît avec la boutique.
--
-- Ce qui NE l'est PAS : profiles.shop_id passe à NULL (ON DELETE SET NULL)
-- — le compte auth du marchand de test SURVIT, juste détaché. Réutiliser le
-- même numéro de téléphone pour un nouveau passage de recette échouera
-- ("Un compte existe déjà avec ce numéro") tant que ce compte n'est pas
-- supprimé séparément via l'API Admin Supabase Auth (supabase.auth.admin.
-- deleteUser) — pas une opération SQL, hors périmètre de ce fichier.
