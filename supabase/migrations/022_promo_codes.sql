-- Codes promo pour les boutiques marchandes
CREATE TABLE IF NOT EXISTS promo_codes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code         TEXT        NOT NULL,
  discount_pct INTEGER     NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  max_uses     INTEGER     NULL,         -- NULL = illimité
  used_count   INTEGER     NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NULL,         -- NULL = pas d'expiration
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un code est unique par boutique (insensible à la casse)
  UNIQUE (shop_id, LOWER(code))
);

-- Index pour les lookups rapides à la validation commande
CREATE INDEX IF NOT EXISTS promo_codes_shop_code_idx
  ON promo_codes (shop_id, LOWER(code))
  WHERE is_active = TRUE;

-- RLS : chaque propriétaire ne voit que ses codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their promo codes" ON promo_codes
  USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

COMMENT ON TABLE promo_codes IS 'Codes de réduction créés par les marchands pour leurs clients';

-- Incrémente atomiquement le compteur d'utilisations d'un code promo
CREATE OR REPLACE FUNCTION increment_promo_used_count(p_promo_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE id = p_promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
