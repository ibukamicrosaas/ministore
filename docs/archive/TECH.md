# Guide technique — Migration Sheka → MiniStore

## Stack technique (inchangée)

- **Framework** : Next.js 15 App Router (même version)
- **Base de données** : Supabase (PostgreSQL + Auth + Storage + RLS)
- **Paiements** : Bictorys Direct API (Wave, Orange Money, Maxit)
- **WhatsApp** : Twilio
- **Monitoring** : Sentry
- **Déploiement** : Vercel
- **Auth** : Téléphone + PIN 6 chiffres via Supabase Auth (`@[domaine].app` fake email)

---

## Schéma de base de données

### Tables à GARDER sans modification

| Table | Usage |
|---|---|
| `profiles` | Utilisateurs, rôles, progression onboarding |
| `clients` | Clients des boutiques |
| `payments` | Paiements traités via Bictorys |
| `payouts` | Reversements Wave/OM |
| `notification_logs` | Historique WhatsApp envoyés |

### Tables à RENOMMER / ADAPTER

#### `salons` → `shops`
Champs à modifier :
```sql
-- Supprimer
ALTER TABLE shops DROP COLUMN IF EXISTS opening_hours;
ALTER TABLE shops DROP COLUMN IF EXISTS cancellation_hours;
ALTER TABLE shops DROP COLUMN IF EXISTS cancellation_refund;

-- Ajouter
ALTER TABLE shops ADD COLUMN IF NOT EXISTS
  delivery_options jsonb DEFAULT '{"home_delivery": true, "store_pickup": true}'::jsonb;

ALTER TABLE shops ADD COLUMN IF NOT EXISTS
  available_days jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday"]'::jsonb;
-- Jours où la boutique accepte des commandes/livraisons
```

#### `services` → `products`
```sql
ALTER TABLE products RENAME TO products; -- si renommée depuis services

-- Supprimer
ALTER TABLE products DROP COLUMN IF EXISTS duration_minutes;
ALTER TABLE products DROP COLUMN IF EXISTS staff_ids;

-- Modifier
ALTER TABLE products ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;
-- Tableau d'URLs : [{"url": "https://...", "is_primary": true}, ...]
-- photo_url existante = photos[0] pour rétrocompatibilité

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count integer DEFAULT NULL;
-- NULL = stock illimité
```

#### `bookings` → `orders`
Structure complètement différente. Migrer en créant une nouvelle table :

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),

  delivery_type text NOT NULL DEFAULT 'home_delivery'
    CHECK (delivery_type IN ('home_delivery','store_pickup')),

  delivery_address text,
  delivery_date date,

  payment_method text CHECK (payment_method IN ('wave_money','orange_money','maxit','on_delivery','on_site')),
  payment_type text NOT NULL DEFAULT 'on_delivery'
    CHECK (payment_type IN ('online_full','online_deposit','on_delivery','on_site')),

  deposit_amount integer NOT NULL DEFAULT 0,
  deposit_paid boolean NOT NULL DEFAULT false,
  total_price integer NOT NULL DEFAULT 0,

  notes text,
  internal_notes text,
  cancellation_reason text,
  cancelled_by text CHECK (cancelled_by IN ('shop','client')),

  client_token uuid NOT NULL DEFAULT gen_random_uuid(),
  reminder_sent_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,      -- snapshot au moment de la commande
  variant_label text,
  unit_price integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  line_total integer NOT NULL,     -- unit_price * quantity
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Tables à SUPPRIMER

```sql
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS blocked_slots CASCADE;
DROP TABLE IF EXISTS commissions CASCADE; -- optionnel : garder si on veut tracker les commissions Bictorys
```

---

## Structure des fichiers — Ce qui change

### Supprimer ces dossiers/fichiers

```
src/app/dashboard/staff/           → supprimer
src/app/dashboard/calendar/        → supprimer
src/app/dashboard/my-schedule/     → supprimer
src/app/api/salons/[slug]/availability/ → supprimer
src/app/[salon-slug]/book/         → remplacer par /[shop-slug]/commander/
```

### Renommer

```
src/app/[salon-slug]/              → src/app/[shop-slug]/
src/app/dashboard/services/        → src/app/dashboard/products/
src/app/dashboard/bookings/        → src/app/dashboard/orders/
src/components/pwa/ServiceGrid.tsx → ProductGrid.tsx
src/components/dashboard/ServiceForm.tsx → ProductForm.tsx
```

### Fichiers clés à réécrire

| Fichier | Changement |
|---|---|
| `src/app/[shop-slug]/page.tsx` | Catalogue produits |
| `src/app/[shop-slug]/commander/page.tsx` | Formulaire de commande (nouveau) |
| `src/app/[shop-slug]/commander/success/page.tsx` | Page de confirmation |
| `src/app/dashboard/orders/page.tsx` | Liste des commandes |
| `src/app/dashboard/orders/[id]/page.tsx` | Détail commande |
| `src/app/api/orders/route.ts` | API création de commande |
| `src/lib/actions/orders.ts` | Server actions commandes |
| `src/lib/actions/products.ts` | Identique services.ts + photos[] |
| `src/app/onboarding/OnboardingWizard.tsx` | Adapter pour "premier produit" |
| `src/components/dashboard/SetupChecklist.tsx` | Adapter pour vendeurs |
| `src/app/page.tsx` | Nouvelle landing page |

### Fichiers à garder SANS modification

```
src/lib/supabase/
src/lib/payments/bictorys.ts
src/lib/notifications/whatsapp.ts  (adapter les messages)
src/lib/actions/auth.ts
src/app/login/
src/app/onboarding/setup/
src/app/dashboard/revenues/
src/app/dashboard/settings/
src/app/admin/
src/app/api/payments/
src/app/api/payouts/
src/app/api/cron/
src/app/legal/
src/middleware.ts
src/constants/index.ts             (adapter APP_NAME, APP_URL, COMMISSION_RATE)
```

---

## Variables d'environnement

Identiques à Sheka. Changer uniquement :
```env
NEXT_PUBLIC_APP_NAME=MiniStore       # ou le nom choisi
NEXT_PUBLIC_APP_URL=https://[domaine].store
SUPABASE_URL=...                      # nouvelle instance Supabase
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
# Twilio, Bictorys, Sentry : mêmes clés ou nouvelles selon l'acheteur
```

---

## Flow de paiement (différences avec Sheka)

### Sheka
Acompte uniquement (% du prix) → charge l'acompte → solde payé sur place.

### MiniStore
Deux options au checkout :
1. **Payer maintenant** → charge l'acompte (si défini) ou le total → Bictorys Direct API (identique Sheka)
2. **Payer à la livraison/en boutique** → commande créée sans paiement, vendeur collecte manuellement

```typescript
// Logique dans /api/orders/route.ts
if (payment_type === 'online_full' || payment_type === 'online_deposit') {
  // → rediriger vers /[slug]/commander/pay?order_id=...
  // → même flow Bictorys que Sheka
}
if (payment_type === 'on_delivery' || payment_type === 'on_site') {
  // → créer order en pending
  // → envoyer WhatsApp confirmation sans lien de paiement
}
```

---

## Migrations SQL (ordre d'exécution)

```
001_initial_schema.sql      → adapter depuis Sheka (shops au lieu de salons, etc.)
002_rls_policies.sql        → adapter
003_functions.sql           → adapter (expire_pending_orders, upsert_client)
004_indexes.sql             → adapter
005_product_deposit.sql     → acompte sur produits
006_pin_resets.sql          → identique
007_storage_shop_logos.sql  → identique (renommer bucket)
008_storage_product_photos.sql → nouveau (multi-photos)
009_payouts.sql             → identique
010_order_items.sql         → nouveau (table order_items)
```

---

## Checklist de développement MVP

### Phase 1 — Infrastructure (1-2 jours)
- [ ] Fork du repo Sheka
- [ ] Nouvelle instance Supabase
- [ ] Appliquer les migrations SQL adaptées
- [ ] Mettre à jour les variables d'environnement
- [ ] Mettre à jour `src/types/database.ts` (générer depuis Supabase)
- [ ] Mettre à jour `src/types/index.ts` (Order, OrderItem, Product)
- [ ] Mettre à jour `src/constants/index.ts`

### Phase 2 — Dashboard vendeur (2-3 jours)
- [ ] `/dashboard/products` — liste produits (copier services, adapter)
- [ ] `/dashboard/products/new` et `/[id]` — formulaire produit avec multi-photos
- [ ] `/dashboard/orders` — liste commandes avec filtres
- [ ] `/dashboard/orders/[id]` — détail commande + actions statut
- [ ] Supprimer staff, calendar, my-schedule

### Phase 3 — Mini site public (2-3 jours)
- [ ] `ProductGrid.tsx` — catalogue (liste/grille)
- [ ] `/[shop-slug]/page.tsx` — page boutique
- [ ] `/[shop-slug]/produit/[id]/page.tsx` — détail produit + galerie photos
- [ ] `/[shop-slug]/commander/page.tsx` — formulaire de commande
- [ ] `/[shop-slug]/commander/pay/page.tsx` — paiement Bictorys (adapter depuis Sheka)
- [ ] `/[shop-slug]/commander/success/page.tsx` — confirmation

### Phase 4 — API & notifications (1-2 jours)
- [ ] `/api/orders/route.ts` — création de commande
- [ ] Messages WhatsApp adaptés (confirmation commande, alerte vendeur)
- [ ] Webhook Bictorys adapté pour orders

### Phase 5 — Onboarding & landing (1-2 jours)
- [ ] Adapter `OnboardingWizard.tsx` (step 4 : premier produit)
- [ ] Adapter `SetupChecklist.tsx`
- [ ] Nouvelle landing page

### Phase 6 — Admin & polish (1 jour)
- [ ] Adapter admin si nécessaire (renommer salons → boutiques)
- [ ] Tests end-to-end
- [ ] Déploiement Vercel

**Total estimé : 8-13 jours de développement pour un développeur Next.js confirmé.**
