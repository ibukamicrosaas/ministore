-- Hotfix : la migration 018 a rendu shops.ref_code NOT NULL sans valeur par
-- défaut. Le code de création de boutique (/start, onboarding, settings) ne
-- fournissait pas cette colonne — résultat : toute nouvelle création de
-- boutique échouait avec une violation de contrainte NOT NULL, sur les trois
-- points d'entrée à la fois.
--
-- Correction au niveau DB plutôt que dans chaque fichier applicatif : protège
-- tout chemin de création présent et futur d'un même oubli.

ALTER TABLE shops
  ALTER COLUMN ref_code SET DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
