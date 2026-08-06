-- Liste d'attente pour les pays non encore couverts (écran 4bis de /start).
-- Sert à décider quel pays ouvrir ensuite et à relancer les inscrits une fois ouvert.

CREATE TABLE IF NOT EXISTS waitlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country     TEXT        NOT NULL, -- texte libre saisi par le visiteur, pas un code ISO
  phone       TEXT        NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'start_flow',
  notified_at TIMESTAMPTZ,          -- renseigné quand on relance l'inscrit après ouverture du pays
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (phone, country)
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_no_public_access" ON waitlist FOR ALL USING (false);
-- Aucun accès direct (client ou anon) : insertion exclusivement via server action + admin client.
