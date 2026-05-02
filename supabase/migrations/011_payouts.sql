-- Numéros mobile money pour les reversements
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS payout_wave_number TEXT,
  ADD COLUMN IF NOT EXISTS payout_om_number   TEXT;

-- Table des reversements vers les salons
CREATE TABLE IF NOT EXISTS payouts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  gross_amount          INTEGER NOT NULL CHECK (gross_amount > 0),
  commission_amount     INTEGER NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  net_amount            INTEGER NOT NULL CHECK (net_amount >= 0),
  payout_method         TEXT NOT NULL CHECK (payout_method IN ('wave', 'orange_money')),
  payout_number         TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  bictorys_transfer_id  TEXT,
  notes                 TEXT,
  requested_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payouts_salon_id_idx ON payouts(salon_id);
CREATE INDEX IF NOT EXISTS payouts_status_idx   ON payouts(status);

CREATE TRIGGER payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
