-- Un brouillon abandonné à l'écran 7 réservait son slug pour toujours (jusqu'à
-- la purge à 7 jours), bloquant un futur marchand choisissant le même nom.
-- L'unicité ne doit s'appliquer qu'aux boutiques qui existent vraiment aux yeux
-- du public (jamais aux brouillons) — préférable à une purge plus agressive,
-- qui aurait réduit la fenêtre de rétention utile pour l'analyse de la
-- taxonomie sans éliminer le risque de collision (seulement le réduire).

ALTER TABLE shops DROP CONSTRAINT shops_slug_key;

CREATE UNIQUE INDEX shops_slug_unique_non_draft ON shops (slug) WHERE status <> 'draft';
