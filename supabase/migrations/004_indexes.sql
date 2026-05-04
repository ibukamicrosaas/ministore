-- ============================================================
-- MINISTORE — Index de performance
-- Migration 004
-- ============================================================

-- Shops
CREATE INDEX IF NOT EXISTS idx_shops_slug      ON shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON shops(is_active);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_shop_id ON profiles(shop_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_shop_id      ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_active   ON products(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(shop_id, display_order);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_shop_id ON clients(shop_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone   ON clients(shop_id, phone);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_shop_date    ON orders(shop_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status  ON orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_client_token ON orders(client_token);
CREATE INDEX IF NOT EXISTS idx_orders_client_id    ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_pending      ON orders(status, created_at) WHERE status = 'pending';

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id     ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_shop_id      ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id  ON payments(provider_payment_id);

-- Notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_order ON notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_shop  ON notification_logs(shop_id);
