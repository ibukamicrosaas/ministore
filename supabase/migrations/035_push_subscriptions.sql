-- Abonnements Web Push pour les notifications de nouvelles commandes
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    uuid        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_shop_id_idx ON push_subscriptions (shop_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Les propriétaires gèrent leurs propres abonnements push
CREATE POLICY "owners_manage_own_push"
  ON push_subscriptions FOR ALL
  USING (
    shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );
