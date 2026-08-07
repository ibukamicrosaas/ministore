-- Mise à jour du commentaire suite à l'ajout de la déduplication par session
-- côté client (VisitBeacon) — un rechargement dans la même session ne compte
-- plus qu'une fois, mais reste un plancher (nouvel onglet, JS désactivé,
-- bloqueur de publicité échappent au comptage).

COMMENT ON TABLE shop_visits IS
  'Compteur brut d''ouvertures du lien boutique, par jour. Dédupliqué par
   session côté client (sessionStorage) — un rechargement dans le même
   onglet ne recompte pas. Reste un plancher, pas une mesure exacte : ne
   jamais l''utiliser comme donnée de facturation ou de preuve. Le texte
   affiché au marchand doit toujours dire "ouvert X fois", jamais "X
   personnes" — on ne compte pas des visiteurs uniques.';
