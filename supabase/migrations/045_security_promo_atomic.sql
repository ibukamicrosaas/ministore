-- Migration 045 : réservation atomique des codes promo
-- Remplace le pattern SELECT-then-UPDATE (race condition) par un UPDATE atomique.
-- La fonction tente d'incrémenter en une seule transaction SQL ; si les conditions
-- ne sont plus remplies au moment de l'UPDATE (code épuisé, expiré, inactif),
-- elle retourne aucune ligne → le code n'est pas accordé.

CREATE OR REPLACE FUNCTION reserve_promo_code(
  p_code    TEXT,
  p_shop_id UUID
)
RETURNS TABLE(promo_id UUID, discount_pct INT) AS $$
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE UPPER(code)   = UPPER(p_code)
    AND shop_id       = p_shop_id
    AND is_active     = true
    AND (expires_at   IS NULL OR expires_at > now())
    AND (max_uses     IS NULL OR used_count < max_uses)
  RETURNING id, discount_pct;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;

-- Fonction de libération si la commande échoue après la réservation
CREATE OR REPLACE FUNCTION release_promo_code(p_promo_id UUID)
RETURNS VOID AS $$
  UPDATE promo_codes
  SET used_count = GREATEST(0, used_count - 1)
  WHERE id = p_promo_id;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;
