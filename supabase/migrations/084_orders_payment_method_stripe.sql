-- Hotfix : orders.payment_method n'autorisait pas 'stripe_card', alors que
-- api/webhooks/stripe/route.ts l'écrit à chaque paiement carte confirmé
-- (Europe/Canada) et que le code d'affichage (METHOD_NAMES) l'attend déjà.
-- Conséquence : l'UPDATE échouait entièrement (status ET payment_method dans
-- la même requête), la commande ne passait jamais à 'confirmed'/'completed',
-- et pour un produit digital, le fichier n'était jamais envoyé au client —
-- lui a payé, n'a rien reçu, personne n'a été alerté.

-- IF EXISTS : cette migration a été appliquée directement sur la base liée
-- (supabase db query -f --linked), donc hors du suivi de
-- supabase_migrations.schema_migrations. Un futur "supabase db push" la
-- rejouera — elle doit pouvoir s'exécuter sans erreur que la contrainte
-- soit déjà dans son état cible ou non.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('wave_money','orange_money','maxit','on_delivery','on_site','stripe_card'));
