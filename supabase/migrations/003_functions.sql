-- ============================================================
-- MINISTORE — Fonctions utilitaires PostgreSQL
-- Migration 003
-- ============================================================

-- ============================================================
-- Trigger : création automatique du profil après signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Expirer les commandes pending de plus de 30 min sans paiement
-- ============================================================
CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE orders
  SET
    status              = 'cancelled',
    cancellation_reason = 'expired',
    updated_at          = NOW()
  WHERE
    status       = 'pending'
    AND deposit_paid = false
    AND payment_type IN ('online_full', 'online_deposit')
    AND created_at < NOW() - INTERVAL '30 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Upsert client lors d'une commande
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_client_from_order(
  p_shop_id    UUID,
  p_first_name TEXT,
  p_last_name  TEXT,
  p_phone      TEXT,
  p_whatsapp   TEXT,
  p_email      TEXT
)
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
BEGIN
  INSERT INTO clients (shop_id, first_name, last_name, phone, whatsapp, email)
  VALUES (p_shop_id, p_first_name, p_last_name, p_phone, p_whatsapp, p_email)
  ON CONFLICT (shop_id, phone) DO UPDATE SET
    first_name    = EXCLUDED.first_name,
    last_name     = COALESCE(EXCLUDED.last_name, clients.last_name),
    whatsapp      = COALESCE(EXCLUDED.whatsapp, clients.whatsapp),
    email         = COALESCE(EXCLUDED.email, clients.email),
    total_orders  = clients.total_orders + 1,
    last_order_at = NOW(),
    updated_at    = NOW()
  RETURNING id INTO v_client_id;

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

