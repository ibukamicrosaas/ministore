# BeautyDesk — Backlog technique

> Ce fichier centralise les décisions techniques différées, la dette technique acceptée,
> et les fonctionnalités identifiées mais volontairement repoussées à une phase ultérieure.
> Chaque entrée doit indiquer le contexte, la solution envisagée et la priorité.

---

## AUTH

### [PRIORITÉ HAUTE] Reset du code PIN oublié

**Contexte :**
L'authentification utilise un numéro de téléphone + code PIN à 6 chiffres (stocké
comme mot de passe bcrypt dans Supabase Auth). Si une utilisatrice oublie son PIN,
il n'existe actuellement aucun mécanisme de récupération automatique dans l'app.
Contournement temporaire : réinitialisation manuelle par l'admin depuis
Supabase Dashboard → Authentication → Users.

**Solution envisagée :**
Flux de réinitialisation via WhatsApp :
1. L'utilisatrice clique "PIN oublié" sur l'écran de connexion
2. Elle saisit son numéro de téléphone
3. Le système envoie un code temporaire à 6 chiffres sur WhatsApp (via Twilio)
4. Elle entre le code + choisit un nouveau PIN
5. `supabase.auth.updateUser({ password: newPin })` depuis une Server Action
6. Code temporaire invalidé (TTL 10 minutes, stocké en mémoire ou dans une table dédiée)

**Dépendances :** Twilio WhatsApp configuré (déjà prévu en Phase 4)
**À implémenter en :** Phase 6 — Polish & Multi-salon
**Fichiers concernés :**
- `src/app/login/LoginForm.tsx` — ajouter lien "PIN oublié"
- `src/app/login/reset-pin/page.tsx` — nouveau flow à créer
- `src/lib/actions/auth.ts` — ajouter `resetPin()` et `confirmPinReset()`
- `src/app/api/auth/request-pin-reset/route.ts` — envoi WhatsApp + stockage token

---

## PAIEMENTS

### [PRIORITÉ MOYENNE] Remboursements automatiques via API

**Contexte :**
Actuellement, quand une réservation est annulée avec remboursement éligible,
le système crée un enregistrement `payments` avec `payment_type: 'refund'`
et `status: 'pending'`. Le remboursement réel n'est pas déclenché automatiquement.

**Solution envisagée :**
- Moneroo : appeler l'API de remboursement Moneroo avec le `provider_payment_id`
- Stripe : appeler `stripe.refunds.create({ payment_intent: ... })`
- Mettre à jour le statut en `processed` via webhook de confirmation

**À implémenter en :** Phase 4 — Rappels & Notifications
**Fichiers concernés :**
- `src/app/api/bookings/[id]/cancel/route.ts`
- `src/lib/payments/moneroo.ts` — ajouter `createMonerooRefund()`
- `src/lib/payments/stripe.ts` — ajouter `createStripeRefund()`

---

## SÉCURITÉ

### [PRIORITÉ BASSE] Rate limiting sur les tentatives de connexion

**Contexte :**
Supabase applique un rate limiting natif sur les tentatives de connexion
(5 tentatives / heure par email par défaut). Suffisant pour la phase de lancement.
Pour une montée en charge, envisager un rate limiting applicatif supplémentaire.

**Solution envisagée :** Middleware avec compteur Redis (Upstash) ou table Supabase
**À implémenter en :** Phase 6 ou à la demande selon les incidents observés

---

## UX

### [PRIORITÉ BASSE] Onboarding guidé étape par étape

**Contexte :**
L'onboarding actuel crée le salon en une seule étape. Les nouvelles utilisatrices
ne sont pas guidées pour configurer leurs services et employées juste après.

**Solution envisagée :** Wizard multi-étapes post-création (salon → 1er service → 1ère employée)
**À implémenter en :** Phase 6 — Polish & Multi-salon
