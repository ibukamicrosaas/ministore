-- ──────────────────────────────────────────────────────────────
-- 095 : Territoires de licence (page publique /licence)
-- ──────────────────────────────────────────────────────────────
--
-- Aujourd'hui, le statut de chaque pays (libre / attribué / Dukka) est écrit
-- en dur dans le JSX de src/app/licence/page.tsx — changer un statut exige
-- un redéploiement. Cette table le rend modifiable en base.
--
-- `status` en tokens ASCII minuscules, comme le reste du dépôt
-- (shops.verification_status, licence_applications.status) — jamais de
-- caractère accentué dans une valeur stockée. Le libellé affiché (« réservé »,
-- « attribué ») est un mapping côté page, pas une valeur de colonne.
--
-- `merchant_count` reste NULL pour le Bénin, le Mali et le Burkina Faso :
-- ces trois pays gardent leur requête live existante sur `shops`
-- (src/app/licence/page.tsx:45-49, déjà correcte) — cette colonne ne sert
-- que de repli pour les pays sans marchand réel à compter, jamais à
-- dupliquer un chiffre qui pourrait se périmer.
--
-- Pas de colonne « section d'affichage » : la section se déduit du statut
-- (réservé → « en cours d'attribution », attribué/dukka → « territoires
-- fermés », libre → « disponible » si merchant_count IS NOT NULL sinon
-- « marchés à ouvrir ») — un champ séparé pourrait diverger du statut réel.

CREATE TABLE IF NOT EXISTS licence_territories (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    text        NOT NULL UNIQUE,  -- ISO 3166-1 (BJ, ML, BK...) ou 'DIASPORA' (pas un pays)
  name            text        NOT NULL,
  status          text        NOT NULL CHECK (status IN ('libre', 'reserve', 'attribue', 'dukka')),
  merchant_count  integer,                       -- NULL = pas de chiffre réel affiché (marchés à ouvrir)
  is_visible      boolean     NOT NULL DEFAULT true,
  position        integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE licence_territories ENABLE ROW LEVEL SECURITY;

-- Même politique que licence_applications : aucun accès public. La page
-- /licence lit déjà tout le reste via createAdminClient() (contourne RLS) —
-- pas de raison d'ouvrir cette table en lecture anonyme.
CREATE POLICY "licence_territories_no_public_access" ON licence_territories
  FOR ALL
  USING (false);

REVOKE ALL ON licence_territories FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_licence_territories_position ON licence_territories(position);

COMMENT ON TABLE licence_territories IS
  'Statut de disponibilité de chaque territoire pour la licence — remplace les statuts codés en dur dans src/app/licence/page.tsx. Modifiable sans redéploiement.';

-- Seed — données actuelles de la page, Togo passé en 'reserve' (§1.1 des
-- instructions : solde de licence non réglé à l'échéance, pas réellement
-- attribué). merchant_count NULL pour BJ/ML/BK (requête live conservée),
-- et pour les marchés à ouvrir (aucun marchand aujourd'hui).
INSERT INTO licence_territories (country_code, name, status, merchant_count, position) VALUES
  ('BJ',       'Bénin',          'libre',    NULL, 10),
  ('ML',       'Mali',           'libre',    NULL, 20),
  ('BK',       'Burkina Faso',   'libre',    NULL, 30),
  ('NE',       'Niger',          'libre',    NULL, 40),
  ('GN',       'Guinée',         'libre',    NULL, 50),
  ('CM',       'Cameroun',       'libre',    NULL, 60),
  ('GA',       'Gabon',          'libre',    NULL, 70),
  ('TG',       'Togo',           'reserve',  NULL, 80),
  ('SN',       'Sénégal',        'dukka',    NULL, 90),
  ('CI',       'Côte d''Ivoire', 'dukka',    NULL, 100),
  ('DIASPORA', 'Diaspora',       'dukka',    NULL, 110)
ON CONFLICT (country_code) DO NOTHING;
