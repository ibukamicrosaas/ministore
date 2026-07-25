-- Choix d'affichage des produits par le marchand : liste ou grille.
-- Valeur utilisée comme vue par défaut sur la page d'accueil de la boutique.
-- Le client peut toujours basculer en utilisant le toggle dans le catalogue.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS product_layout TEXT DEFAULT 'list'
  CHECK (product_layout IN ('list', 'grid'));
