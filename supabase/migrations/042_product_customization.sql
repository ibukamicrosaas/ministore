-- Personnalisation produit : champ libre saisi par le client lors de la commande
-- Activé produit par produit via customization_enabled

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS customization_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customization_label   TEXT;

-- La note de personnalisation est par article (un même panier peut mélanger
-- produits personnalisables et non personnalisables)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS customization_note TEXT;
