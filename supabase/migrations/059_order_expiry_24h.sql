-- Étendre le délai d'expiration des commandes en ligne non payées de 30 min à 24h.
-- Donne le temps au marchand de recontacter le client si besoin.

CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE orders
  SET
    status              = 'cancelled',
    cancellation_reason = 'expired',
    updated_at          = NOW()
  WHERE
    status        = 'pending'
    AND deposit_paid  = false
    AND payment_type  IN ('online_full', 'online_deposit')
    AND created_at    < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
