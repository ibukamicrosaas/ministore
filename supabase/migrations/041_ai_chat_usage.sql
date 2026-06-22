-- Migration 041 : table de comptage des messages IA par boutique/jour

CREATE TABLE IF NOT EXISTS ai_chat_usage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, date)
);

ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Le propriétaire ne peut lire que ses propres stats (pour afficher le compteur dans l'UI)
-- Les inserts/updates se font via createAdminClient() (service role), pas via cette policy
CREATE POLICY "owner_select_ai_usage"
  ON ai_chat_usage FOR SELECT
  USING (
    shop_id = (
      SELECT shop_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE INDEX idx_ai_chat_usage_shop_date ON ai_chat_usage(shop_id, date);
