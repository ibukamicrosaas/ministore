-- Corrige upsert_client_from_order() : la clause INSERT ne fixait jamais
-- total_orders/last_order_at, laissant la colonne à son défaut (0) pour la
-- toute première commande d'un client — l'incrément ne se déclenchait qu'à
-- partir de la 2e commande (branche ON CONFLICT). Bug général, invisible sur
-- une boutique à clients récurrents, systématique sur une boutique à achat
-- unique (ex. ebook) : 100% des acheteurs restaient affichés à "0 commande".

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
  INSERT INTO clients (shop_id, first_name, last_name, phone, whatsapp, email, total_orders, last_order_at)
  VALUES (p_shop_id, p_first_name, p_last_name, p_phone, p_whatsapp, p_email, 1, NOW())
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
