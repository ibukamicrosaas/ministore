# ARCHITECTURE.md — TEKKIShop

> Architecture technique complète du projet.
> Version 2.0 — Juin 2026 (Mise à jour depuis BeautyDesk)

---

## 1. Vue d'ensemble

TEKKIShop est une application web Next.js 15 (App Router) déployée sur Vercel, avec Supabase comme backend (auth + base de données + storage). Elle expose deux interfaces principales :

- **PWA publique** (`/[shop-slug]/...`) : accessible sans compte, optimisée mobile, utilisée par les clients pour commander
- **Back-office** (`/dashboard/...`) : protégé par authentification, utilisé par les propriétaires de boutique pour gérer commandes et produits

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Next.js 15)               │
│                                                     │
│   ┌──────────────┐        ┌──────────────────────┐  │
│   │   Mini-site  │        │   Back-office Admin  │  │
│   │  /[slug]/... │        │    /dashboard/...    │  │
│   └──────┬───────┘        └──────────┬───────────┘  │
│          │                           │              │
│   ┌──────▼───────────────────────────▼───────────┐  │
│   │              Server Actions + API Routes      │  │
│   └──────┬───────────────────────────┬───────────┘  │
└──────────┼───────────────────────────┼─────────────┘
           │                           │
    ┌──────▼──────┐           ┌────────▼────────┐
    │  Supabase   │           │    Services      │
    │  (DB + Auth)│           │  externes        │
    └─────────────┘           │  - Bictorys      │
                              │  - Twilio SMS    │
                              │  - Cloudinary    │
                              │  - Vercel Cron   │
                              └─────────────────┘
```

---

## 2. Structure des fichiers

```
ministore/
├── src/
│   ├── app/
│   │   ├── [shop-slug]/                   → PWA publique
│   │   │   ├── page.tsx                   → Page d'accueil boutique
│   │   │   ├── produit/
│   │   │   │   └── [id]/page.tsx          → Détail produit
│   │   │   ├── commander/
│   │   │   │   ├── page.tsx               → Formulaire commande
│   │   │   │   ├── pay/
│   │   │   │   │   ├── page.tsx           → Sélecteur méthodes paiement
│   │   │   │   │   ├── PaymentMethodSelector.tsx → Affichage méthodes avec logos
│   │   │   │   │   └── PaymentMethodCard.tsx    → Card avec logo réel + détails
│   │   │   │   ├── checkout/
│   │   │   │   │   ├── page.tsx           → Router vers composant approprié
│   │   │   │   │   ├── WaveCheckout.tsx   → Deep linking Wave Money
│   │   │   │   │   ├── OrangeMoneyCheckout.tsx → OTP Orange Money
│   │   │   │   │   └── BictorysCheckout.tsx    → Checkout Bictorys fallback
│   │   │   │   └── success/
│   │   │   │       └── page.tsx           → Confirmation commande
│   │   │   └── layout.tsx                 → Layout avec CSS variables couleur
│   │   │
│   │   ├── dashboard/                     → Back-office (protégé)
│   │   │   ├── layout.tsx                 → Layout avec sidebar
│   │   │   ├── page.tsx                   → Tableau de bord
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx               → Liste commandes
│   │   │   │   └── [id]/page.tsx          → Détail commande + actions
│   │   │   ├── products/
│   │   │   │   ├── page.tsx               → Catalogue produits
│   │   │   │   ├── new/page.tsx           → Ajouter produit
│   │   │   │   └── [id]/page.tsx          → Modifier produit
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx               → Base clients
│   │   │   │   └── [id]/page.tsx          → Détail client
│   │   │   ├── settings/
│   │   │   │   └── page.tsx               → Paramètres boutique
│   │   │   ├── upgrade/
│   │   │   │   ├── page.tsx               → Plans abonnement
│   │   │   │   └── checkout/page.tsx      → Paiement abonnement Bictorys
│   │   │   ├── reports/
│   │   │   │   └── page.tsx               → Rapports, export CSV
│   │   │   ├── affiliate/
│   │   │   │   └── page.tsx               → Program affiliation
│   │   │   └── orders/
│   │   │       └── [id]/page.tsx          → Détail commande
│   │   │
│   │   ├── api/
│   │   │   ├── shops/
│   │   │   │   └── [slug]/
│   │   │   │       ├── route.ts           → GET info boutique
│   │   │   │       └── products/route.ts  → GET produits boutique
│   │   │   ├── products/
│   │   │   │   └── [id]/route.ts          → GET détail produit
│   │   │   ├── orders/
│   │   │   │   ├── route.ts               → POST créer commande
│   │   │   │   ├── [id]/route.ts          → GET détail commande
│   │   │   │   ├── bictorys-checkout/route.ts → POST créer session Bictorys
│   │   │   │   ├── wave-payment/route.ts → POST enregistrer tentative Wave
│   │   │   │   ├── orange-money-payment/route.ts → POST session Orange Money
│   │   │   │   ├── verify-orange-otp/route.ts → POST vérifier OTP
│   │   │   │   └── [id]/verify-payment/route.ts → GET vérifier statut paiement
│   │   │   ├── checkout/
│   │   │   │   └── bictorys/
│   │   │   │       └── create/route.ts    → POST créer session Bictorys (legacy)
│   │   │   ├── webhooks/
│   │   │   │   └── bictorys/route.ts      → Webhook paiements Bictorys
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/route.ts     → GET KPIs
│   │   │   │   ├── orders/route.ts        → GET/PATCH commandes
│   │   │   │   ├── products/route.ts      → GET/POST/PATCH produits
│   │   │   │   ├── clients/route.ts       → GET clients
│   │   │   │   ├── settings/route.ts      → PATCH paramètres
│   │   │   │   ├── activate-subscription/route.ts → Activation manuelle
│   │   │   │   └── analytics/route.ts     → GET analytics
│   │   │   ├── export/
│   │   │   │   └── orders/route.ts        → GET CSV export
│   │   │   ├── promo-codes/
│   │   │   │   └── validate/route.ts      → GET valider code promo
│   │   │   ├── payments/
│   │   │   │   └── bictorys/
│   │   │   │       └── subscription/route.ts → POST session abonnement
│   │   │   └── cron/
│   │   │       └── verify-subscription-payments/route.ts → Vérification cron
│   │   │
│   │   ├── login/page.tsx
│   │   ├── layout.tsx                     → Layout racine
│   │   └── globals.css                    → Variables CSS + reset Tailwind
│   │
│   ├── components/
│   │   ├── ui/                            → Composants atomiques
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Select.tsx
│   │   │   └── index.ts
│   │   ├── booking/                       → Composants commande PWA
│   │   │   ├── ProductCard.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   ├── OrderSummary.tsx
│   │   │   └── PaymentForm.tsx
│   │   ├── dashboard/                     → Composants back-office
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── OrderRow.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── ProductForm.tsx
│   │   └── pwa/                           → Composants page boutique
│   │       ├── ShopHeader.tsx
│   │       ├── ProductGrid.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  → createBrowserClient()
│   │   │   ├── server.ts                  → createServerClient()
│   │   │   └── admin.ts                   → createAdminClient()
│   │   ├── payments/
│   │   │   ├── payment-methods.ts         → PAYMENT_METHODS_BY_COUNTRY, getCountryFromPhone()
│   │   │   ├── bictorys.ts                → createBictorysCharge(), detectCountryFromPhone(), verifyBictorysSignature()
│   │   │   └── webhook.ts                 → helpers webhook verification
│   │   ├── notifications/
│   │   │   ├── sms.ts                     → sendSMS(), templates
│   │   │   └── templates.ts               → Templates messages
│   │   ├── utils/
│   │   │   ├── formatting.ts              → formatPrice(), formatDate()
│   │   │   ├── validation.ts              → validation helpers
│   │   │   ├── phone.ts                   → detectCountryFromPhone()
│   │   │   └── crypto.ts                  → timingSafeEqual()
│   │   ├── constants/
│   │   │   ├── pricing.ts                 → Plans configs
│   │   │   └── countries.ts               → Countries + prefixes
│   │   └── actions/
│   │       ├── products.ts                → Server Actions produits
│   │       ├── orders.ts                  → Server Actions commandes
│   │       ├── settings.ts                → Server Actions settings
│   │       └── subscriptions.ts           → Server Actions abonnement
│   │
│   ├── types/
│   │   ├── database.ts                    → Types auto-générés Supabase
│   │   ├── index.ts                       → Types métier
│   │   └── bictorys.ts                    → Types Bictorys API
│   │
│   └── constants/
│       └── index.ts
│
├── supabase/
│   └── migrations/
│       ├── 001-012_schema.sql             → Migration de base
│       ├── 013_promo_codes.sql            → Codes promo
│       ├── 014_subscription_transactions.sql → Paiements abonnement
│       ├── 015_rls_policies.sql           → RLS finales
│       └── 016_indexes.sql                → Indexes optimisation
│
├── public/
│   ├── manifest.json                      → PWA manifest
│   ├── icone-tekkishop.svg                → Logo
│   └── favicon.png                        → Favicon
│
├── middleware.ts                          → Protection routes dashboard + custom domains
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Flux de données — Commande client

```
Client (téléphone)
    │
    ▼
PWA /[shop-slug] (affichage catalogue ISR revalidate=60)
    │
    │ Explore → /[shop-slug]/produit/[id] (détail + galerie)
    ▼
Sélectionne produits → /[shop-slug]/commander
    │
    │ Formulaire multi-articles
    │ - Sélectionne variantes + quantité
    │ - Sélectionne zone livraison (si définies)
    │ - Saisit nom + téléphone
    ▼
Server Action → createOrder()
    │ - Valide stock atomique via RPC decrement_stock_if_available()
    │ - Crée order avec status='pending'
    │ - Crée order_items
    │ - Retourne order_id + total_price
    ▼
/[shop-slug]/checkout?order_id=[id]
    │
    │ Server Component → fetch order + produits
    │ - Auto-détecte pays depuis customerPhone
    │ - Affiche moyens paiement disponibles (Wave, Orange, Maxit)
    ▼
SubscriptionCheckoutForm
    │ - Saisit nom complet
    │ - Saisit/confirme téléphone (pays auto-détecté)
    │ - Sélectionne méthode paiement
    │ - Si Orange Money CI/BF : saisit OTP
    ▼
Server Action → createBictorysCharge()
    │ - Appelle Bictorys API
    │ - Retourne link / url / confirmationLink
    ▼
Redirection vers checkout Bictorys
    │
    │ Paiement effectué par client
    ▼
Webhook POST /api/webhooks/bictorys
    │ - Vérifie signature HMAC
    │ - Extrait order_id depuis merchantReference
    │ - Vérification idempotence (si déjà traité, return 200)
    │ - Vérifie status = 'succeed' ou 'succeeded'
    │ - Met à jour order.status = 'confirmed'
    │ - Met à jour order.payment_status = 'completed'
    │ - Insère payment record
    │ - Crée/met à jour client dans clients table
    │ - Envoie SMS confirmation client
    │ - Envoie SMS alerte marchand
    ▼
Client redirigé vers /[shop-slug]/success?order_id=[id]
```

---

## 4. Flux de données — Changement statut commande

```
Marchand accède /dashboard/orders/[id]
    │
    ▼
Voit statut actuel (pending, confirmed, preparing, ready, delivered)
    │
    │ Clique "Confirmer" (si pending) ou "En préparation", "Prête", "Livrée"
    ▼
Server Action → updateOrderStatus(orderId, newStatus)
    │ - Valide transition autorisée
    │ - Met à jour order.status
    │ - Envoie SMS au client
    ▼
SMS envoyé via Twilio
    │
    ├── confirmed   → "Commande confirmée"
    ├── preparing   → "Votre commande est en préparation"
    ├── ready       → "Votre commande est prête"
    └── delivered   → "Livraison confirmée. Merci !"
```

---

## 5. Flux de paiement — Webhooks Bictorys

```
POST /api/webhooks/bictorys
    │
    ├── Lire rawBody pour vérification signature
    │
    ├── Vérifier signature HMAC (Bictorys webhook secret)
    │   │ timingSafeEqual(signature, expectedSignature)
    │   └── Invalide → return 401
    │
    ├── Parser JSON body
    │
    ├── Identifier le type de payload
    │   │
    │   ├── Commandes (via merchantReference = order_id)
    │   │   │
    │   │   ├── Extraire order_id depuis metadata
    │   │   │
    │   │   ├── Vérifier dans payment_logs si déjà traité
    │   │   │   └── Oui → return 200 (idempotent)
    │   │   │
    │   │   ├── Si status = 'succeed' ou 'succeeded'
    │   │   │   ├── UPDATE orders SET status='confirmed', payment_status='completed'
    │   │   │   ├── INSERT payments record
    │   │   │   ├── Upsert client dans clients table
    │   │   │   ├── sendSMS(customer_phone, 'order_confirmation')
    │   │   │   ├── sendSMS(shop.phone_whatsapp, 'new_order')
    │   │   │   └── Log notification_logs
    │   │   │
    │   │   └── Si status = 'failed'
    │   │       └── UPDATE orders SET payment_status='failed'
    │   │
    │   └── Abonnements (via merchantReference = sub-{shopId}-{planKey})
    │       │
    │       ├── Extraire shop_id et plan_key
    │       │
    │       ├── Vérifier statut actuel
    │       │   └── Déjà activé → return 200
    │       │
    │       ├── Si status = 'succeed' ou 'succeeded'
    │       │   ├── INSERT subscription_transactions (status='activated')
    │       │   ├── UPDATE shops SET subscription_ends_at = NOW() + 1 mois, plan='business'
    │       │   ├── UPDATE shops SET is_active = true
    │       │   ├── sendSMS(shop.phone_whatsapp, 'subscription_activated')
    │       │   └── Log notification_logs
    │       │
    │       └── Return 200
```

### Fallback Cron (1/jour - 3 AM)

```
GET /api/cron/verify-subscription-payments
    │
    ├── Vérifier header Authorization (Bearer CRON_SECRET)
    │
    ├── Fetch tous subscription_transactions avec status='pending'
    │
    ├── Pour chaque pending transaction
    │   │
    │   ├── Appeler Bictorys API avec charge_id
    │   │
    │   ├── Si status = 'succeeded'
    │   │   ├── UPDATE transaction status = 'activated'
    │   │   ├── Appeler updateShopPlan(shopId, planKey)
    │   │   └── sendSMS(shop.phone_whatsapp, 'subscription_activated')
    │   │
    │   └── Si status = 'failed'
    │       └── UPDATE transaction status = 'error'
    │
    └── Return 200
```

---

## 6. Middleware — Protection des routes + Custom domains

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  const host = request.headers.get('host')

  // Routes dashboard → authentification requise
  if (pathname.startsWith('/dashboard')) {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Routes API admin → rôle owner requis
  if (pathname.startsWith('/api/admin')) {
    const session = await getSession(request)
    if (!session || session.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  // Routes API cron → secret requis (timing-safe comparison)
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('Authorization') ?? ''
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
    if (!timingSafeEqual(authHeader, expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Custom domain routing (Pro plan)
  // Exemple: monboutique.com → /[monboutique-slug]/...
  if (host && !host.includes('tekki.shop') && !host.includes('localhost')) {
    // Fetch shop by custom_domain
    const shop = await getShopByCustomDomain(host)
    if (shop) {
      // Rewrite to /[shop.slug]/... without changing URL
      return NextResponse.rewrite(new URL(`/${shop.slug}${pathname}`, request.url))
    }
  }
}
```

---

## 7. PWA Configuration

```json
// public/manifest.json
{
  "name": "TEKKIShop",
  "short_name": "TEKKIShop",
  "description": "Votre boutique en ligne, simplement",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0EA5E9",
  "orientation": "portrait",
  "icons": [
    { "src": "/icone-tekkishop.svg", "sizes": "192x192", "type": "image/svg+xml" }
  ]
}
```

---

## 8. Cron Jobs (Vercel Cron)

Configuration via `vercel.json` ou `vercel.ts` (Next.js 15+) :

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-subscription-payments",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**`/api/cron/verify-subscription-payments`** (3 AM chaque matin) :
- Fetch toutes les subscriptions avec status='pending'
- Pour chaque pending : vérifier via API Bictorys si paiement confirmé
- Si confirmé : activer la subscription, mettre à jour shop.is_active = true
- Envoyer SMS au marchand si activée avec succès

---

## 9. Configuration des couleurs par boutique

Chaque boutique a une `primary_color` configurable (8 presets + custom). Cette couleur est injectée via le layout de la boutique comme variable CSS :

```tsx
// app/[shop-slug]/layout.tsx
export default async function ShopLayout({ params, children }) {
  const shop = await getShop(params['shop-slug'])

  // Fallback si boutique inactive
  if (!shop?.is_active) {
    return <InactiveShopPage shop={shop} />
  }

  return (
    <div
      style={{ '--color-primary': shop.primary_color } as React.CSSProperties}
      className="min-h-screen"
    >
      {children}
    </div>
  )
}
```

Dans les composants Tailwind :
```tsx
<button className="bg-[var(--color-primary)] text-white hover:opacity-90">
  Commander
</button>
```

---

## 10. Types principaux

```typescript
// src/types/index.ts

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export type PaymentMethod = 'wave' | 'orange_money' | 'maxit' | 'cash'

export type PlanKey = 'trial' | 'business' | 'pro'

export type NotificationType =
  | 'order_confirmation'
  | 'order_status'
  | 'stock_alert'
  | 'subscription'

export interface OrderItem {
  productId: string
  productName: string
  priceAtOrder: number  // FCFA
  quantity: number
  variantSelection?: Record<string, string>  // {"Couleur": "Rouge", "Taille": "M"}
}

export interface OrderFormData {
  items: OrderItem[]
  deliveryZoneName?: string
  deliveryPrice: number
  totalPrice: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  promoCode?: string
  discountAmount: number
  notes?: string
}

export interface ShopSettings {
  name: string
  description: string
  aboutText?: string
  logo_url?: string
  cover_url?: string
  primary_color: string
  address: string
  city: string
  country: string
  phone_whatsapp: string
  deliveryZones: Array<{ id: string; name: string; price: number }>
  accept_cash_on_delivery: boolean
  accept_online_payment: boolean
}

export interface DashboardStats {
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  ordersToday: number
  ordersWeek: number
  deliveryRate: number
  topProduct: string
  pendingOrders: number
}
```
