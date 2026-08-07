-- Additif "argent des commandes retenues", chemin A : à l'activation, débloquer
-- les fonds des commandes digitales retenues et payées en même temps que les
-- commandes elles-mêmes, dans la même transaction. released_funds_gross est le
-- montant brut (avant commission TekkiShop) — la conversion en net se fait
-- côté application, avec le même taux que le reste de la page Revenus.

DROP FUNCTION IF EXISTS activate_free_orders_shop(UUID);

CREATE FUNCTION activate_free_orders_shop(p_shop_id UUID)
RETURNS TABLE(released_count INTEGER, released_total INTEGER, released_funds_gross INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_total INTEGER;
  v_funds INTEGER;
  v_ids   UUID[];
BEGIN
  UPDATE shops
     SET status = 'active', is_active = true
   WHERE id = p_shop_id AND trial_model = 'free_orders';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop % introuvable ou pas en trial_model=free_orders', p_shop_id;
  END IF;

  WITH released AS (
    UPDATE orders
       SET is_held = false, released_at = now()
     WHERE shop_id = p_shop_id
       AND is_held = true
       AND released_at IS NULL
    RETURNING id, total_price
  )
  SELECT COUNT(*)::INTEGER, COALESCE(SUM(total_price), 0)::INTEGER, COALESCE(array_agg(id), ARRAY[]::UUID[])
    INTO v_count, v_total, v_ids
    FROM released;

  -- Fonds déjà encaissés en ligne sur ces commandes précises (paiement digital
  -- retenu) — débloqués pour le retrait dès maintenant, dans la même transaction.
  SELECT COALESCE(SUM(p.amount), 0)::INTEGER INTO v_funds
    FROM payments p
   WHERE p.order_id = ANY(v_ids)
     AND p.status = 'completed';

  IF v_count > 0 THEN
    INSERT INTO shop_events (shop_id, event_name, metadata)
    VALUES (p_shop_id, 'order_released', jsonb_build_object('count', v_count, 'total', v_total, 'funds_gross', v_funds));
  END IF;

  RETURN QUERY SELECT v_count, v_total, v_funds;
END;
$$;
