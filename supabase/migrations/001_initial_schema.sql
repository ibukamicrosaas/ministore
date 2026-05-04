-- ============================================================
-- MINISTORE — Schéma initial Supabase PostgreSQL
-- Migration 001
-- ============================================================

-- 1. BOUTIQUES (shops)
CREATE TABLE shops (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  description             TEXT,
  logo_url                TEXT,
  primary_color           TEXT DEFAULT '#0EA5E9',
  address                 TEXT,
  city                    TEXT,
  country                 TEXT DEFAULT 'SN',
  phone_whatsapp          TEXT,
  email                   TEXT,
  delivery_options        JSONB DEFAULT '{"home_delivery": true, "store_pickup": true}'::jsonb,
  available_days          JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday"]'::jsonb,
  deposit_percentage      INTEGER DEFAULT 0 CHECK (deposit_percentage BETWEEN 0 AND 100),
  plan                    TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'multi')),
  trial_ends_at           TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id      TEXT,
  moneroo_api_key         TEXT,
  stripe_account_id       TEXT,
  is_active               BOOLEAN DEFAULT true,
  business_type           TEXT,
  specialty               TEXT,
  specialty_custom        TEXT,
  onboarding_completed    BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  payout_wave_number      TEXT,
  payout_om_number        TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILS UTILISATEURS (étend auth.users)
CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id              UUID REFERENCES shops(id),
  role                 TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  first_name           TEXT,
  last_name            TEXT,
  phone                TEXT,
  whatsapp             TEXT,
  avatar_url           TEXT,
  is_active            BOOLEAN DEFAULT true,
  onboarding_step      INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUITS
CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  price               INTEGER NOT NULL CHECK (price >= 0),
  photo_url           TEXT,
  photos              JSONB DEFAULT '[]'::jsonb,
  -- Format : [{"url": "https://...", "is_primary": true}, ...]
  category            TEXT,
  is_active           BOOLEAN DEFAULT true,
  display_order       INTEGER DEFAULT 0,
  deposit_percentage  INTEGER CHECK (deposit_percentage BETWEEN 0 AND 100),
  variants            JSONB DEFAULT NULL,
  -- Format : [{"label": "Format Entier", "price": 12000}, ...]
  stock_count         INTEGER DEFAULT NULL,
  -- NULL = stock illimité
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLIENTS
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  phone         TEXT NOT NULL,
  whatsapp      TEXT,
  email         TEXT,
  notes         TEXT,
  total_orders  INTEGER DEFAULT 0,
  total_spent   INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, phone)
);

-- 5. COMMANDES
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,

  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),

  delivery_type       TEXT NOT NULL DEFAULT 'home_delivery'
    CHECK (delivery_type IN ('home_delivery','store_pickup')),

  delivery_address    TEXT,
  delivery_date       DATE,

  payment_method      TEXT CHECK (payment_method IN ('wave_money','orange_money','maxit','on_delivery','on_site')),
  payment_type        TEXT NOT NULL DEFAULT 'on_delivery'
    CHECK (payment_type IN ('online_full','online_deposit','on_delivery','on_site')),

  deposit_amount      INTEGER NOT NULL DEFAULT 0,
  deposit_paid        BOOLEAN NOT NULL DEFAULT false,
  total_price         INTEGER NOT NULL DEFAULT 0,

  notes               TEXT,
  internal_notes      TEXT,
  cancellation_reason TEXT,
  cancelled_by        TEXT CHECK (cancelled_by IN ('shop','client')),

  client_token        UUID NOT NULL DEFAULT gen_random_uuid(),
  reminder_sent_at    TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LIGNES DE COMMANDE
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  variant_label TEXT,
  unit_price    INTEGER NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  line_total    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PAIEMENTS
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_id             UUID NOT NULL REFERENCES shops(id),
  amount              INTEGER NOT NULL CHECK (amount > 0),
  currency            TEXT DEFAULT 'XOF',
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('bictorys','cash','wave_money','orange_money','maxit')),
  payment_type        TEXT NOT NULL DEFAULT 'full' CHECK (payment_type IN ('deposit','balance','full','refund')),
  provider_payment_id TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LOGS NOTIFICATIONS
CREATE TABLE notification_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           UUID NOT NULL REFERENCES shops(id),
  order_id          UUID REFERENCES orders(id),
  recipient_phone   TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('order_confirmation','order_reminder','cancellation','new_order_shop')),
  channel           TEXT DEFAULT 'whatsapp',
  message           TEXT NOT NULL,
  status            TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','pending')),
  error_message     TEXT,
  sent_at           TIMESTAMPTZ DEFAULT NOW()
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

CREATE TRIGGER shops_updated_at    BEFORE UPDATE ON shops    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at  BEFORE UPDATE ON clients  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at   BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
