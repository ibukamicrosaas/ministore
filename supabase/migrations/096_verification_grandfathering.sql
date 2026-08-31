-- Refonte boutiques publiques — Lot 3, Vague 3 : préservation du badge « vérifié »
-- pour les boutiques Pro qui l'affichaient déjà avant que l'affichage devienne
-- conditionnel à verification_status (voir migration 087 et REPRISE.md §36/§51).
--
-- Périmètre validé explicitement par l'utilisateur, 2026-08-31 : uniquement les
-- boutiques Pro ACTIVES à ce jour. Les 13 boutiques Pro suspendues sont
-- délibérément exclues — pas de suppression de la liste ci-dessous en cas de
-- réactivation future, une décision d'admin séparée devra alors les traiter.
--
-- Ciblage par id (pas par plan='pro' ni par is_active=true) : une condition
-- dynamique grandfatherait aussi toute future boutique Pro active, ce qui
-- n'est pas l'intention — seul cet instantané précis de deux boutiques est
-- concerné.

UPDATE shops
SET verification_status = 'verified', verified_at = NULL
WHERE id IN (
  'e98a25ce-8258-41f6-93c6-6fae9656d303', -- ABI&CO
  '12d6a93e-cf8a-41b5-aad0-4256a11725e7'  -- Viens on s'connaît
);
