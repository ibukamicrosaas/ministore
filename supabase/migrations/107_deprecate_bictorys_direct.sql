-- Documente comme obsolètes les colonnes du paiement direct Bictorys (plan
-- Pro), retiré le 2026-09 : 0 boutique, active ou non, ne les a jamais
-- configurées (vérifié en base avant ce chantier), et le retrait instantané
-- depuis Revenus rend l'option redondante. Aucune colonne supprimée — DROP
-- non justifié pour des colonnes déjà vides, garde la porte ouverte à une
-- future intégration différente (ex. "Conversions API as a Platform"-style
-- partenariat plutôt qu'un champ à coller, cf. REPRISE.md §130 sur Meta CAPI
-- pour un précédent de ce raisonnement).
--
-- Plus aucun code ne lit ni n'écrit ces colonnes depuis ce chantier — la
-- seule route qui consultait bictorys_secret_key (api/payments/bictorys/
-- create/route.ts) utilise désormais uniquement la clé plateforme.
-- bictorys_webhook_secret n'a en réalité jamais été consultée nulle part :
-- la vérification de signature webhook (api/webhooks/bictorys/route.ts)
-- n'a toujours utilisé que BICTORYS_WEBHOOK_SECRET (clé plateforme).

COMMENT ON COLUMN shop_payment_secrets.bictorys_secret_key IS
  'OBSOLÈTE (2026-09) — paiement direct Bictorys par boutique retiré, 0
   boutique ne l''a jamais configuré. Colonne conservée (pas de DROP), plus
   lue ni écrite par aucun code depuis ce chantier. Voir REPRISE.md.';

COMMENT ON COLUMN shop_payment_secrets.bictorys_webhook_secret IS
  'OBSOLÈTE (2026-09) — jamais consultée par aucun code, même avant ce
   retrait (la vérification de signature webhook a toujours utilisé la clé
   plateforme BICTORYS_WEBHOOK_SECRET, jamais celle-ci). Conservée, pas de
   DROP. Voir REPRISE.md.';

COMMENT ON COLUMN shops.bictorys_key_configured IS
  'OBSOLÈTE (2026-09) — miroir public de bictorys_secret_key, toujours false
   désormais (plus aucune écriture). Conservée pour compatibilité avec des
   lectures existantes, pas de DROP. Voir REPRISE.md.';
