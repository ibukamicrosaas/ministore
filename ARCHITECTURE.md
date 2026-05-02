# ARCHITECTURE.md — BeautyDesk

> Architecture technique complète du projet.
> Version 1.0 — Avril 2026

---

## 1. Vue d'ensemble

BeautyDesk est une application web Next.js 15 (App Router) déployée sur Vercel, avec Supabase comme backend (auth + base de données + storage). Elle expose deux interfaces principales :

- **PWA publique** (`/[salon-slug]/...`) : accessible sans compte, optimisée mobile, utilisée par les clientes pour réserver
- **Back-office** (`/dashboard/...`) : protégé par authentification, utilisé par les propriétaires et employées de salon

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Next.js 15)               │
│                                                     │
│   ┌──────────────┐        ┌──────────────────────┐  │
│   │  PWA Client  │        │   Back-office Admin  │  │
│   │ /[slug]/...  │        │    /dashboard/...    │  │
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
    └─────────────┘           │  - Moneroo       │
                              │  - Stripe        │
                              │  - WhatsApp API  │
                              │  - Cloudinary    │
                              └─────────────────┘
```

---

## 2. Structure des fichiers

```
beautydesk/
├── src/
│   ├── app/
│   │   ├── [salon-slug]/                   → PWA publique
│   │   │   ├── page.tsx                    → Page d'accueil salon
│   │   │   ├── services/
│   │   │   │   └── page.tsx                → Catalogue services
│   │   │   ├── book/
│   │   │   │   └── [service-id]/
│   │   │   │       ├── page.tsx            → Sélection date/heure
│   │   │   │       ├── info/
│   │   │   │       │   └── page.tsx        → Infos client
│   │   │   │       └── pay/
│   │   │   │           └── page.tsx        → Paiement
│   │   │   ├── booking/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx            → Détail réservation client
│   │   │   ├── my-bookings/
│   │   │   │   └── page.tsx                → Espace client
│   │   │   └── success/
│   │   │       └── page.tsx                → Confirmation réservation
│   │   │
│   │   ├── dashboard/                      → Back-office (protégé)
│   │   │   ├── layout.tsx                  → Layout avec sidebar
│   │   │   ├── page.tsx                    → Tableau de bord
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx                → Liste réservations
│   │   │   │   └── [id]/page.tsx           → Détail réservation
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx                → Vue calendrier
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx                → Liste employées
│   │   │   │   ├── new/page.tsx            → Ajouter employée
│   │   │   │   └── [id]/page.tsx           → Fiche employée
│   │   │   ├── services/
│   │   │   │   ├── page.tsx                → Liste services
│   │   │   │   ├── new/page.tsx            → Ajouter service
│   │   │   │   └── [id]/page.tsx           → Modifier service
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx                → Base clients
│   │   │   │   └── [id]/page.tsx           → Fiche cliente
│   │   │   ├── reports/
│   │   │   │   └── page.tsx                → Rapports
│   │   │   └── settings/
│   │   │       ├── page.tsx                → Paramètres généraux
│   │   │       ├── payments/page.tsx       → Config paiements
│   │   │       └── notifications/page.tsx  → Config WhatsApp
│   │   │
│   │   ├── api/
│   │   │   ├── salons/
│   │   │   │   └── [slug]/
│   │   │   │       ├── route.ts            → GET infos salon
│   │   │   │       ├── services/route.ts   → GET services
│   │   │   │       └── availability/route.ts → GET créneaux
│   │   │   ├── bookings/
│   │   │   │   ├── route.ts                → POST créer réservation
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts            → GET détail
│   │   │   │       ├── cancel/route.ts     → PATCH annuler
│   │   │   │       ├── present/route.ts    → POST marquer présent
│   │   │   │       └── complete/route.ts   → POST marquer terminé
│   │   │   ├── payments/
│   │   │   │   ├── moneroo/create/route.ts
│   │   │   │   └── stripe/create/route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── moneroo/route.ts
│   │   │   │   └── stripe/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/route.ts
│   │   │   │   ├── bookings/route.ts
│   │   │   │   ├── staff/route.ts
│   │   │   │   ├── services/route.ts
│   │   │   │   └── reports/route.ts
│   │   │   ├── notifications/
│   │   │   │   └── send/route.ts
│   │   │   └── cron/
│   │   │       └── reminders/route.ts
│   │   │
│   │   ├── login/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── layout.tsx                      → Layout racine
│   │   └── globals.css                     → Variables CSS + reset Tailwind
│   │
│   ├── components/
│   │   ├── ui/                             → Composants atomiques
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── index.ts
│   │   ├── booking/                        → Composants réservation PWA
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimeSlotGrid.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── BookingSummary.tsx
│   │   │   └── PaymentForm.tsx
│   │   ├── dashboard/                      → Composants back-office
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── BookingRow.tsx
│   │   │   ├── BookingStatusBadge.tsx
│   │   │   ├── StaffCard.tsx
│   │   │   ├── CommissionTable.tsx
│   │   │   └── CalendarView.tsx
│   │   └── pwa/                            → Composants page salon publique
│   │       ├── SalonHeader.tsx
│   │       ├── ServiceGrid.tsx
│   │       └── BottomNav.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   → createBrowserClient()
│   │   │   ├── server.ts                   → createServerClient()
│   │   │   └── admin.ts                    → createAdminClient() — webhooks only
│   │   ├── payments/
│   │   │   ├── moneroo.ts                  → createMonerooSession(), verifyWebhook()
│   │   │   └── stripe.ts                   → createStripeSession(), verifyWebhook()
│   │   ├── notifications/
│   │   │   └── whatsapp.ts                 → sendWhatsAppMessage(), templates
│   │   ├── utils/
│   │   │   ├── availability.ts             → getAvailableSlots()
│   │   │   ├── commissions.ts              → calculateCommission()
│   │   │   ├── slots.ts                    → generateTimeSlots()
│   │   │   ├── formatting.ts               → formatPrice(), formatDate()
│   │   │   └── validation.ts               → validateBookingForm()
│   │   └── actions/                        → Server Actions
│   │       ├── bookings.ts
│   │       ├── staff.ts
│   │       ├── services.ts
│   │       └── settings.ts
│   │
│   ├── types/
│   │   ├── database.ts                     → Types auto-générés Supabase
│   │   └── index.ts                        → Types métier
│   │
│   └── constants/
│       └── index.ts
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_functions.sql
│       └── 004_indexes.sql
│
├── public/
│   ├── manifest.json                       → PWA manifest
│   └── icons/                             → App icons PWA
│
├── middleware.ts                           → Protection routes dashboard
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Flux de données — Réservation client

```
Cliente (téléphone)
    │
    ▼
PWA /[slug]/book/[service-id]
    │
    │ Server Component → fetch infos salon + service
    ▼
DatePicker + TimeSlotGrid
    │
    │ Server Action → getAvailableSlots(salonId, serviceId, date)
    ▼
Supabase → query bookings + blocked_slots + opening_hours
    │
    ▼
TimeSlotGrid affiche les créneaux disponibles
    │
    │ Sélection créneau → navigation vers /info
    ▼
BookingForm (infos client : prénom, whatsapp)
    │
    │ Server Action → createBookingPending()
    │   - Insère booking avec status='pending'
    │   - Retourne booking_id + deposit_amount
    ▼
/pay → affiche récapitulatif + PaymentForm
    │
    │ Server Action → createPaymentSession(bookingId, method)
    │   - Crée session Moneroo ou Stripe
    │   - Retourne URL de paiement
    ▼
Redirection vers page paiement Moneroo/Stripe
    │
    │ Paiement effectué
    ▼
Webhook /api/webhooks/moneroo (ou stripe)
    │   - Vérifie signature
    │   - Met à jour booking.status = 'confirmed'
    │   - Met à jour booking.deposit_paid = true
    │   - Insère payment avec status='completed'
    │   - Crée/met à jour client dans clients table
    │   - Envoie confirmation WhatsApp client
    │   - Envoie notification WhatsApp salon
    ▼
Cliente redirigée vers /[slug]/success?booking=[id]
```

---

## 4. Flux de données — Calcul des commissions

```
Admin marque réservation comme 'completed'
    │
    │ Server Action → completeBooking(bookingId)
    ▼
Vérification : staff_id assigné à la réservation ?
    │
    ├── Non → log uniquement, pas de commission
    │
    └── Oui → fetch staff.remuneration_type
              │
              ├── 'fixed_salary' → log uniquement
              │
              └── 'commission' →
                    calculateCommission(
                      total_price,
                      commission_rate,
                      week_number,
                      year
                    )
                    Insère dans commissions table
                    │
                    ▼
                    Commission visible dans
                    dashboard/staff/[id]
                    et récapitulatif hebdomadaire
```

---

## 5. Flux de paiement — Webhooks

### Moneroo

```
POST /api/webhooks/moneroo
    │
    ├── Vérifier HMAC signature (MONEROO_WEBHOOK_SECRET)
    │   └── Invalide → return 401
    │
    ├── Extraire booking_id depuis metadata
    │
    ├── Vérifier payment.status dans notre DB
    │   └── Déjà 'completed' → return 200 (idempotent)
    │
    ├── Si event = 'payment.success'
    │   ├── UPDATE bookings SET status='confirmed', deposit_paid=true
    │   ├── INSERT payments (type='deposit', status='completed')
    │   ├── Upsert client dans clients table
    │   ├── sendWhatsAppMessage(client, 'booking_confirmation')
    │   └── sendWhatsAppMessage(salon, 'new_booking')
    │
    └── Return 200
```

### Stripe

```
POST /api/webhooks/stripe
    │
    ├── Vérifier signature (STRIPE_WEBHOOK_SECRET)
    │
    ├── Si event = 'checkout.session.completed'
    │   └── Même logique que Moneroo
    │
    └── Return 200
```

---

## 6. Middleware — Protection des routes

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  // Routes API cron → secret requis
  if (pathname.startsWith('/api/cron')) {
    const secret = request.headers.get('Authorization')
    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}
```

---

## 7. PWA Configuration

```json
// public/manifest.json
{
  "name": "BeautyDesk",
  "short_name": "BeautyDesk",
  "description": "Réservez votre rendez-vous beauté",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#E85D04",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 8. Cron Jobs (Vercel Cron)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/expire-pending",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**`/api/cron/reminders`** (8h00 chaque matin) :
- Fetch toutes les réservations `confirmed` pour demain
- Pour chaque réservation : envoyer rappel WhatsApp si pas encore envoyé
- Mettre à jour `reminder_sent_at`

**`/api/cron/expire-pending`** (toutes les 30 min) :
- Fetch réservations `pending` créées il y a plus de 30 minutes
- Passer leur statut en `cancelled` avec raison `expired`
- Libérer le créneau

---

## 9. Configuration des couleurs par salon

Chaque salon a une `primary_color` configurable. Cette couleur est injectée via le layout du salon comme variable CSS :

```tsx
// app/[salon-slug]/layout.tsx
export default async function SalonLayout({ params, children }) {
  const salon = await getSalon(params['salon-slug'])

  return (
    <div
      style={{ '--color-primary': salon.primary_color } as React.CSSProperties}
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
  Réserver
</button>
```

---

## 10. Types principaux

```typescript
// src/types/index.ts

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'present'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type RemunerationType = 'commission' | 'fixed_salary'

export type PaymentMethod = 'moneroo' | 'stripe' | 'cash'

export type PaymentType = 'deposit' | 'balance' | 'full' | 'refund'

export type NotificationType =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'cancellation'
  | 'new_booking_salon'

export interface TimeSlot {
  time: string           // "09:00"
  isAvailable: boolean
  staffId?: string       // employée disponible pour ce créneau
}

export interface BookingFormData {
  serviceId: string
  staffId?: string
  date: string           // "2026-04-25"
  time: string           // "10:00"
  clientFirstName: string
  clientPhone: string
  clientWhatsapp: string
  clientEmail?: string
  notes?: string
}

export interface DashboardStats {
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  bookingsToday: number
  bookingsWeek: number
  noShowRate: number
  topService: string
  topStaff: string
}
```
