-- Notifications envoyées par l'admin aux boutiques
CREATE TABLE IF NOT EXISTS shop_notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    uuid        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text        NOT NULL,
  type       text        NOT NULL DEFAULT 'info', -- info | warning | promo | success
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_notifications_shop_id_idx ON shop_notifications (shop_id, created_at DESC);

-- RLS : chaque boutique ne voit que ses propres notifications
ALTER TABLE shop_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_own_notifications"
  ON shop_notifications FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "owners_update_own_notifications"
  ON shop_notifications FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid()
    )
  );
