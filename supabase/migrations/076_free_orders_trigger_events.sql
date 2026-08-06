-- Ajoute la pose des événements de mesure (§11) directement dans le trigger,
-- puisque les décisions (rang de la commande, passage à expired) s'y prennent
-- déjà sous verrou. CREATE OR REPLACE : le trigger trg_free_order_quota créé en
-- 073 pointe déjà vers cette fonction, pas besoin de le recréer.

CREATE OR REPLACE FUNCTION handle_free_order_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used         INTEGER;
  v_status       TEXT;
  v_quota        INTEGER;
  v_started_at   TIMESTAMPTZ;
BEGIN
  UPDATE shops
     SET free_orders_used = free_orders_used + 1
   WHERE id = NEW.shop_id
     AND trial_model = 'free_orders'
     AND status IN ('trial', 'expired')
  RETURNING free_orders_used, status, free_orders_quota, trial_started_at
    INTO v_used, v_status, v_quota, v_started_at;

  IF NOT FOUND THEN
    RETURN NEW; -- legacy, draft, ou boutique active (payante) : commandes non comptées/illimitées
  END IF;

  INSERT INTO shop_events (shop_id, event_name, metadata)
  VALUES (NEW.shop_id, 'free_order_used', jsonb_build_object('rank', v_used, 'quota', v_quota));

  IF v_used = 1 THEN
    INSERT INTO shop_events (shop_id, event_name, metadata)
    VALUES (NEW.shop_id, 'first_order_received', jsonb_build_object(
      'hours_since_published',
      CASE WHEN v_started_at IS NULL THEN NULL
           ELSE round(EXTRACT(EPOCH FROM (now() - v_started_at)) / 3600, 1) END
    ));
  END IF;

  IF v_used = v_quota - 1 THEN
    INSERT INTO shop_events (shop_id, event_name, metadata)
    VALUES (NEW.shop_id, 'quota_warning_shown', jsonb_build_object('rank', v_used, 'quota', v_quota));
  END IF;

  IF v_used > v_quota OR v_status = 'expired' THEN
    NEW.is_held := true;
    INSERT INTO shop_events (shop_id, event_name, metadata)
    VALUES (NEW.shop_id, 'order_held', jsonb_build_object('order_total', NEW.total_price));
  END IF;

  IF v_used >= v_quota AND v_status = 'trial' THEN
    UPDATE shops SET status = 'expired' WHERE id = NEW.shop_id;
    INSERT INTO shop_events (shop_id, event_name, metadata)
    VALUES (NEW.shop_id, 'trial_expired', jsonb_build_object('motif', 'quota', 'used', v_used));
  END IF;

  RETURN NEW;
END;
$$;
