-- Empêche la lecture publique des boutiques en brouillon (créées pendant /start
-- avant la création du compte, ou avant la publication du premier produit).
--
-- Important : shops n'a pas de politique de lecture dédiée au propriétaire —
-- shops_public_read servait aussi bien les visiteurs anonymes que le marchand
-- authentifié consultant sa propre boutique (via get_my_shop_id()). En excluant
-- simplement status = 'draft', un marchand dont la boutique est encore en
-- brouillon (entre l'écran 9 et la publication de son premier produit à
-- l'écran 10) ne pourrait plus lire sa propre boutique — ce qui casserait
-- createProduct/uploadProductPhoto à cet écran. D'où le OR id = get_my_shop_id().

DROP POLICY IF EXISTS "shops_public_read" ON shops;

CREATE POLICY "shops_public_read" ON shops
  FOR SELECT USING (
    (status <> 'draft' AND (is_active = true OR plan <> 'trial'))
    OR id = get_my_shop_id()
  );
