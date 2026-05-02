-- ============================================================
-- BEAUTYDESK — Schéma initial Supabase PostgreSQL
-- Migration 001
-- ============================================================

-- 1. SALONS
CREATE TABLE salons (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  logo_url              TEXT,
  primary_color         TEXT DEFAULT '#E85D04',
  address               TEXT,
  city                  TEXT NOT NULL,
  country               TEXT DEFAULT 'SN',
  phone_whatsapp        TEXT NOT NULL,
  email                 TEXT,
  opening_hours         JSONB DEFAULT '{}',
  deposit_percentage    INTEGER DEFAULT 50 CHECK (deposit_percentage BETWEEN 0 AND 100),
  cancellation_hours    INTEGER DEFAULT 24,
  cancellation_refund   BOOLEAN DEFAULT true,
  plan                  TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'multi')),
  trial_ends_at         TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  stripe_customer_id    TEXT,
  moneroo_api_key       TEXT,
  stripe_account_id     TEXT,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILS UTILISATEURS (étend auth.users)
CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id              UUID REFERENCES salons(id),
  role                  TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  first_name            TEXT,
  last_name             TEXT,
  phone                 TEXT,
  whatsapp              TEXT,
  avatar_url            TEXT,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMPLOYÉES
CREATE TABLE staff (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES profiles(id),
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  phone                 TEXT,
  whatsapp              TEXT,
  photo_url             TEXT,
  remuneration_type     TEXT NOT NULL DEFAULT 'commission' CHECK (remuneration_type IN ('commission', 'fixed_salary')),
  commission_rate       DECIMAL(5,2) CHECK (commission_rate BETWEEN 0 AND 100),
  fixed_salary          INTEGER CHECK (fixed_salary >= 0),
  specialties           TEXT[],
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICES / PRESTATIONS
CREATE TABLE services (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  duration_minutes      INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  price                 INTEGER NOT NULL CHECK (price >= 0),
  photo_url             TEXT,
  category              TEXT,
  staff_ids             UUID[],
  is_active             BOOLEAN DEFAULT true,
  display_order         INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLIENTS
CREATE TABLE clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  first_name            TEXT NOT NULL,
  last_name             TEXT,
  phone                 TEXT NOT NULL,
  whatsapp              TEXT,
  email                 TEXT,
  notes                 TEXT,
  total_visits          INTEGER DEFAULT 0,
  total_spent           INTEGER DEFAULT 0,
  last_visit_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, phone)
);

-- 6. RÉSERVATIONS
CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id             UUID REFERENCES clients(id),
  service_id            UUID NOT NULL REFERENCES services(id),
  staff_id              UUID REFERENCES staff(id),
  booking_date          DATE NOT NULL,
  booking_time          TIME NOT NULL,
  duration_minutes      INTEGER NOT NULL,
  total_price           INTEGER NOT NULL CHECK (total_price >= 0),
  deposit_amount        INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  deposit_paid          BOOLEAN DEFAULT false,
  remaining_amount      INTEGER GENERATED ALWAYS AS (total_price - deposit_amount) STORED,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'present', 'completed', 'cancelled', 'no_show')),
  cancellation_reason   TEXT,
  cancelled_by          TEXT CHECK (cancelled_by IN ('client', 'salon')),
  refund_amount         INTEGER DEFAULT 0,
  refund_status         TEXT CHECK (refund_status IN ('pending', 'processed')),
  notes                 TEXT,
  internal_notes        TEXT,
  client_token          TEXT UNIQUE,
  reminder_sent_at      TIMESTAMPTZ,
  confirmation_sent_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAIEMENTS
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  salon_id              UUID NOT NULL REFERENCES salons(id),
  amount                INTEGER NOT NULL CHECK (amount > 0),
  currency              TEXT DEFAULT 'XOF',
  payment_method        TEXT NOT NULL CHECK (payment_method IN ('moneroo', 'stripe', 'cash')),
  payment_type          TEXT NOT NULL DEFAULT 'deposit' CHECK (payment_type IN ('deposit', 'balance', 'full', 'refund')),
  provider_payment_id   TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMMISSIONS
CREATE TABLE commissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id              UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  booking_id            UUID NOT NULL REFERENCES bookings(id),
  service_price         INTEGER NOT NULL,
  commission_rate       DECIMAL(5,2),
  commission_amount     INTEGER NOT NULL CHECK (commission_amount >= 0),
  week_number           INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  year                  INTEGER NOT NULL,
  is_paid               BOOLEAN DEFAULT false,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, staff_id)
);

-- 9. CRÉNEAUX BLOQUÉS
CREATE TABLE blocked_slots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id              UUID REFERENCES staff(id),
  blocked_date          DATE NOT NULL,
  start_time            TIME NOT NULL,
  end_time              TIME NOT NULL,
  reason                TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- 10. LOGS NOTIFICATIONS
CREATE TABLE notification_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id),
  booking_id            UUID REFERENCES bookings(id),
  recipient_phone       TEXT NOT NULL,
  notification_type     TEXT NOT NULL CHECK (notification_type IN ('booking_confirmation', 'booking_reminder', 'cancellation', 'new_booking_salon', 'staff_new_booking')),
  channel               TEXT DEFAULT 'whatsapp',
  message               TEXT NOT NULL,
  status                TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message         TEXT,
  sent_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS — updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salons_updated_at BEFORE UPDATE ON salons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
