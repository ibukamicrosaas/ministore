-- Contrôle après 091_release_orphaned_stock_reservations.sql : aucun produit
-- ne doit plus afficher un stock à 0 ou négatif qui redeviendrait positif si
-- des commandes en ligne mortes (cancelled) le libéraient. Rejouable à la
-- demande — si des commandes expirent/sont annulées après le lot de
-- correction sur expire_pending_orders()/cancelOrder, ce script doit rester
-- vide en continu.
--
--   supabase db query -f scripts/check-stock-not-orphaned.sql --linked

DO $$
DECLARE
  v_blocked RECORD;
  v_count   INTEGER := 0;
BEGIN
  FOR v_blocked IN
    SELECT p.id, p.name, p.shop_id, p.stock_count AS current_stock,
           SUM(oi.quantity)::INTEGER AS locked_qty
    FROM order_items oi
    JOIN orders   o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status = 'cancelled'
      AND o.payment_type IN ('online_full', 'online_deposit')
      AND oi.variant_label IS NULL
      AND p.stock_count IS NOT NULL
    GROUP BY p.id, p.name, p.shop_id, p.stock_count
    HAVING p.stock_count <= 0 AND p.stock_count + SUM(oi.quantity) > 0
  LOOP
    v_count := v_count + 1;
    RAISE WARNING 'Produit % (%) — boutique % — stock affiché %, % unités mortes encore comptées dedans',
      v_blocked.name, v_blocked.id, v_blocked.shop_id, v_blocked.current_stock, v_blocked.locked_qty;
  END LOOP;

  IF v_count > 0 THEN
    RAISE EXCEPTION '% produit(s) encore faussement en rupture à cause de réservations mortes.', v_count;
  END IF;

  RAISE NOTICE 'OK — aucun produit à stock simple faussement en rupture.';
END $$;
