-- Correction rétroactive : définir subscription_ends_at pour les boutiques
-- avec un plan payant qui n'en ont pas.
-- Utilise la date d'activation de la dernière transaction confirmée + durée.
-- Fallback : maintenant + 31 jours (mois de grâce).

UPDATE shops
SET
  subscription_ends_at = COALESCE(
    (
      SELECT
        CASE
          WHEN st.billing_cycle = 'annual' THEN COALESCE(st.activated_at, st.created_at) + INTERVAL '365 days'
          ELSE COALESCE(st.activated_at, st.created_at) + INTERVAL '31 days'
        END
      FROM subscription_transactions st
      WHERE st.shop_id = shops.id
        AND st.status = 'activated'
      ORDER BY COALESCE(st.activated_at, st.created_at) DESC
      LIMIT 1
    ),
    NOW() + INTERVAL '31 days'
  ),
  updated_at = NOW()
WHERE plan != 'trial'
  AND subscription_ends_at IS NULL;
