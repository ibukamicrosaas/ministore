-- Variantes de prix pour les prestations
-- Format: [{"label": "Court", "price": 35000}, {"label": "Mi-long", "price": 45000}]
ALTER TABLE services ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT NULL;
