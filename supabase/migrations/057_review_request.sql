-- delivered_at : horodatage de la livraison effective (ou completion pour les produits digitaux)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL;

-- review_request_sent_at : horodatage de l'envoi de la demande d'avis par e-mail
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill delivered_at pour les commandes déjà livrées (heuristique : updated_at)
UPDATE orders
SET delivered_at = updated_at
WHERE status IN ('delivered', 'completed')
  AND delivered_at IS NULL;

COMMENT ON COLUMN orders.delivered_at          IS 'Horodatage de livraison/complétion. Sert de référence pour l''envoi automatique de la demande d''avis (J+3).';
COMMENT ON COLUMN orders.review_request_sent_at IS 'Horodatage de l''envoi de l''e-mail de demande d''avis. NULL = pas encore envoyé.';
