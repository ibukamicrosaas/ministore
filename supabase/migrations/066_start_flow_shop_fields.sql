-- Nouveau parcours /start (v4) : champs de segmentation collectés pendant le quiz,
-- statut de boutique étendu pour "boutique publique dès le jour 1 + activation",
-- et champ texte libre pour affiner la taxonomie "specialty" quand le marchand
-- choisit "Autre chose".

ALTER TABLE shops
  ADD COLUMN status          TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('draft', 'trial', 'active', 'expired')),
  ADD COLUMN seller_stage    TEXT CHECK (seller_stage IN ('A', 'B', 'C')),
  ADD COLUMN selling_channel TEXT CHECK (selling_channel IN ('whatsapp', 'social', 'physique')),
  ADD COLUMN pain_point      TEXT CHECK (pain_point IN ('clients', 'auto', 'gestion', 'paiement')),
  ADD COLUMN specialty_other TEXT;

COMMENT ON COLUMN shops.status IS
  'Cycle de vie de la boutique. draft = créée pendant le quiz /start avant que le marchand ait un compte (récupérable/purgeable). trial = compte créé, boutique publique, dans la fenêtre des commandes offertes. active = plan payant actif. expired = fenêtre offerte ou abonnement terminé sans renouvellement. DEFAULT ''active'' pour ne pas casser les boutiques existantes.';
COMMENT ON COLUMN shops.seller_stage IS
  'Q3 de /start ("Où en es-tu aujourd''hui ?") — segment A/B/C selon la maturité commerciale déclarée par le marchand (A = vend déjà, B = a des produits mais peu de clients, C = démarre).';
COMMENT ON COLUMN shops.selling_channel IS
  'Q3 de /start ("Où en es-tu aujourd''hui ?") — canal de vente déclaré (whatsapp / social / physique), utilisé pour proposer le bon mode de partage à l''écran "boutique en ligne".';
COMMENT ON COLUMN shops.pain_point IS
  'Q5 de /start ("Qu''est-ce qui te bloque le plus ?") — blocage principal déclaré par le marchand, utilisé pour personnaliser le tableau de bord (tâche séparée).';
COMMENT ON COLUMN shops.specialty_other IS
  'Q2 de /start ("Tu vends quoi ?") — texte libre saisi quand le marchand choisit "Autre chose" (specialty = ''other''). Sert à identifier de nouvelles catégories à créer.';

-- "services" était un nom trompeur : la valeur regroupait en réalité les produits
-- digitaux (ebooks, formations, fichiers téléchargeables). Renommée en "digital".
UPDATE shops SET specialty = 'digital' WHERE specialty = 'services';
