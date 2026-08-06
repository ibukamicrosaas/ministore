-- Modèle "boutique publique dès le 1er produit + 3 commandes offertes".
-- trial_model='legacy' par défaut : les 1 488 boutiques existantes ne changent
-- de comportement en rien — toute la logique de ce fichier et des suivants ne
-- s'applique qu'aux boutiques trial_model='free_orders' (créées via /start à
-- partir de maintenant).

ALTER TABLE shops
  ADD COLUMN trial_model       TEXT NOT NULL DEFAULT 'legacy'
    CHECK (trial_model IN ('legacy', 'free_orders')),
  ADD COLUMN trial_started_at  TIMESTAMPTZ,
  ADD COLUMN trial_extended_at TIMESTAMPTZ,
  ADD COLUMN free_orders_used  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN free_orders_quota INTEGER NOT NULL DEFAULT 3;
-- trial_ends_at existe déjà (modèle legacy) — réutilisée pour les deux modèles.

COMMENT ON COLUMN shops.trial_model IS
  'legacy = comportement actuel inchangé (is_active/plan font foi, status ignoré).
   free_orders = boutique publique dès le 1er produit + 3 commandes offertes
   (status fait foi). DEFAULT ''legacy'' : aucun changement pour les boutiques
   existantes.';
COMMENT ON COLUMN shops.trial_started_at IS
  'Posée par activateTrialShop à la publication du 1er produit (écran 10 de
   /start), en même temps que status=''trial''. NULL pour trial_model=''legacy''.';
COMMENT ON COLUMN shops.trial_extended_at IS
  'Posée une seule fois si le marchand obtient la prolongation de 7 jours après
   avoir partagé son lien (cas B de la fin d''essai, §7 de la spec). Une boutique
   ne peut être prolongée qu''une fois.';
COMMENT ON COLUMN shops.free_orders_used IS
  'Incrémentée atomiquement par le trigger trg_free_order_quota à chaque
   commande reçue (annulée ou non — pas de restitution automatique).';
COMMENT ON COLUMN shops.free_orders_quota IS
  'Nombre de commandes offertes avant passage en expired. Par boutique et non
   une constante globale : permet au support de restituer un quota (UPDATE +1)
   et un test à N commandes différent sur une cohorte, sans migration.';

ALTER TABLE orders
  ADD COLUMN is_held          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN held_notified_at TIMESTAMPTZ,
  ADD COLUMN released_at      TIMESTAMPTZ;

COMMENT ON COLUMN orders.is_held IS
  'true = commande reçue sur une boutique free_orders au-delà du quota (ou déjà
   expired) : montant et articles visibles au marchand, coordonnées client
   masquées jusqu''à activation. Posée par le trigger, jamais par le client.';
COMMENT ON COLUMN orders.held_notified_at IS
  'Posée une seule fois par le cron horaire notify-held-orders quand la commande
   est retenue depuis plus de 48h — évite un second message au client.';
COMMENT ON COLUMN orders.released_at IS
  'Posée par activate_free_orders_shop() quand la boutique s''active. Une
   commande déjà libérée le reste même si la boutique repasse expired plus tard
   (résiliation) : on ne re-masque jamais des coordonnées déjà montrées.';

-- Le comptage des commandes retenues non résolues (fermeture du bouton de
-- commande, §5 de la spec) s'exécute à chaque rendu de page boutique publique.
CREATE INDEX idx_orders_held ON orders (shop_id)
  WHERE is_held = true AND released_at IS NULL;
