-- Règle explicite : is_active=false l'emporte toujours, quel que soit status.
-- Une boutique avec is_active=false n'est jamais publique et n'accepte aucune
-- commande, pour les deux modèles.
--
-- Pour trial_model='legacy', ceci ne change RIEN au comportement existant :
-- shops_public_read gardait déjà (et garde) l'échappatoire `OR plan <> 'trial'`
-- (migration 055 — boutique payante dont l'abonnement vient d'expirer, on
-- évite un 404 brutal, comportement intentionnel, non touché).
--
-- Pour trial_model='free_orders', il n'existe PAS d'échappatoire équivalente :
-- is_active=true est une condition stricte, jamais contournée par le statut.
-- Un admin qui coupe is_active sur une boutique free_orders la masque donc
-- vraiment, même si status dit encore 'trial'/'expired'/'active'.

DROP POLICY IF EXISTS "shops_public_read" ON shops;

CREATE POLICY "shops_public_read" ON shops
  FOR SELECT USING (
    (trial_model = 'legacy'      AND (is_active = true OR plan <> 'trial'))
    OR (trial_model = 'free_orders' AND is_active = true AND status <> 'draft')
    OR id = get_my_shop_id()
  );

COMMENT ON COLUMN shops.is_active IS
  'Interrupteur de sécurité absolu : is_active=false rend la boutique
   invisible et ferme la prise de commande, quel que soit shops.status.
   Pour trial_model=''legacy'', une échappatoire existe (is_active=false ET
   plan<>''trial'' reste visible — abonnement payant tout juste expiré,
   migration 055, comportement historique intentionnel). Pour
   trial_model=''free_orders'', aucune échappatoire : is_active=true est
   requis dans tous les cas pour que la boutique soit publique.';

-- Défense en profondeur : même verrouillage côté trigger (au cas où une
-- commande serait insérée par un chemin qui ne passe pas par /api/orders,
-- qui filtre déjà is_active=true avant tout insert).
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
     AND is_active = true
     AND status IN ('trial', 'expired')
  RETURNING free_orders_used, status, free_orders_quota, trial_started_at
    INTO v_used, v_status, v_quota, v_started_at;

  IF NOT FOUND THEN
    RETURN NEW; -- legacy, draft, boutique masquée (is_active=false), ou active (payante)
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
