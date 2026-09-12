-- Extraction des colonnes financières sensibles de shops vers une table dédiée
-- (audit sécurité §109, finding critique #1).
--
-- shops_public_read filtre correctement les LIGNES (boutiques actives) mais
-- RLS Postgres ne filtre jamais les COLONNES : n'importe quelle boutique
-- publiquement lisible exposait aussi payout_wave_number, payout_om_number,
-- bictorys_secret_key, bictorys_webhook_secret, moneroo_api_key,
-- stripe_customer_id, stripe_subscription_id à quiconque possède la clé
-- anon publique (GET /rest/v1/shops?select=<colonne>, aucune authentification
-- requise). Vérifié en direct : 167/132 boutiques sur 274 publiquement
-- lisibles exposaient un vrai numéro Wave/Orange Money.
--
-- shop_payment_secrets isole ces colonnes dans une table à part, avec une
-- RLS restreinte au propriétaire (même mécanisme que shops_owner_update :
-- get_my_shop_id()/get_my_role()) — aucune policy INSERT/DELETE pour
-- authenticated/public : une ligne est créée pour chaque boutique existante
-- (backfill ci-dessous) et pour chaque nouvelle boutique (trigger), donc le
-- code applicatif n'a jamais besoin d'insérer, seulement de faire UPDATE.
-- service_role (client admin) contourne RLS par nature, aucune policy requise
-- pour lui.
--
-- bictorys_key_configured (booléen, reste sur shops, donc public) remplace
-- les ~20 lectures de bictorys_secret_key qui ne s'en servaient que comme
-- indicateur de présence (dont plusieurs sur les pages boutique/produit
-- PUBLIQUES, pour afficher "paiement en ligne disponible") — sans lui, ces
-- pages à fort trafic auraient dû faire une jointure supplémentaire pour une
-- simple question booléenne. payout_wave_number/payout_om_number n'ont pas
-- cet usage public (uniquement dashboard marchand authentifié + contexte
-- admin/IA en service_role) — pas de colonne miroir nécessaire pour eux, ces
-- quelques endroits interrogent shop_payment_secrets directement.
--
-- Les anciennes colonnes restent sur shops dans cette migration (pas de DROP
-- COLUMN ici) — période d'observation avant une migration 104 séparée qui les
-- supprimera, une fois confirmé en production qu'aucune lecture directe ne
-- subsiste. Si un appel oublié réapparaît, il continue de fonctionner sur
-- l'ancienne colonne le temps du correctif plutôt qu'un 500 immédiat.

CREATE TABLE shop_payment_secrets (
  shop_id                 UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  payout_wave_number      TEXT,
  payout_om_number        TEXT,
  bictorys_secret_key     TEXT,
  bictorys_webhook_secret TEXT,
  moneroo_api_key         TEXT,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shop_payment_secrets IS
  'Colonnes financières sensibles extraites de shops (audit sécurité §109,
   finding critique #1) — jamais exposées via shops_public_read. Relation 1:1
   avec shops, une ligne par boutique (créée au backfill puis par trigger à
   la création de boutique), lue/écrite uniquement par le propriétaire
   authentifié (RLS) ou service_role (webhooks, payouts, IA, admin).';

ALTER TABLE shop_payment_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_payment_secrets_owner_select ON shop_payment_secrets
  FOR SELECT
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

CREATE POLICY shop_payment_secrets_owner_update ON shop_payment_secrets
  FOR UPDATE
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'owner');

-- Recherche webhook Stripe (customer.subscription.* → shop par stripe_customer_id)
CREATE UNIQUE INDEX shop_payment_secrets_stripe_customer_id_idx
  ON shop_payment_secrets (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Colonne miroir publique — présence de la clé Bictorys propre à la boutique,
-- jamais la valeur elle-même. Écrite explicitement par updateShop() dans le
-- même appel que l'écriture de la vraie clé, pas de trigger de synchronisation.
ALTER TABLE shops ADD COLUMN bictorys_key_configured BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN shops.bictorys_key_configured IS
  'Indicateur public (booléen) que la boutique a configuré sa propre clé
   Bictorys — remplace les lectures de shops.bictorys_secret_key qui ne
   s''en servaient que comme présence/absence, y compris sur les pages
   boutique/produit publiques. La vraie clé vit dans
   shop_payment_secrets.bictorys_secret_key, jamais lue publiquement.
   Maintenu à jour par le code applicatif (updateShop), pas par trigger.';

-- Backfill : une ligne par boutique existante, valeurs copiées telles quelles.
INSERT INTO shop_payment_secrets (
  shop_id, payout_wave_number, payout_om_number,
  bictorys_secret_key, bictorys_webhook_secret, moneroo_api_key,
  stripe_customer_id, stripe_subscription_id
)
SELECT
  id, payout_wave_number, payout_om_number,
  bictorys_secret_key, bictorys_webhook_secret, moneroo_api_key,
  stripe_customer_id, stripe_subscription_id
FROM shops;

UPDATE shops SET bictorys_key_configured = (bictorys_secret_key IS NOT NULL);

-- Nouvelle boutique → ligne shop_payment_secrets correspondante créée
-- automatiquement, pour que le code applicatif n'ait jamais besoin d'un
-- INSERT direct (donc pas de policy INSERT authenticated/public nécessaire).
CREATE OR REPLACE FUNCTION create_shop_payment_secrets_row()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO shop_payment_secrets (shop_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER shops_create_payment_secrets_row
  AFTER INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION create_shop_payment_secrets_row();
