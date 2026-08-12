-- Vérification indépendante et rejouable de l'invariant de décomposition des
-- montants de commande, posé par supabase/migrations/090_order_amount_
-- breakdown.sql. À exécuter à la demande, pas seulement juste après la
-- migration — même principe que scripts/check-function-privileges.sql pour
-- les privilèges de fonctions :
--
--   supabase db query -f scripts/check-order-totals-invariant.sql --linked
--
-- Ce script ne suppose aucun nombre de commandes attendu : il vérifie que
-- l'invariant tient sur la totalité de la table, quelle que soit sa taille
-- au moment de l'exécution.

DO $$
DECLARE
  v_broken_count INTEGER;
  v_total_count  INTEGER;
BEGIN
  SELECT count(*) INTO v_total_count FROM orders;

  SELECT count(*) INTO v_broken_count
  FROM (
    SELECT o.id,
           (SELECT COALESCE(SUM(oi.line_total), 0)
              FROM order_items oi WHERE oi.order_id = o.id)
             - o.discount_amount + o.delivery_price AS reconstructed,
           o.total_price
    FROM orders o
  ) r
  WHERE reconstructed IS DISTINCT FROM total_price;

  IF v_broken_count > 0 THEN
    RAISE EXCEPTION
      'Invariant violé : % commande(s) sur % où somme(line_total) − discount_amount + delivery_price ne reconstitue pas total_price exactement.',
      v_broken_count, v_total_count;
  END IF;

  RAISE NOTICE 'OK — invariant vérifié sur % commande(s), aucune anomalie.', v_total_count;
END $$;
