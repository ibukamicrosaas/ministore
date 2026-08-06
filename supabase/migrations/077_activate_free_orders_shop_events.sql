-- Ajoute la pose de l'événement order_released dans la même transaction que la
-- libération elle-même (§11). plan_activated est posé côté TypeScript par
-- setShopStatus, qui connaît le motif d'entrée (status avant transition) que
-- cette fonction SQL n'a pas.

CREATE OR REPLACE FUNCTION activate_free_orders_shop(p_shop_id UUID)
RETURNS TABLE(released_count INTEGER, released_total INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_total INTEGER;
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
    RETURNING total_price
  )
  SELECT COUNT(*)::INTEGER, COALESCE(SUM(total_price), 0)::INTEGER
    INTO v_count, v_total
    FROM released;

  IF v_count > 0 THEN
    INSERT INTO shop_events (shop_id, event_name, metadata)
    VALUES (p_shop_id, 'order_released', jsonb_build_object('count', v_count, 'total', v_total));
  END IF;

  RETURN QUERY SELECT v_count, v_total;
END;
$$;
