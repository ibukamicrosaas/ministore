-- ─────────────────────────────────────────────────────────────────────────────
-- 062 : Reversements Country Managers
-- ─────────────────────────────────────────────────────────────────────────────

-- Ajoute la date de début de licence au country manager.
-- Tous les abonnements activés à partir de cette date lui appartiennent.
ALTER TABLE country_managers
  ADD COLUMN IF NOT EXISTS license_start_at TIMESTAMPTZ;

-- Pour les CMs existants : la licence démarre à la date de création.
UPDATE country_managers
  SET license_start_at = created_at
  WHERE license_start_at IS NULL;

ALTER TABLE country_managers
  ALTER COLUMN license_start_at SET DEFAULT now(),
  ALTER COLUMN license_start_at SET NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table des demandes de reversement Country Manager
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS country_manager_payouts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_manager_id   UUID        NOT NULL REFERENCES country_managers(id) ON DELETE CASCADE,
  country              TEXT        NOT NULL,
  amount               INTEGER     NOT NULL CHECK (amount > 0),
  mobile_money_number  TEXT        NOT NULL,
  provider             TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'paid', 'rejected')),
  requested_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at              TIMESTAMPTZ,
  admin_reference      TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cm_payouts_cm_id  ON country_manager_payouts(country_manager_id);
CREATE INDEX IF NOT EXISTS idx_cm_payouts_status ON country_manager_payouts(status);

ALTER TABLE country_manager_payouts ENABLE ROW LEVEL SECURITY;

-- Aucun accès public — tout passe par service_role (createAdminClient)
CREATE POLICY "cm_payouts_no_public_access" ON country_manager_payouts
  FOR ALL USING (false);

CREATE TRIGGER cm_payouts_updated_at
  BEFORE UPDATE ON country_manager_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE country_manager_payouts IS
  'Demandes de reversement des Country Managers TEKKIShop.';
COMMENT ON COLUMN country_managers.license_start_at IS
  'Date de début de la licence. Seuls les abonnements activés après cette date entrent dans le calcul du solde.';
