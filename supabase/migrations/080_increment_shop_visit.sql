-- Fonction d'incrément atomique pour shop_visits (voir 079_shop_visits.sql).
-- Appelée depuis /api/shop-visit à chaque ouverture réelle du lien boutique
-- (balise côté client, indépendante du cache ISR de /[shop-slug] — un simple
-- INSERT dans le composant de page ne s'exécuterait qu'une fois par fenêtre
-- de revalidation, pas à chaque visite réelle).

CREATE OR REPLACE FUNCTION increment_shop_visit(p_shop_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO shop_visits (shop_id, day, views)
  VALUES (p_shop_id, CURRENT_DATE, 1)
  ON CONFLICT (shop_id, day) DO UPDATE SET views = shop_visits.views + 1;
$$;
