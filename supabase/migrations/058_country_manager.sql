-- ──────────────────────────────────────────────────────────────
-- 058 : Country Managers — accès admin restreint par pays
-- ──────────────────────────────────────────────────────────────

-- Table principale
CREATE TABLE IF NOT EXISTS country_managers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country    text        NOT NULL,  -- code ISO : 'TG', 'SN', 'CI' …
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT country_managers_user_id_key UNIQUE (user_id)
);

ALTER TABLE country_managers ENABLE ROW LEVEL SECURITY;

-- Aucun accès public — uniquement via service_role (createAdminClient)
CREATE POLICY "cm_no_public_access" ON country_managers
  FOR ALL
  USING (false);

-- ──────────────────────────────────────────────────────────────
-- Fonction helper : renvoie le pays géré par l'utilisateur courant
-- Retourne NULL si l'utilisateur n'est pas country manager
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_managed_country()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT country
  FROM   country_managers
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;

-- ──────────────────────────────────────────────────────────────
-- RLS shops : les country managers peuvent lire les boutiques
-- de leur pays (en plus des policies existantes)
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "cm_read_shops_by_country" ON shops
  FOR SELECT
  USING (
    country = get_my_managed_country()
  );

-- ──────────────────────────────────────────────────────────────
-- RLS orders : les country managers peuvent lire les commandes
-- des boutiques de leur pays
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "cm_read_orders_by_country" ON orders
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops
      WHERE  country = get_my_managed_country()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- RLS products : lecture des produits des boutiques du pays
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "cm_read_products_by_country" ON products
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops
      WHERE  country = get_my_managed_country()
    )
  );

COMMENT ON TABLE country_managers IS
  'Utilisateurs ayant accès au dashboard country-admin, restreint à leur pays.';
COMMENT ON FUNCTION get_my_managed_country() IS
  'Retourne le code pays géré par l''utilisateur authentifié, ou NULL.';
