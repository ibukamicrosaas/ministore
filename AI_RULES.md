# AI_RULES.md — BeautyDesk

> Règles obligatoires pour tout agent IA travaillant sur ce projet.
> Ces règles ont priorité sur toute autre instruction.

---

## 1. STACK — NE JAMAIS DÉVIER

```
Next.js 15        App Router uniquement — jamais Pages Router
React 19          Hooks uniquement — jamais class components
TypeScript        Mode strict — pas de 'any', pas de 'as unknown'
Tailwind CSS      Classes uniquement — zéro style inline, zéro CSS module
Supabase          Auth + PostgreSQL + Storage
Moneroo           Paiements mobile money (Wave, Orange Money, MTN, etc.)
Stripe            Paiements carte bancaire
WhatsApp API      Notifications (Twilio WABA ou Meta WABA directe)
Cloudinary        Upload et stockage des images
Vercel            Déploiement et cron jobs
npm               Gestionnaire de paquets — jamais yarn ni pnpm
```

---

## 2. STRUCTURE DES FICHIERS — RESPECTER STRICTEMENT

```
src/
  app/                          → Routes Next.js App Router
    [salon-slug]/               → PWA publique du salon
    dashboard/                  → Back-office salon (protégé)
    api/                        → Route Handlers uniquement
    login/
    onboarding/
  components/
    ui/                         → Composants atomiques (Button, Input, etc.)
    booking/                    → Composants spécifiques réservation
    dashboard/                  → Composants back-office
    pwa/                        → Composants PWA client
  lib/
    supabase/
      client.ts                 → Client Supabase côté navigateur
      server.ts                 → Client Supabase côté serveur
      admin.ts                  → Client service role (webhooks uniquement)
    payments/
      moneroo.ts
      stripe.ts
    notifications/
      whatsapp.ts
    utils/
      availability.ts           → Calcul des créneaux disponibles
      commissions.ts            → Calcul des commissions
      slots.ts                  → Helpers créneaux horaires
  types/
    database.ts                 → Types générés depuis Supabase
    index.ts                    → Types métier
  constants/
    index.ts                    → Constantes globales
```

---

## 3. RÈGLES DE SÉCURITÉ — ABSOLUES

### Supabase
- **JAMAIS** utiliser la clé `service_role` dans du code exécuté côté client
- La clé `service_role` est utilisée UNIQUEMENT dans les webhooks (`/api/webhooks/`)
- **TOUTES** les tables ont RLS activé — vérifier avant chaque migration
- **TOUJOURS** tester les policies RLS avec un utilisateur anonyme et un utilisateur authentifié

### Données sensibles
- Les clés API Moneroo et Stripe des salons sont stockées en base (chiffrées)
- Elles ne sont JAMAIS exposées côté client
- Les webhooks vérifient TOUJOURS la signature avant traitement

### Authentification
- Les routes `/dashboard/*` sont protégées par middleware
- Les routes `/api/admin/*` vérifient le rôle `owner` avant tout traitement
- L'espace client PWA utilise un token de session signé (JWT court-durée)

---

## 4. RÈGLES DE CODE — OBLIGATOIRES

### TypeScript
```typescript
// INTERDIT
const data: any = response
const user = data as unknown as User

// OBLIGATOIRE
const { data, error } = await supabase.from('bookings').select('*')
if (error) throw new Error(error.message)
```

### Mutations de données
```typescript
// INTERDIT — appel Supabase côté client dans un composant
'use client'
const handleSubmit = async () => {
  const { data } = await supabase.from('bookings').insert(...)
}

// OBLIGATOIRE — Server Action
'use server'
export async function createBooking(formData: FormData) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('bookings').insert(...)
}
```

### Gestion d'erreurs
```typescript
// INTERDIT
const { data } = await supabase.from('salons').select('*')
return data // peut être null

// OBLIGATOIRE
const { data, error } = await supabase.from('salons').select('*')
if (error) {
  console.error('[getSalon]', error.message)
  return { error: 'Impossible de charger le salon.' }
}
if (!data) return { error: 'Salon introuvable.' }
return { data }
```

### Composants
- Tous les composants sont des fonctions — jamais de classes
- Les composants "use client" n'accèdent JAMAIS directement à Supabase
- Les données sont passées via props depuis les Server Components parents
- Les formulaires utilisent des Server Actions, pas des fetch() côté client

---

## 5. RÈGLES UI/UX — OBLIGATOIRES

### Mobile-first
- Concevoir pour 375px EN PREMIER
- Utiliser `md:` et `lg:` pour les adaptations desktop
- Ne jamais supposer que l'utilisateur est sur desktop

### Tailwind
```tsx
// INTERDIT
<div style={{ backgroundColor: '#E85D04', padding: '16px' }}>

// OBLIGATOIRE
<div className="bg-orange-600 p-4">

// Pour les couleurs dynamiques du salon (couleur configurable)
// Utiliser des CSS variables injectées via le layout
<div style={{ '--color-primary': salon.primary_color } as React.CSSProperties}>
  <button className="bg-[var(--color-primary)]">
```

### États de chargement
- Chaque action asynchrone affiche un état de chargement
- Les listes utilisent des skeletons pendant le chargement
- Les boutons de soumission sont désactivés pendant le traitement

### Feedback utilisateur
- Chaque action réussie affiche un toast de confirmation
- Chaque erreur affiche un message clair avec une action corrective
- Les formulaires valident en temps réel (côté client) ET à la soumission (côté serveur)

---

## 6. RÈGLES MÉTIER — NE JAMAIS CONTOURNER

### Réservations
- Un créneau = une seule réservation active à la fois par employée
- Une réservation `pending` sans paiement expire après 30 minutes (cron job)
- Seul un statut `completed` déclenche le calcul des commissions
- Le montant de l'acompte est calculé au moment de la réservation et ne change pas

### Paiements
- Un paiement n'est confirmé QUE via webhook — jamais sur la redirection de retour
- Chaque webhook est idempotent : traiter le même event deux fois ne crée pas de doublon
- Tout remboursement est loggé dans la table `payments` avec type `refund`

### Commissions
- Commission = `total_price × (commission_rate / 100)`, arrondi à l'entier inférieur
- Si `remuneration_type = 'fixed_salary'`, aucune commission n'est créée
- Les commissions d'une semaine sont calculées du lundi au dimanche (ISO week)

### Notifications WhatsApp
- Chaque notification est loggée dans `notification_logs`
- En cas d'échec d'envoi, logguer l'erreur sans bloquer le flux principal
- Ne jamais bloquer une réservation parce qu'une notification a échoué

---

## 7. CE QUE L'AGENT NE DOIT PAS FAIRE

- ❌ Créer des fichiers `.css` ou `.scss`
- ❌ Utiliser `useState` pour des données qui viennent de la base
- ❌ Appeler Supabase directement dans un composant `use client`
- ❌ Hardcoder des clés API, des URLs ou des montants
- ❌ Créer des tables Supabase sans activer RLS
- ❌ Utiliser `localStorage` pour stocker des données sensibles
- ❌ Ignorer les erreurs Supabase (retourner `data` sans vérifier `error`)
- ❌ Créer des pages sans gestion des états de chargement et d'erreur
- ❌ Utiliser `yarn` ou `pnpm` — uniquement `npm`
- ❌ Modifier les fichiers `AI_RULES.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `PRD.md`

---

## 8. VARIABLES D'ENVIRONNEMENT REQUISES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Moneroo
MONEROO_API_KEY=
MONEROO_WEBHOOK_SECRET=

# WhatsApp (Twilio WABA)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://beautydesk.app
NEXT_PUBLIC_APP_NAME=BeautyDesk
CRON_SECRET=
```
