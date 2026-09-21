-- Migration 108 : extrait texte des produits digitaux (aperçu avant achat, Lot 5b)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS digital_preview_text TEXT
    CONSTRAINT products_digital_preview_text_len
    CHECK (digital_preview_text IS NULL OR char_length(digital_preview_text) <= 3000);

COMMENT ON COLUMN products.digital_preview_text IS
  'Extrait texte affiché dans un modal sur la fiche publique (produits digitaux uniquement, 3000 caractères max). Aperçu, sans rapport avec le fichier livré (digital_file_path).';
