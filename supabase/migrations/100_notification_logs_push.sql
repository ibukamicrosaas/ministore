-- Journalisation du push, même mécanisme que le SMS/WhatsApp déjà en place
-- sur notification_logs (REPRISE.md §87/§88) — sendPushToShop échouait
-- jusqu'ici sans laisser aucune trace interrogeable : seul un console.error
-- éphémère, invisible une fois le déploiement suivant fait. Signalé par un
-- test réel de l'utilisateur (PWA iPhone, notifications activées, aucun push
-- reçu pour une vraie commande alors que l'e-mail correspondant est arrivé).

-- recipient_phone n'a pas de sens pour un envoi push (pas de numéro) —
-- NOT NULL levé spécifiquement pour ce canal, inchangé pour SMS/WhatsApp.
ALTER TABLE notification_logs
  ALTER COLUMN recipient_phone DROP NOT NULL;

-- Distingue quel abonnement précis a échoué quand une boutique en a
-- plusieurs (un par appareil) — une ligne par abonnement, jamais agrégée.
ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS push_endpoint TEXT;

-- 'delivery_confirmed' : le push envoyé par api/delivery/confirm/route.ts
-- n'avait jusqu'ici aucune valeur qui lui corresponde honnêtement parmi les
-- 4 existantes (toutes pensées pour le SMS/WhatsApp client-facing).
ALTER TABLE notification_logs
  DROP CONSTRAINT notification_logs_notification_type_check;

ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_notification_type_check
    CHECK (notification_type IN (
      'order_confirmation', 'order_reminder', 'cancellation',
      'new_order_shop', 'delivery_confirmed'
    ));
