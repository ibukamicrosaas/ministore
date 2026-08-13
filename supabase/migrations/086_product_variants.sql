-- Refonte boutiques publiques — Lot 1 : fondations des variantes produit.
--
-- Schéma uniquement. Le backfill de products.variants (JSONB) vers cette
-- table, et la bascule du code applicatif (ProductForm, VariantSelectorCta,
-- ProductGrid, OrderForm, POST /api/orders, RPC de stock) sont volontairement
-- hors de cette migration — c'est le sous-lot 2a, livré et vérifié à part.
-- products.variants (JSONB) reste la seule source lue par le code tant que
-- ce sous-lot n'a pas eu lieu.

CREATE TABLE product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,        -- « Rouge », « 500 ml », « Format entier »
  price        INTEGER,              -- NULL = hérite de products.price
  compare_at   INTEGER,              -- prix barré, NULL = hérite
  stock        INTEGER,              -- NULL = illimité, cohérent avec products.stock_count
  image_url    TEXT,                 -- NULL = image principale du produit
  position     INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON product_variants(product_id, position);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variant_label TEXT;  -- « Couleur », « Taille ». NULL = pas de variantes

-- order_items.variant_label existe déjà et reste la source figée à la commande
-- (le marchand peut renommer/supprimer une variante après coup, la commande ne
-- doit pas changer rétroactivement). variant_id est un ajout, nullable pour les
-- commandes déjà passées, et ne doit jamais bloquer la suppression d'une
-- variante déjà commandée — d'où ON DELETE SET NULL, pas la valeur par défaut
-- RESTRICT.
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Miroir exact du pattern de la table products (002_rls_policies.sql) :
-- lecture publique des variantes actives, écriture réservée au propriétaire
-- de la boutique du produit parent.
CREATE POLICY "product_variants_public_read" ON product_variants
  FOR SELECT USING (is_active = true);

CREATE POLICY "product_variants_owner_all" ON product_variants
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE shop_id = get_my_shop_id())
    AND get_my_role() = 'owner'
  );
