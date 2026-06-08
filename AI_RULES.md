# AI_RULES.md — TEKKIShop

> Règles obligatoires pour tout agent IA travaillant sur ce projet.
> Ces règles ont priorité sur toute autre instruction.

---

## 1. STACK — NE JAMAIS DÉVIER

```
Next.js 15        App Router uniquement — jamais Pages Router
React 19          Hooks uniquement — jamais class components
TypeScript        Mode strict — pas de 'any', pas de 'as unknown'
Tailwind CSS      Classes uniquement — zéro style inline, zéro CSS module
Supabase          Auth + PostgreSQL + Storage + RLS
Bictorys          Paiements multi-pays (Wave, Orange Money, Maxit)
Twilio SMS        Notifications SMS + WhatsApp (fallback SMS en prod)
Supabase Storage  Images produits/logos (uploads publics)
Cloudinary        Image delivery optimisée (delegated upload)
Vercel            Déploiement + Cron jobs (Vercel Cron)
npm               Gestionnaire de paquets — jamais yarn ni pnpm
Branding          #0EA5E9 (sky blue), Outfit + DM Sans
```

---

## 2. STRUCTURE DES FICHIERS — RESPECTER STRICTEMENT

```
src/
  app/                          → Routes Next.js App Router
    [shop-slug]/                → PWA publique du mini-site
    dashboard/                  → Back-office propriétaire (protégé)
    api/                        → Route Handlers uniquement
    login/
  components/
    ui/                         → Composants atomiques (Button, Input, Select, etc.)
    booking/                    → Composants spécifiques commande (OrderForm, etc.)
    dashboard/                  → Composants back-office (Sidebar, OrderRow, etc.)
    pwa/                        → Composants PWA mini-site (ShopHeader, ProductGrid, etc.)
  lib/
    supabase/
      client.ts                 → Client Supabase côté navigateur
      server.ts                 → Client Supabase côté serveur
      admin.ts                  → Client service role (webhooks + cron uniquement)
    payments/
      bictorys.ts               → createBictorysCharge(), verifyWebhook()
      webhook.ts                → Helpers vérification signature
    notifications/
      sms.ts                    → sendSMS(), templates
      templates.ts              → Message templates
    utils/
      formatting.ts             → formatPrice(), formatDate()
      validation.ts             → Validation helpers
      phone.ts                  → detectCountryFromPhone(), normalizePhone()
      crypto.ts                 → timingSafeEqual()
  types/
    database.ts                 → Types générés depuis Supabase
    index.ts                    → Types métier (OrderStatus, PaymentStatus, etc.)
    bictorys.ts                 → Types API Bictorys
  constants/
    pricing.ts                  → Configuration plans (Découverte, Business, Pro)
    countries.ts                → Countries + country prefixes (+225, +221, etc.)
    index.ts                    → Autres constantes globales
  actions/
    orders.ts                   → Server Actions gestion commandes
    products.ts                 → Server Actions gestion produits
    settings.ts                 → Server Actions paramètres boutique
    subscriptions.ts            → Server Actions abonnement
```

---

## 3. RÈGLES DE SÉCURITÉ — ABSOLUES

### Supabase
- **JAMAIS** utiliser la clé `service_role` dans du code côté client
- La clé `service_role` est utilisée UNIQUEMENT dans les webhooks et cron jobs (`/api/webhooks/`, `/api/cron/`)
- **TOUTES** les tables ont RLS activé — vérifier avant chaque migration
- **TOUJOURS** tester les policies RLS avec un utilisateur anonyme et un utilisateur authentifié

### Données sensibles & Paiements
- Clés Bictorys webhook : jamais hardcodées, toujours via `process.env.BICTORYS_WEBHOOK_SECRET`
- Montants financiers : TOUJOURS calculés côté serveur depuis la DB, jamais du client
- Variantes de prix : TOUJOURS validées contre la DB
- Signatures webhook : vérifiées avec `crypto.timingSafeEqual()` (pas `===`)

### Authentification & Autorisation
- Routes `/dashboard/*` : protégées par middleware (redirection `/login` si pas de session)
- Routes `/api/admin/*` : vérifier rôle `owner` en Server Action
- Routes `/api/cron/*` : vérifier `Authorization: Bearer CRON_SECRET` avec `timingSafeEqual()`
- Ressources dans `/api/*` : vérifier que l'utilisateur a accès (IDOR check)

---

## 4. RÈGLES DE CODE — OBLIGATOIRES

### TypeScript
```typescript
// INTERDIT
const data: any = response
const user = data as unknown as User
const orderId: any = req.body.order_id

// OBLIGATOIRE
const { data, error } = await supabase.from('orders').select('*')
if (error) throw new Error(error.message)
const orderId = params.id as string  // avec validation après
```

### Mutations de données
```typescript
// INTERDIT — appel Supabase côté client dans un composant
'use client'
const handleSubmit = async () => {
  const { data } = await supabase.from('orders').insert(...)
}

// OBLIGATOIRE — Server Action
'use server'
export async function createOrder(formData: FormData) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('orders').insert(...)
  if (error) throw new Error(error.message)
}
```

### Gestion d'erreurs
```typescript
// INTERDIT — erreurs exposent détails techniques
return { error: 'Foreign key violation on shops.id' }
return { error: 'JWT expired at 2026-01-01T00:00:00Z' }

// OBLIGATOIRE — messages génériques client, logs serveur
console.error('[createOrder]', error.message)  // logs détails
return { error: 'Impossible de créer la commande. Réessayez.' }  // client
```

### Montants financiers
```typescript
// INTERDIT — montant vient du client
const { amount } = await req.json()
await createBictorysCharge({ amount })

// OBLIGATOIRE — montant calculé depuis la DB
const order = await supabase.from('orders').select('*').eq('id', orderId).single()
if (!order) throw new Error('Order not found')
const totalPrice = order.total_price  // inclut livraison + promo appliqué
await createBictorysCharge({ amount: totalPrice })
```

### Composants
- Tous les composants sont des fonctions — jamais de classes
- Les composants "use client" n'accèdent JAMAIS directement à Supabase
- Les données sont passées via props depuis les Server Components parents
- Les formulaires utilisent des Server Actions via `<form action={serverAction}>`

---

## 5. RÈGLES UI/UX — OBLIGATOIRES

### Mobile-first
- Concevoir pour 375px EN PREMIER (réseau 3G lent = marché principal)
- Utiliser `md:` et `lg:` pour les adaptations desktop
- LCP < 2s sur 3G (tester avec DevTools Chrome throttling)
- Pas de scrolling horizontal sur mobile (max-width: 100vw)

### Tailwind
```tsx
// INTERDIT
<div style={{ backgroundColor: '#E85D04', padding: '16px' }}>
<button style={{color: shop.primary_color}}>

// OBLIGATOIRE
<div className="bg-orange-600 p-4">
<div style={{ '--color-primary': shop.primary_color } as React.CSSProperties}>
  <button className="bg-[var(--color-primary)] hover:opacity-90">
```

### États de chargement
- Chaque action async affiche skeleton ou spinner
- Boutons de soumission: `disabled={isLoading}` pendant traitement
- Listes: loader jusqu'à fetch complet
- Redirects: pas de loader (redirection silencieuse)

### Feedback utilisateur
- Chaque action réussie: toast/toast avec message
- Chaque erreur: message clair + action corrective
- Formulaires: validation client-side (UX) ET server-side (sécurité)
- Validations inline: erreur par champ au blur/change

---

## 6. RÈGLES MÉTIER — NE JAMAIS CONTOURNER

### Commandes
- Stock décrémenté via RPC atomique `decrement_stock_if_available()`
- Commande `pending` : paiement non confirmé dans les 30 min (future implementation)
- Seul le webhook Bictorys confirme le paiement (jamais la redirection de retour)
- Chaque webhook idempotent : traiter 2× le même event = 1 seule mutation
- Status transitions : pending → confirmed → preparing → ready → delivered (ou cancelled)

### Paiements Bictorys
- Signature webhook vérifiée avec `timingSafeEqual()` (pas `===`)
- Montant TOUJOURS lu depuis la DB, jamais du client
- Identifiant payment : `payment_reference` Bictorys (unique, idempotence key)
- Statuts acceptés : 'succeed' ET 'succeeded' (Bictorys inconsistency)
- Détection pays : depuis phone prefix (+225→CI, +221→SN, etc.), fallback shop.country

### Codes promo
- Validation server-side AVANT paiement
- Unicité par boutique (UNIQUE(shop_id, code))
- Expiration via `expires_at < NOW()`
- Limite utilisation via `used_count < max_uses`
- Increment `used_count` APRÈS paiement confirmé, jamais avant

### Stock
- Alerte déclenchée si `stock_count <= stock_alert_threshold`
- SMS envoyé au marchand immédiatement après décrémentation
- Produit masqué du catalogue public si stock = 0

### Abonnements
- Trial : 30j gratuit, max 10 produits, plan='trial'
- Expiration : si `subscription_ends_at < NOW()` → `is_active = false`
- Renouvellement : `subscription_ends_at = NOW() + 1 mois` après paiement confirmé
- Cron job 1/jour (3 AM) : vérifie subscriptions pending, active si confirmées

### Notifications SMS
- Chaque changement de status → SMS au client
- Chaque nouvelle commande → SMS au marchand
- Alertes stock → SMS au marchand
- Chaque notification loggée dans `notification_logs`
- Pas de blocage si envoi SMS échoue (log + continue)

---

## 7. CE QUE L'AGENT NE DOIT PAS FAIRE

- ❌ Créer des fichiers `.css` ou `.scss` (Tailwind uniquement)
- ❌ Utiliser `useState` pour des données qui viennent de la base (fetch côté serveur)
- ❌ Appeler Supabase directement dans un composant `use client` (Server Actions)
- ❌ Hardcoder clés API, URLs ou montants (`.env` uniquement)
- ❌ Créer tables Supabase sans activer RLS (CRITICAL)
- ❌ Utiliser `localStorage` pour données sensibles (phone, order_id, auth tokens)
- ❌ Ignorer erreurs Supabase (toujours vérifier `error` avant retourner `data`)
- ❌ Créer pages sans gestion loading + error states
- ❌ Utiliser `yarn` ou `pnpm` (npm uniquement)
- ❌ Utiliser `===` pour comparer secrets webhook (toujours `timingSafeEqual()`)
- ❌ Modifier fichiers: `AI_RULES.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `PRD.md`
- ❌ Créer SVG inline dans JSX (utiliser `<img>` ou `<Image unoptimized>`)
- ❌ Utiliser parseInt/parseFloat sur montants (utiliser numbers directement)

---

## 8. VARIABLES D'ENVIRONNEMENT REQUISES

```env
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...

# Bictorys Paiements (obligatoire)
NEXT_PUBLIC_BICTORYS_PUBLIC_KEY=
BICTORYS_API_KEY=
BICTORYS_WEBHOOK_SECRET=
BICTORYS_API_TIMEOUT_MS=10000

# Twilio SMS (obligatoire)
TWILIO_ACCOUNT_SID=ACxx...
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1234567890

# Cloudinary (optionnel, fallback Supabase Storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Vercel App Config (obligatoire)
NEXT_PUBLIC_APP_URL=https://tekki.shop
NEXT_PUBLIC_APP_NAME=TEKKIShop

# Security & Cron (obligatoire)
CRON_SECRET=crypto.randomBytes(32).toString('hex')  # Au moins 64 chars
NODE_ENV=production

# Analytics (optionnel)
SENTRY_DSN=
```

**Validation au démarrage :**
```typescript
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BICTORYS_WEBHOOK_SECRET',
  'TWILIO_ACCOUNT_SID',
  'CRON_SECRET',
]
for (const key of requiredEnvVars) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`)
}
```
