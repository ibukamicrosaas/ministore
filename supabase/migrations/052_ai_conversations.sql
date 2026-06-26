-- Migration 052 : historique conversations IA + base de connaissance personnalisée

-- ─── Conversations de l'assistant IA ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id         uuid        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  session_id      text        NOT NULL,
  messages        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  message_count   int         NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_conversations_session  ON ai_conversations(session_id);
CREATE        INDEX IF NOT EXISTS idx_ai_conversations_shop     ON ai_conversations(shop_id);
CREATE        INDEX IF NOT EXISTS idx_ai_conversations_last     ON ai_conversations(last_message_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
-- Aucune politique publique : accès uniquement via service_role (espace admin)

-- ─── Base de connaissance personnalisée ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_knowledge_entries (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text        NOT NULL,
  content    text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  sort_order int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_knowledge_entries ENABLE ROW LEVEL SECURITY;
-- Aucune politique publique : accès uniquement via service_role (espace admin)
