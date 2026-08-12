-- Libération unique du stock et — via orders.promo_id (090) — plus tard des
-- codes promo immobilisés par des commandes définitivement mortes
-- (cancelled) dont ni le paiement en ligne n'a abouti, ni la livraison n'a
-- eu lieu. Chiffré dans REPRISE.md, section « Paiements en ligne jamais
-- aboutis » (population en ligne) et son complément sur le paiement à la
-- livraison/sur place (population élargie le 2026-08-12).
--
-- NON IDEMPOTENTE. Appliquée deux fois, elle crédite deux fois le même
-- stock — rien dans ce fichier n'empêche une seconde exécution de rejouer
-- les mêmes incréments. La protection est entièrement externe : ne
-- l'exécuter que via le mécanisme qui l'enregistre dans l'historique de
-- migration (voir AI_RULES.md, section sur l'application des migrations —
-- ne jamais exécuter le SQL sans immédiatement enregistrer la version, ni
-- l'inverse). Avant toute exécution manuelle (`db query -f`), vérifier
-- qu'elle n'a pas déjà tourné :
--
--   SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '091';
--
-- Une ligne trouvée = déjà appliquée, ne pas rejouer.
--
-- ORDRE OBLIGATOIRE : cette migration doit être appliquée AVANT le lot qui
-- corrige la cause (restitution de stock/promo ajoutée à
-- expire_pending_orders() et cancelOrder()). Si la correction de cause est
-- déployée en premier, les commandes qui expirent/sont annulées entre les
-- deux seraient créditées deux fois : une fois par le correctif de cause au
-- moment de leur passage à cancelled, une seconde fois ici si leur
-- created_at reste sous le seuil ci-dessous. 091 d'abord, toujours.
--
-- Seuil figé au 2026-08-11T11:43:14.600036+00 — l'instant exact où la
-- population a été mesurée et vérifiée, pas une date postérieure. Une
-- commande qui passerait cancelled après cet instant n'est pas couverte par
-- cette migration — elle le sera par la correction de cause, une fois
-- déployée.
--
-- Portée élargie le 2026-08-12 : plus de restriction sur payment_type. Le
-- stock est décrémenté à la création quel que soit le mode de paiement, et
-- cancelOrder() ne le restitue jamais, en ligne ou non. Population mesurée
-- ce jour : 183 commandes en ligne + 99 commandes livraison/sur place
-- retenues (184 et 99 avant exclusions).
--
-- Deux exclusions :
-- 1. Paiement réellement encaissé (payments.status='completed') : le stock
--    a été consommé légitimement, même si la commande a ensuite été
--    annulée par le marchand — cf. le point ouvert sur le remboursement
--    dans REPRISE.md. 1 commande exclue à ce titre sur la population en
--    ligne (6d10e926-4acb-4c2e-8454-f5c423fb87aa, boutique de test) ; 0 sur
--    la population livraison/sur place (aucune ligne payments n'existe
--    jamais pour ces modes).
-- 2. delivered_at renseigné : la commande a été livrée avant d'être
--    annulée, donc probablement honorée et payée hors système même si
--    aucune ligne payments ne le trace (paiement à la livraison en
--    espèces). Aucune des 282 commandes de la population figée n'est dans
--    ce cas (vérifié), mais la règle est écrite plutôt que déduite d'un
--    état présent qui pourrait changer.
--
-- rollbackStock() ne peut pas avoir produit une des commandes ci-dessous :
-- dans src/app/api/orders/route.ts, la Phase 1 (réservation de stock, où
-- rollbackStock() peut se déclencher) se termine par un retour 409 AVANT
-- que la commande ne soit insérée (Phase 2 puis .insert() sur orders,
-- lignes ~336-349). Un rollback empêche la création de la ligne orders
-- elle-même — il ne peut donc pas exister de commande cancelled en base
-- qui ait aussi subi un rollbackStock() : les deux chemins sont
-- mutuellement exclusifs par construction du code, pas par une exclusion
-- ajoutée ici. Vaut pour les deux populations, en ligne comme non.
--
-- Sûr vis-à-vis de la survente : status='cancelled' est terminal dans
-- STATUS_TRANSITIONS (src/lib/actions/orders.ts) — aucune transition
-- sortante n'existe, donc aucune de ces commandes ne peut reprendre son
-- cours normal même si un paiement en ligne tardif venait à se compléter.
--
-- increment_product_stock/increment_variant_stock (021/054) n'ont pas
-- besoin d'exclusion explicite pour les produits supprimés ou à stock
-- illimité : leurs propres clauses WHERE les no-opent déjà silencieusement,
-- exactement comme le fait rollbackStock() aujourd'hui.
--
-- Limite connue, mesurée séparément (non couverte par le contrôle
-- automatique après coup) : trou variantes non comblé dans
-- check-stock-not-orphaned.sql (stock simple uniquement). Sur la
-- population en ligne : 10 variantes / 3 boutiques / 14 unités, aucune
-- actuellement bloquante. La population livraison/sur place n'a pas été
-- re-mesurée séparément sur ce point.
--
-- Aucune fonction créée ici (uniquement un bloc DO anonyme) : la règle
-- REVOKE EXECUTE / GRANT de AI_RULES.md §3 ne s'applique pas.

BEGIN;

DO $$
DECLARE
  v_cutoff             TIMESTAMPTZ := '2026-08-11T11:43:14.600036+00';
  v_item               RECORD;
  v_before             RECORD;
  v_after_stock        INTEGER;
  v_lines_processed    INTEGER := 0;
  v_orders_en_ligne    INTEGER;
  v_orders_livraison   INTEGER;
BEGIN
  -- Snapshot du "avant" pour les produits à stock simple concernés, afin de
  -- pouvoir rapporter un delta réel en unités (pas seulement un nombre de
  -- lignes traitées, qui ne prouve rien si la RPC a no-opé).
  CREATE TEMP TABLE _stock_before AS
  SELECT DISTINCT oi.product_id, p.name, p.stock_count AS before_stock
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status = 'cancelled'
    AND o.created_at < v_cutoff
    AND o.delivered_at IS NULL
    AND oi.variant_label IS NULL
    AND p.stock_count IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM payments pay WHERE pay.order_id = o.id AND pay.status = 'completed');

  FOR v_item IN
    SELECT oi.product_id, oi.variant_label, SUM(oi.quantity)::INTEGER AS qty, o.shop_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'cancelled'
      AND o.created_at < v_cutoff
      AND o.delivered_at IS NULL
      AND oi.product_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM payments pay WHERE pay.order_id = o.id AND pay.status = 'completed')
    GROUP BY oi.product_id, oi.variant_label, o.shop_id
  LOOP
    IF v_item.variant_label IS NOT NULL THEN
      PERFORM increment_variant_stock(v_item.product_id, v_item.shop_id, v_item.variant_label, v_item.qty);
    ELSE
      PERFORM increment_product_stock(v_item.product_id, v_item.shop_id, v_item.qty);
    END IF;
    v_lines_processed := v_lines_processed + 1;
  END LOOP;

  SELECT
    count(*) FILTER (WHERE payment_type IN ('online_full', 'online_deposit')),
    count(*) FILTER (WHERE payment_type NOT IN ('online_full', 'online_deposit'))
    INTO v_orders_en_ligne, v_orders_livraison
  FROM orders o
  WHERE o.status = 'cancelled'
    AND o.created_at < v_cutoff
    AND o.delivered_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM payments pay WHERE pay.order_id = o.id AND pay.status = 'completed');

  RAISE NOTICE 'Stock libéré — % commande(s) en ligne, % commande(s) livraison/sur place, % ligne(s) produit/variante traitées au total.',
    v_orders_en_ligne, v_orders_livraison, v_lines_processed;

  -- Delta réel, nommé, pour chaque produit à stock simple concerné —
  -- preuve que le stock a effectivement bougé, pas seulement qu'une ligne a
  -- été "traitée".
  FOR v_before IN SELECT * FROM _stock_before ORDER BY name LOOP
    SELECT stock_count INTO v_after_stock FROM products WHERE id = v_before.product_id;
    RAISE NOTICE '  % : % -> %', v_before.name, v_before.before_stock, v_after_stock;
  END LOOP;

  DROP TABLE _stock_before;
END $$;

COMMIT;
