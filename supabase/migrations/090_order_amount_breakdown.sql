-- Décomposition des montants de commande — le suivi de commande, la
-- confirmation et l'e-mail n'affichent aujourd'hui que le total final : la
-- remise promo, le taux de remise sur quantité et le taux d'acompte sont
-- calculés en mémoire (src/app/api/orders/route.ts) puis jetés, jamais
-- persistés. Schéma et backfill validés dans REPRISE.md §3.
--
-- Aucune fonction créée dans public par cette migration (uniquement
-- ALTER TABLE et des blocs DO anonymes, non persistés dans pg_proc) : la
-- règle REVOKE EXECUTE / GRANT de AI_RULES.md §3 ne s'applique donc pas ici.
--
-- BEGIN/COMMIT explicites, comme 089 : je n'ai pas pu vérifier depuis cet
-- environnement si `supabase db push`/`migration up` enveloppe chaque
-- fichier de migration dans une transaction implicite — seule 089 le fait
-- explicitement parmi les migrations récentes (080 à 087 ne l'ont pas fait).
-- Faute de certitude, on l'écrit : sans ça, une vérification finale en
-- échec laisserait les colonnes ajoutées et le backfill déjà appliqués.

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS promo_id           UUID REFERENCES promo_codes(id),
  ADD COLUMN IF NOT EXISTS promo_code         TEXT,
  ADD COLUMN IF NOT EXISTS promo_discount_pct INTEGER,
  ADD COLUMN IF NOT EXISTS discount_amount    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER;

-- promo_id ajouté a posteriori (2026-08-12) : release_promo_code(p_promo_id)
-- attend un identifiant, pas un code texte — et un code texte ne désigne pas
-- une ligne stable dans le temps (des codes sont supprimés puis recréés,
-- hypothèse déjà avancée pour l'écart used_count du §3 de REPRISE.md).
-- Nécessaire pour que la correction de cause sur expire_pending_orders()/
-- cancelOrder() (lot séparé, après 091) puisse libérer le bon code promo.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS quantity_discount_pct INTEGER;

-- ── Backfill ────────────────────────────────────────────────────────────
-- discount_amount est dérivable pour l'historique via l'invariant :
--   somme(order_items.line_total) + orders.delivery_price − orders.total_price
-- promo_code, promo_discount_pct, deposit_percentage, quantity_discount_pct
-- restent NULL pour tout ce qui précède cette migration : jamais devinés,
-- l'information n'existe nulle part pour les reconstituer.
--
-- Le nombre de lignes touchées n'est pas comparé à une mesure figée (14,
-- relevée le 2026-08-09 sur 514 commandes) : de nouvelles commandes arrivent
-- entre la mesure et l'exécution, un écart légitime est attendu. Seul
-- l'invariant lui-même est un critère d'échec, avant et après le backfill.
DO $$
DECLARE
  v_updated_count  INTEGER;
  v_negative_count INTEGER;
BEGIN
  -- Garde-fou avant d'écrire quoi que ce soit : un total supérieur à la
  -- somme des lignes + livraison serait incohérent (pas une remise possible),
  -- et signalerait une donnée déjà corrompue avant même ce backfill.
  SELECT count(*) INTO v_negative_count
  FROM (
    SELECT o.id,
           (SELECT COALESCE(SUM(oi.line_total), 0)
              FROM order_items oi WHERE oi.order_id = o.id)
             + o.delivery_price - o.total_price AS gap
    FROM orders o
  ) g
  WHERE gap < 0;

  IF v_negative_count > 0 THEN
    RAISE EXCEPTION
      'Invariant violé AVANT backfill : % commande(s) avec un écart négatif (total_price > somme des lignes + livraison). Backfill interrompu — à investiguer avant de relancer cette migration.',
      v_negative_count;
  END IF;

  UPDATE orders o
  SET discount_amount = sub.gap
  FROM (
    SELECT o2.id,
           (SELECT COALESCE(SUM(oi.line_total), 0)
              FROM order_items oi WHERE oi.order_id = o2.id)
             + o2.delivery_price - o2.total_price AS gap
    FROM orders o2
  ) sub
  WHERE o.id = sub.id
    AND sub.gap > 0;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE
    'Backfill discount_amount : % commande(s) mises à jour (mesure de référence 2026-08-09 sur 514 commandes : 14 — un écart avec ce chiffre est attendu si des commandes sont arrivées depuis, ce n''est pas un critère d''échec).',
    v_updated_count;
END $$;

-- ── Vérification finale ────────────────────────────────────────────────
-- L'invariant doit tenir EXACTEMENT sur la totalité des commandes après
-- backfill, pas seulement sur celles qui viennent d'être touchées — toute
-- commande où le calcul serait impossible ou incohérent fait échouer la
-- migration plutôt que de laisser une donnée fausse en place.
DO $$
DECLARE
  v_broken_count INTEGER;
BEGIN
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
      'Invariant violé APRÈS backfill : % commande(s) où somme(line_total) − discount_amount + delivery_price ne reconstitue pas total_price exactement. Migration interrompue — le BEGIN/COMMIT explicite ci-dessus garantit qu''aucun changement n''est resté à moitié appliqué.',
      v_broken_count;
  END IF;

  RAISE NOTICE 'OK — invariant vérifié sur la totalité des commandes après backfill.';
END $$;

COMMIT;
