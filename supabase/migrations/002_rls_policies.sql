-- ============================================================
-- MINISTORE — Row Level Security Policies
-- Migration 002
-- ============================================================

ALTER TABLE shops             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Fonctions helper
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- SHOPS
-- ============================================================

-- Lecture publique des boutiques actives (mini site public)
CREATE POLICY "shops_public_read" ON shops
  FOR SELECT USING (is_active = true);

-- Owner : mise à jour de sa boutique
CREATE POLICY "shops_owner_update" ON shops
  FOR UPDATE USING (id = get_my_shop_id() AND get_my_role() = 'owner');

-- ============================================================
-- PROFILES
-- ============================================================

CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_owner_read" ON profiles
  FOR SELECT USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- PRODUCTS
-- ============================================================

-- Lecture publique des produits actifs (mini site public)
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

-- Owner : CRUD complet sur les produits de sa boutique
CREATE POLICY "products_owner_all" ON products
  FOR ALL USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE POLICY "clients_owner_all" ON clients
  FOR ALL USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

-- ============================================================
-- ORDERS
-- ============================================================

-- Insertion publique : un client peut créer une commande
CREATE POLICY "orders_public_insert" ON orders
  FOR INSERT WITH CHECK (true);

-- Lecture publique limitée via client_token
CREATE POLICY "orders_token_read" ON orders
  FOR SELECT USING (client_token IS NOT NULL);

-- Owner : accès complet aux commandes de sa boutique
CREATE POLICY "orders_owner_all" ON orders
  FOR ALL USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

-- ============================================================
-- ORDER ITEMS
-- ============================================================

-- Insertion publique (créée en même temps que l'order)
CREATE POLICY "order_items_public_insert" ON order_items
  FOR INSERT WITH CHECK (true);

-- Lecture : owner via sa boutique
CREATE POLICY "order_items_owner_read" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE shop_id = get_my_shop_id()
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE POLICY "payments_owner_read" ON payments
  FOR SELECT USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

-- Insertion/mise à jour : service role uniquement (webhooks Bictorys)

-- ============================================================
-- NOTIFICATION LOGS
-- ============================================================

CREATE POLICY "notification_logs_owner_read" ON notification_logs
  FOR SELECT USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');
