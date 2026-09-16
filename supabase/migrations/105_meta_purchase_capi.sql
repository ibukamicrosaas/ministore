-- Support de l'événement Purchase Meta Conversions API côté serveur.
--
-- Contexte : le pixel Meta Purchase actuel (PixelPurchase.tsx) ne se
-- déclenche que si le client recharge la page de succès de commande —
-- peu fiable pour le paiement mobile money (redirection de retour souvent
-- jamais atteinte). Aucun envoi serveur n'existe aujourd'hui pour Purchase
-- (sendMetaConversionEvent n'est utilisée que pour Lead/CompleteRegistration
-- à l'inscription marchand, jamais branchée sur le flux commande).
--
-- Option retenue (A, solution immédiate) : chaque marchand colle son propre
-- jeton d'accès système Meta Conversions API dans Paramètres — même pattern
-- que bictorys_secret_key. Une demande "Conversions API as a Platform"
-- auprès de Meta est déposée en parallèle (Option B, permettrait à terme un
-- flux guidé sans copier-coller de jeton) mais dépend d'une validation
-- externe hors de notre contrôle ; cette migration ne dépend pas de son issue.

-- 1. Idempotence + capture _fbp/_fbc à la création de commande.
--    _fbp/_fbc ne peuvent PAS être lus depuis le webhook Bictorys/Stripe qui
--    déclenchera l'envoi Purchase : un webhook est appelé serveur-à-serveur
--    par le prestataire, sans aucun cookie du navigateur du client. Ils
--    doivent donc être capturés en amont, à la création de la commande
--    (api/orders/route.ts, appelée par le navigateur du client, cookies
--    disponibles), puis relus par le webhook au moment de l'envoi.
ALTER TABLE orders
  ADD COLUMN meta_purchase_event_id TEXT,
  ADD COLUMN fbp                    TEXT,
  ADD COLUMN fbc                    TEXT;

COMMENT ON COLUMN orders.meta_purchase_event_id IS
  'event_id déterministe (purchase_{order.id}) envoyé à Meta Conversions API
   à la confirmation de paiement — NULL tant que jamais envoyé. Sert de
   garde-fou anti-doublon (vérifié avant tout envoi) et de trace d''audit.
   Partagé avec l''event_id du pixel navigateur (PixelPurchase.tsx) pour la
   déduplication Meta entre les deux sources.';

COMMENT ON COLUMN orders.fbp IS
  'Cookie _fbp du navigateur client, capturé à la création de commande
   (api/orders/route.ts) — nécessaire à l''appariement Conversions API,
   illisible depuis un webhook serveur-à-serveur (Bictorys/Stripe).';

COMMENT ON COLUMN orders.fbc IS
  'Cookie _fbc du navigateur client (présent seulement si arrivée via un
   clic publicitaire Meta) — même capture que fbp, même limitation webhook.';

-- 2. Jeton Conversions API par boutique (Option A) — colonne sensible,
--    même table que bictorys_secret_key/bictorys_webhook_secret, jamais sur
--    shops directement (audit sécurité §109, migration 103 : shops_public_read
--    est une policy RLS qui ne filtre jamais les colonnes, voir point 3).
--    Chiffrement applicatif (encryptApiKey) avant écriture, comme les clés
--    Bictorys — pas de chiffrement au niveau SQL.
ALTER TABLE shop_payment_secrets
  ADD COLUMN meta_conversions_api_token TEXT;

COMMENT ON COLUMN shop_payment_secrets.meta_conversions_api_token IS
  'Jeton d''accès système Meta Conversions API du marchand, collé depuis
   Paramètres (Option A), chiffré applicativement (encryptApiKey) avant
   écriture — même pattern que bictorys_secret_key. Permet à
   sendMetaConversionEvent d''envoyer Purchase vers le pixel du MARCHAND
   plutôt que le pixel global TekkiShop (NEXT_PUBLIC_META_PIXEL_ID/
   META_CONVERSIONS_API_TOKEN, réservés au funnel d''inscription).';

-- 3. Indicateur public de présence (booléen, jamais le jeton) — même
--    pattern que shops.bictorys_key_configured (migration 103). Vérifié
--    avant écriture : shops_public_read (078_is_active_overrides_status.sql)
--    est une CREATE POLICY ... FOR SELECT USING (condition sur les LIGNES),
--    pas une vue à liste de colonnes explicite — RLS Postgres ne filtre
--    jamais les colonnes, cette colonne sera donc automatiquement lisible
--    publiquement pour toute boutique déjà lisible par cette policy, sans
--    modification de la policy elle-même.
ALTER TABLE shops
  ADD COLUMN meta_capi_configured BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN shops.meta_capi_configured IS
  'Indicateur public que la boutique a configuré son jeton Conversions API
   (Option A) — remplace toute lecture de
   shop_payment_secrets.meta_conversions_api_token qui ne s''en servirait
   que comme présence/absence, écrit par updateShop() dans le même appel
   que le vrai jeton.';
