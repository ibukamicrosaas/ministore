-- Migration 109 : autorise 'stock_back' dans notification_logs.notification_type
-- (alertes "retour en stock" envoyées aux clients finaux, REPRISE.md §152).
-- Même patron que les migrations 100 et 106 : on remplace la contrainte CHECK
-- par la même liste + le nouveau type. Aucune donnée touchée.
ALTER TABLE notification_logs
  DROP CONSTRAINT notification_logs_notification_type_check;

ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_notification_type_check
    CHECK (notification_type IN (
      'order_confirmation', 'order_reminder', 'cancellation',
      'new_order_shop', 'delivery_confirmed',
      'trial_reminder', 'country_unsupported', 'stock_back'
    ));
