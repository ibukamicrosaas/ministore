-- ============================================================
-- MINISTORE — Reversements (payouts)
-- Migration 008
-- ============================================================

CREATE TABLE IF NOT EXISTS payouts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id              UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  gross_amount         INTEGER NOT NULL CHECK (gross_amount > 0),
  commission_amount    INTEGER NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  net_amount           INTEGER NOT NULL CHECK (net_amount >= 0),
  payout_method        TEXT NOT NULL CHECK (payout_method IN ('wave', 'orange_money')),
  payout_number        TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','processing','completed','failed')),
  bictorys_transfer_id TEXT,
  notes                TEXT,
  requested_at         TIMESTAMPTZ DEFAULT NOW(),
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_shop_id ON payouts(shop_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status  ON payouts(status);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payouts_owner_read" ON payouts
  FOR SELECT USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

CREATE TRIGGER payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
