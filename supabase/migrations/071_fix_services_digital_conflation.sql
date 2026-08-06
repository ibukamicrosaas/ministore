-- Corrige une erreur de la migration 066 : le renommage services→digital a
-- supposé que 'services' représentait uniquement les vendeurs de produits
-- digitaux de l'ancien /start. En réalité, /onboarding (autre parcours de
-- création de boutique, non touché par la refonte /start) utilise 'services'
-- comme catégorie à part entière — coaching, consultation, réparation,
-- livraison à domicile — sans rapport avec les produits digitaux.
--
-- Vérification a posteriori : sur les 83 boutiques renommées en 'digital',
-- seulement 4 ont un produit product_type = 'digital'. Les 82 autres sont très
-- probablement des boutiques de services mal renommées.
--
-- Heuristique de correction : on ne garde 'digital' que pour les boutiques qui
-- ont réellement un produit digital ; les autres reviennent à 'services'.
-- Imparfait (un vendeur digital légitime peut ne pas encore avoir ajouté son
-- produit) mais nettement plus proche de la réalité que le renommage en bloc.

UPDATE shops
SET specialty = 'services'
WHERE specialty = 'digital'
  AND id NOT IN (
    SELECT DISTINCT shop_id FROM products WHERE product_type = 'digital'
  );
