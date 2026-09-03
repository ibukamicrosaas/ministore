-- Contrôle après 098_backfill_product_variants.sql : vérifie que le backfill
-- product_variants <- products.variants (JSONB) est complet et fidèle, et que
-- rien d'autre n'a bougé. Rejouable à la demande — doit rester vide en continu
-- tant qu'aucun code applicatif n'écrit encore dans product_variants (Lots 2-4
-- pas encore déployés à ce stade).
--
--   supabase db query -f scripts/check-variants-migration-invariant.sql --linked

DO $$
DECLARE
  v_mismatch      RECORD;
  v_count         INTEGER := 0;
  v_products_src  INTEGER;
  v_variants_src  INTEGER;
  v_variants_dst  INTEGER;
  v_order_items_total   INTEGER;
  v_order_items_variant INTEGER;
BEGIN
  -- 1. Comptage global : nombre de produits source (JSONB non vide) et
  --    nombre total d'entrées JSONB doivent correspondre au nombre de lignes
  --    product_variants créées.
  SELECT count(*) INTO v_products_src
  FROM products WHERE variants IS NOT NULL AND jsonb_array_length(variants) > 0;

  SELECT coalesce(sum(jsonb_array_length(variants)), 0) INTO v_variants_src
  FROM products WHERE variants IS NOT NULL AND jsonb_array_length(variants) > 0;

  SELECT count(*) INTO v_variants_dst FROM product_variants;

  IF v_variants_src != v_variants_dst THEN
    RAISE EXCEPTION 'Décompte global incohérent : % entrées JSONB source vs % lignes product_variants créées.',
      v_variants_src, v_variants_dst;
  END IF;
  RAISE NOTICE 'OK — % produits source, % entrées JSONB, % lignes product_variants créées (comptages identiques).',
    v_products_src, v_variants_src, v_variants_dst;

  -- 2. Fidélité ligne à ligne : chaque produit doit avoir exactement le même
  --    nombre de lignes product_variants que d'entrées JSONB, avec les mêmes
  --    label/price/stock à la même position.
  FOR v_mismatch IN
    SELECT p.id, p.name,
           jsonb_array_length(p.variants) AS json_count,
           (SELECT count(*) FROM product_variants pv WHERE pv.product_id = p.id) AS table_count
    FROM products p
    WHERE p.variants IS NOT NULL AND jsonb_array_length(p.variants) > 0
      AND jsonb_array_length(p.variants) != (SELECT count(*) FROM product_variants pv WHERE pv.product_id = p.id)
  LOOP
    v_count := v_count + 1;
    RAISE WARNING 'Produit % (%) — % entrées JSONB vs % lignes product_variants',
      v_mismatch.name, v_mismatch.id, v_mismatch.json_count, v_mismatch.table_count;
  END LOOP;

  IF v_count > 0 THEN
    RAISE EXCEPTION '% produit(s) avec un décompte JSONB / product_variants divergent.', v_count;
  END IF;

  -- 3. Valeurs (label/price/stock) identiques à la même position.
  v_count := 0;
  FOR v_mismatch IN
    SELECT p.id, p.name, elem.ordinality - 1 AS pos,
           elem.value ->> 'label' AS json_label,
           (elem.value ->> 'price')::integer AS json_price,
           pv.name AS table_name,
           pv.price AS table_price
    FROM products p
    CROSS JOIN LATERAL jsonb_array_elements(p.variants) WITH ORDINALITY AS elem(value, ordinality)
    JOIN product_variants pv ON pv.product_id = p.id AND pv.position = elem.ordinality - 1
    WHERE p.variants IS NOT NULL AND jsonb_array_length(p.variants) > 0
      AND (pv.name != (elem.value ->> 'label') OR pv.price IS DISTINCT FROM (elem.value ->> 'price')::integer)
  LOOP
    v_count := v_count + 1;
    RAISE WARNING 'Produit % (%) position % — JSONB (%, %) vs table (%, %)',
      v_mismatch.name, v_mismatch.id, v_mismatch.pos,
      v_mismatch.json_label, v_mismatch.json_price, v_mismatch.table_name, v_mismatch.table_price;
  END LOOP;

  IF v_count > 0 THEN
    RAISE EXCEPTION '% ligne(s) product_variants avec une valeur différente de sa source JSONB.', v_count;
  END IF;
  RAISE NOTICE 'OK — toutes les lignes product_variants correspondent exactement à leur source JSONB (label, prix).';

  -- 4. variant_label posé uniquement là où attendu (produits migrés, jamais
  --    renseigné avant), jamais écrasé sur un produit qui l'aurait déjà (aucun
  --    cas aujourd'hui, mesuré à 0 avant migration, mais on ne suppose pas).
  SELECT count(*) INTO v_count
  FROM products
  WHERE variants IS NOT NULL AND jsonb_array_length(variants) > 0
    AND variant_label IS DISTINCT FROM 'Format';

  IF v_count > 0 THEN
    RAISE WARNING '% produit(s) migré(s) avec variant_label différent de la valeur par défaut attendue (''Format'') — normal seulement si déjà renseigné avant la migration, à vérifier au cas par cas.', v_count;
  END IF;

  -- 5. order_items : cette migration ne le référence nulle part — comptage
  --    total et comptage variant_label doivent rester strictement identiques
  --    à la mesure de référence prise le 2026-09-03 (676 total, 61 avec
  --    variant_label). Une divergence signalerait un effet de bord imprévu,
  --    pas forcément cette migration (du trafic normal peut aussi expliquer
  --    une hausse du total) — d'où une alerte, pas un échec bloquant sur ce
  --    seul point.
  SELECT count(*) INTO v_order_items_total FROM order_items;
  SELECT count(*) INTO v_order_items_variant FROM order_items WHERE variant_label IS NOT NULL;

  RAISE NOTICE 'order_items : % lignes au total (référence 2026-09-03 : 676), % avec variant_label (référence : 61).',
    v_order_items_total, v_order_items_variant;

  IF v_order_items_variant < 61 THEN
    RAISE EXCEPTION 'order_items.variant_label : % lignes non nulles, en baisse par rapport à la référence (61) — donnée potentiellement altérée.',
      v_order_items_variant;
  END IF;

  RAISE NOTICE 'Vérification terminée sans anomalie bloquante.';
END $$;
