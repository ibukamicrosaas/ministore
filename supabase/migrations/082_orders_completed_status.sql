-- Bug trouvé hors périmètre (chantier "argent des commandes retenues") : le
-- code applicatif écrit orders.status='completed' à plusieurs endroits
-- (webhooks Bictorys/Stripe et resend-digital, pour marquer un accès
-- numérique envoyé), mais la contrainte CHECK sur orders.status ne l'a
-- jamais autorisé. Ces écritures échouent silencieusement depuis la mise en
-- place des produits digitaux (migration 048) — 0 commande 'completed' en
-- base malgré la fonctionnalité en production. Les fichiers sont bien
-- livrés (download_tokens ne dépend pas de orders.status), mais le statut
-- affiché au marchand reste bloqué à "Paiement reçu" au lieu de
-- "Accès envoyé".

ALTER TABLE orders DROP CONSTRAINT orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled','completed'));
