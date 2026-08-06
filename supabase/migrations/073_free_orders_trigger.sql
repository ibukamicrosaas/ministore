-- Compteur atomique des commandes offertes. Une seule instruction verrouillée
-- porte à la fois l'incrément et la lecture de status/quota (RETURNING sous le
-- verrou de ligne pris par l'UPDATE) : aucune lecture séparée non verrouillée,
-- donc aucune fenêtre de course possible entre deux commandes simultanées sur
-- la même boutique.

CREATE OR REPLACE FUNCTION handle_free_order_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used   INTEGER;
  v_status TEXT;
  v_quota  INTEGER;
BEGIN
  UPDATE shops
     SET free_orders_used = free_orders_used + 1
   WHERE id = NEW.shop_id
     AND trial_model = 'free_orders'
     AND status IN ('trial', 'expired')
  RETURNING free_orders_used, status, free_orders_quota
    INTO v_used, v_status, v_quota;

  IF NOT FOUND THEN
    RETURN NEW; -- legacy, draft, ou boutique active (payante) : commandes non comptées/illimitées
  END IF;

  IF v_used > v_quota OR v_status = 'expired' THEN
    NEW.is_held := true;
  END IF;

  IF v_used >= v_quota AND v_status = 'trial' THEN
    UPDATE shops SET status = 'expired' WHERE id = NEW.shop_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_free_order_quota
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_free_order_quota();
