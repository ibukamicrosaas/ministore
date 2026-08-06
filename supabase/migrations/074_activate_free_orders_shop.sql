-- Active une boutique free_orders et libère ses commandes retenues dans une
-- seule transaction. Appelée en RPC par setShopStatus (jamais directement en
-- update JS depuis l'app) pour garantir qu'on n'obtient jamais une boutique
-- active dont les commandes restent retenues si une étape intermédiaire échoue.
--
-- Idempotente : un second appel ne trouve plus de commande à libérer
-- (released_at déjà posé) et retourne 0/0 sans rien casser.

CREATE OR REPLACE FUNCTION activate_free_orders_shop(p_shop_id UUID)
RETURNS TABLE(released_count INTEGER, released_total INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shops
     SET status = 'active', is_active = true
   WHERE id = p_shop_id AND trial_model = 'free_orders';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop % introuvable ou pas en trial_model=free_orders', p_shop_id;
  END IF;

  RETURN QUERY
  WITH released AS (
    UPDATE orders
       SET is_held = false, released_at = now()
     WHERE shop_id = p_shop_id
       AND is_held = true
       AND released_at IS NULL
    RETURNING total_price
  )
  SELECT COUNT(*)::INTEGER, COALESCE(SUM(total_price), 0)::INTEGER FROM released;
END;
$$;
