-- Refonte boutiques publiques — Lot 1 : le badge « vérifié » devient une
-- vraie donnée, indépendante du plan (aujourd'hui : SVG codé en dur, affiché
-- pour tout shop plan='pro', sans lien avec aucune colonne).

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none','pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;

-- response_time_minutes n'est calculée qu'au lot 3 (nouveau cron, consommé
-- par la carte d'identité §4.3) — colonne créée maintenant, vide jusque-là.

-- Invariant à respecter par toute future action admin de vérification :
-- verified_at doit TOUJOURS être posé à now() quand verification_status
-- passe à 'verified' par un instructeur humain. C'est ce qui permet à
-- verified_at IS NULL de rester, sans ambiguïté, le marqueur « à instruire »
-- posé par la requête de grandfathering ci-dessous — jamais une deuxième
-- colonne de note n'est nécessaire pour ça.

-- Requête de préservation des Pro actuellement badgés — préparée, NON EXÉCUTÉE.
-- La liste des shops concernés (id, name, slug) doit être communiquée dans le
-- rapport du lot avant toute exécution réelle.
--
-- UPDATE shops SET verification_status = 'verified', verified_at = NULL
-- WHERE plan = 'pro';
