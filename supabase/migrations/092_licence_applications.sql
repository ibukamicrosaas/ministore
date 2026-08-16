-- ──────────────────────────────────────────────────────────────
-- 092 : Candidatures de licence pays (formulaire public /licence)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS licence_applications (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  country           text        NOT NULL,
  full_name         text        NOT NULL,
  whatsapp_phone    text        NOT NULL,
  email             text        NOT NULL,
  experience        text        NOT NULL,
  acquisition_plan  text        NOT NULL,
  status            text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE licence_applications ENABLE ROW LEVEL SECURITY;

-- Aucun accès public, ni en lecture ni en écriture — insertion uniquement
-- via l'action serveur (createAdminClient), lecture uniquement côté admin.
CREATE POLICY "licence_applications_no_public_access" ON licence_applications
  FOR ALL
  USING (false);

REVOKE ALL ON licence_applications FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_licence_applications_created_at ON licence_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_licence_applications_status ON licence_applications(status);

COMMENT ON TABLE licence_applications IS
  'Candidatures reçues via le formulaire public /licence — jamais de lien avec un compte auth.users, la candidature précède toujours la création de compte.';
