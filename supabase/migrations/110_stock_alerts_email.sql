-- Migration 110 : e-mail comme second canal pour les alertes retour en stock
-- (REPRISE.md §152 Phase 2).

-- Contact e-mail facultatif, en plus du téléphone (qui reste obligatoire et
-- reste la clé de dédoublonnage — uq_stock_alerts_phone_product inchangé).
ALTER TABLE stock_alerts
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Réservation propre au canal e-mail, indépendante de notified_at (SMS) : un
-- canal qui réussit ne doit jamais bloquer ni faire repartir l'autre. Voir
-- lib/notifications/stock-back.ts pour la logique de réclamation par canal.
ALTER TABLE stock_alerts
  ADD COLUMN IF NOT EXISTS email_notified_at TIMESTAMPTZ;

-- Identifie le destinataire d'une ligne notification_logs quand le canal est
-- 'email' (recipient_phone n'a pas de sens ici, comme push_endpoint pour le
-- canal push — migration 100, même raisonnement).
ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;
