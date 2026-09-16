-- Élargit notification_logs.notification_type pour deux nouveaux usages de
-- sendPushToShop (plan push 2026-09) — même geste que l'ajout de
-- 'delivery_confirmed' en migration 100, PushNotificationType reste
-- volontairement une union stricte : chaque appelant doit dire honnêtement
-- ce qu'il notifie, pas de valeur générique "autre".
--
-- 'trial_reminder' : rappel d'expiration d'essai envoyé en parallèle du
-- SMS/WhatsApp existant (trial-reminder, free-orders-trial-expiry) — pas un
-- remplacement, le SMS reste tel quel tant que sa fiabilité n'est pas
-- corrigée séparément (REPRISE.md §130).
--
-- 'country_unsupported' : alerte pays non couvert, envoi ponctuel (pas un
-- cron récurrent — la validation serveur ajoutée au plan pays empêche déjà
-- toute nouvelle boutique d'atteindre cet état ; ne concerne que le solde de
-- boutiques déjà existantes dans cet état). Le bandeau dashboard
-- (`isSupportedCountry`, commit 6f87be1) reste la protection permanente,
-- ce type ne sert qu'à un envoi ciblé complémentaire quand utile.

ALTER TABLE notification_logs
  DROP CONSTRAINT notification_logs_notification_type_check;

ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_notification_type_check
    CHECK (notification_type IN (
      'order_confirmation', 'order_reminder', 'cancellation',
      'new_order_shop', 'delivery_confirmed',
      'trial_reminder', 'country_unsupported'
    ));
