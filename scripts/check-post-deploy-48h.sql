-- Les quatre points à surveiller pendant les 48 premières heures après le
-- déploiement de la Livraison 1 (main <- dev, 2026-08-13). Préparées et
-- testées à blanc avant le déploiement (toutes retournent 0 ligne alors,
-- c'est attendu — aucune boutique free_orders réelle n'existe encore).
-- Ne pas improviser ces requêtes le jour J : les relancer telles quelles.

-- A. Boutique free_orders invisible malgré un produit publié — anomalie de
--    synchronisation is_active/status (shop-status.ts ne devrait jamais
--    produire ça : is_active=false uniquement pour status='draft').
select s.id, s.name, s.slug, s.status, s.is_active
from shops s
where s.trial_model = 'free_orders'
  and s.status != 'draft'
  and s.is_active = false
  and exists (select 1 from products p where p.shop_id = s.id and p.is_active = true);

-- B. Boutique legacy portant une trace d'activité free_orders — ne devrait
--    jamais arriver, le seul point d'incrément de free_orders_used est gardé
--    par trial_model='free_orders' (api/orders/route.ts:417).
select id, name, slug, trial_model, free_orders_used, free_orders_quota
from shops
where trial_model = 'legacy' and free_orders_used > 0;

-- C. Commandes retenues actuelles — liste de candidats à vérifier écran par
--    écran (dashboard/orders, dashboard/orders/[id], tableau de bord
--    d'accueil) : les coordonnées client doivent rester masquées tant que
--    is_held=true et released_at IS NULL (AI_RULES.md §4). Une requête SQL
--    ne peut pas prouver l'absence d'exposition à elle seule — seulement
--    lister quoi vérifier à l'écran.
select o.id, o.shop_id, s.name as shop_name, o.is_held, o.released_at, o.created_at
from orders o
join shops s on s.id = o.shop_id
where o.is_held = true and o.released_at is null
order by o.created_at desc;

-- D. Reversements bloqués en processing depuis plus d'une heure. Marche à
--    suivre exacte, extraite de src/lib/actions/payouts.ts (déjà en
--    production, jamais réécrite ici) :
--    1. Chercher le virement chez Bictorys avec l'idempotency-key = id du
--       payout (dashboard ou support Bictorys).
--    2. Si confirmé effectué :
--       UPDATE payouts SET status='completed', bictorys_transfer_id=<réf>,
--       completed_at=now() WHERE id=<id>;
--    3. Si absent chez Bictorys ET refus explicite déjà connu (payouts.ts
--       ligne ~228) :
--       UPDATE payouts SET status='failed', updated_at=now() WHERE id=<id>;
--       — autorise un nouveau reversement pour cette boutique.
--    4. Si aucune réponse de Bictorys n'a jamais été reçue (timeout/réseau,
--       payouts.ts ligne ~194) : ne rien conclure seul, contacter le support
--       Bictorys avant toute action — le virement peut être en cours.
--    5. Ne jamais relancer processPayout pour ce payoutId tant que 1-4
--       n'ont pas tranché : le garde-fou d'idempotence traite 'processing'
--       comme "déjà en cours", à dessein.
select id, shop_id, net_amount, payout_method, payout_number, status, updated_at,
  now() - updated_at as bloque_depuis
from payouts
where status = 'processing' and updated_at < now() - interval '1 hour'
order by updated_at asc;
