-- Compteur minimal d'ouvertures de lien boutique (SPEC-dashboard-fins-essai §6).
-- Volontairement pauvre : pas d'analytics, pas de visiteur unique, pas de
-- cookie/identifiant — juste un compteur d'ouvertures par jour, qui sert
-- uniquement à distinguer, en cas B, un marchand dont le lien n'a jamais été
-- ouvert (il doit partager) d'un marchand dont le lien a été ouvert sans
-- déclencher de commande (il a un autre problème à régler).

CREATE TABLE shop_visits (
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  day     DATE NOT NULL,
  views   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (shop_id, day)
);

ALTER TABLE shop_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_visits_no_public_access" ON shop_visits FOR ALL USING (false);
-- Écriture via l'admin client uniquement, à chaque rendu de /[shop-slug]
-- (hors marchand propriétaire connecté). Lecture réservée au tableau de bord
-- (admin client, agrégée côté serveur).

COMMENT ON TABLE shop_visits IS
  'Compteur brut d''ouvertures du lien boutique, par jour. Pas de visiteurs
   uniques : un rechargement de page compte comme une ouverture de plus.
   Ne jamais afficher ce nombre comme "X personnes" — seulement "ton lien a
   été ouvert X fois".';
