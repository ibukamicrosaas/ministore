# TEKKIShop — Stratégie de Scaling

> Document de référence à destination du CTO / Lead Developer.  
> Mis à jour : juin 2026. Stack : Next.js 15 (Vercel) · Supabase (PostgreSQL) · Twilio · Bictorys.

---

## Capacité actuelle sans modification

| Indicateur | Valeur estimée | Commentaire |
|---|---|---|
| Boutiques actives | jusqu'à **5 000** | Confortable, aucun goulot actif |
| Commandes / mois | jusqu'à **50 000** | Sans dégradation perceptible |
| Pages produit (trafic) | **~1M pages vues/mois** | Vercel CDN + ISR absorbent nativement |
| Crons quotidiens | jusqu'à **10 000 shops** par exécution | Au-delà, risque de timeout Vercel (300 s) |

Le stack est dimensionné pour une PME SaaS en croissance. Il n'y a rien à toucher avant d'atteindre ~5 000 boutiques actives simultanées.

---

## Palier 1 — 5 000 à 20 000 boutiques

### Bottleneck 1 : `login_attempts` comme rate limiter et déduplicateur

**Problème.** La table `login_attempts` est utilisée à la fois comme compteur de rate limiting (paiements, commandes) et comme système de déduplication des crons. Elle grossit en continu. Une purge quotidienne est en place (cron `cron-health-check`), mais à fort volume les index se fragmentent et les requêtes de comptage ralentissent.

**Solution : Upstash Redis (serverless)**

```bash
# 1. Créer un compte Upstash (upstash.com) — plan gratuit jusqu'à 10 000 req/jour
# 2. Créer une base Redis dans la région la plus proche de votre région Vercel
# 3. Récupérer UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
# 4. Installer le client
npm install @upstash/redis @upstash/ratelimit
```

```typescript
// src/lib/rate-limit.ts — remplacement complet
import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const paymentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix:  'rl:payment',
})

export const orderRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix:  'rl:order',
})
```

```typescript
// Usage dans n'importe quelle route
const { success } = await paymentRateLimit.limit(ip)
if (!success) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
```

Avantages : atomique, sub-milliseconde, ne grossit pas, pas de table à maintenir.  
Coût : ~0 $/mois jusqu'à 500k req/mois (plan Upstash Free).

---

### Bottleneck 2 : Connexions PostgreSQL épuisées

**Problème.** Vercel serverless ouvre une connexion par invocation. Supabase Pro alloue ~200 connexions. À fort trafic (pics de commandes), on peut saturer le pool et obtenir des `too many clients` errors.

**Solution : Activer le Connection Pooler Supabase (PgBouncer)**

```bash
# Dans Supabase Dashboard > Settings > Database
# Activer "Connection Pooling" (mode Transaction, port 6543)
# Copier la "Connection string (pooling)"
```

```bash
# .env.local — remplacer DATABASE_URL par la chaîne poolée
# Port 5432 (direct) → port 6543 (pooler transaction mode)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

> **Important :** En mode Transaction, les prepared statements ne persistent pas entre requêtes. Supabase JS (`@supabase/supabase-js`) n'utilise pas de prepared statements côté client — aucun changement de code nécessaire.

---

### Bottleneck 3 : Crons qui traitent trop de lignes d'un coup

**Problème.** Les crons `trial-expiry`, `subscription-expiry`, `subscription-reminder` et `trial-onboarding` traitent toutes les boutiques éligibles en une seule passe. À 10 000+ boutiques, une passe peut dépasser 300 secondes (timeout Vercel).

**Solution : Pagination par batch**

```typescript
// Exemple dans subscription-reminder/route.ts
const BATCH_SIZE = 500
let offset = 0
let processed = 0

while (true) {
  const { data: shops } = await supabase
    .from('shops')
    .select('...')
    .range(offset, offset + BATCH_SIZE - 1)

  if (!shops || shops.length === 0) break

  for (const shop of shops) {
    // traitement...
  }

  processed += shops.length
  if (shops.length < BATCH_SIZE) break
  offset += BATCH_SIZE
}
```

Alternativement, passer sur **Vercel Queues** (beta) pour découpler le déclenchement du traitement.

---

## Palier 2 — 20 000 à 100 000 boutiques

### Séparation lecture / écriture

Supabase Pro et Business supportent les **Read Replicas** (régions secondaires). Toutes les requêtes `SELECT` intensives (listes produits, pages boutique) peuvent pointer vers le replica.

```typescript
// Créer deux clients distincts
const writeClient = createClient(url, key)           // région primaire
const readClient  = createClient(replicaUrl, key)    // read replica
```

Activer dans Supabase Dashboard > Settings > Database > Read Replicas.

---

### CDN dédié pour les images

Supabase Storage est un objet store, pas un CDN optimisé. À partir de ~500 000 images, la bande passante Supabase devient coûteuse.

**Migration vers Cloudinary ou imgix**

```bash
npm install cloudinary
```

```typescript
// src/lib/storage/images.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadProductImage(buffer: Buffer, shopId: string) {
  return cloudinary.uploader.upload_stream({
    folder:         `tekkishop/${shopId}`,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })
}
```

Avantages : transformation à la volée (resize, webp, avif), CDN mondial, lazy loading automatique.

---

### Queue pour SMS / Push notifications

À fort volume, envoyer des SMS Twilio et des push VAPID de manière synchrone dans des Server Actions / Route Handlers crée de la latence et des risques de timeout.

**Migrer vers Vercel Queues (ou Inngest)**

```typescript
// Déclencher au lieu d'envoyer directement
import { inngest } from '@/lib/inngest'

await inngest.send({
  name: 'order/created',
  data: { shopId, orderId, clientPhone, shopPhone },
})

// Worker séparé (src/inngest/send-order-notifications.ts)
export const sendOrderNotifications = inngest.createFunction(
  { id: 'send-order-notifications', retries: 3 },
  { event: 'order/created' },
  async ({ event }) => {
    await sendWhatsApp(event.data.clientPhone, buildOrderConfirmationMessage(...))
    await sendWhatsApp(event.data.shopPhone,   buildNewOrderAlertMessage(...))
  }
)
```

---

## Palier 3 — 100 000+ boutiques

À ce niveau, l'architecture doit évoluer en profondeur. Voici les chantiers par priorité :

### 1. Multi-région Vercel

```json
// vercel.json
{
  "regions": ["cdg1", "lax1", "sin1"]
}
```

Déployer dans les régions proches de la base d'utilisateurs (CDG1 pour l'Europe/Afrique, SIN1 pour l'Asie).

### 2. Supabase Enterprise + Read Replicas multiples

Contacter l'équipe Supabase pour un plan Enterprise avec SLA. Activer des read replicas dans chaque région Vercel.

### 3. Partitionnement des tables `orders` et `order_items`

```sql
-- Partitionner par année pour maintenir des index performants
CREATE TABLE orders_2025 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE orders_2026 PARTITION OF orders
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### 4. Monitoring Observabilité

Mettre en place **Datadog** ou **Grafana Cloud** avec :
- Métriques DB : query latency P95, connection pool usage, index bloat
- Métriques Vercel : cold starts, function duration, error rate
- Alerting : latence > 2s, error rate > 1%, pool > 80%

---

## Récapitulatif des actions par palier

| Palier | Boutiques | Action | Effort | Priorité |
|---|---|---|---|---|
| **Maintenant** | 0–5k | Rien | — | — |
| **Palier 1** | 5k–20k | Upstash Redis (rate limiting) | 2h | Haute |
| **Palier 1** | 5k–20k | Connection pooler Supabase (port 6543) | 15 min | Haute |
| **Palier 1** | 5k–20k | Pagination batch dans les crons | 2h | Moyenne |
| **Palier 2** | 20k–100k | CDN images (Cloudinary) | 1 jour | Haute |
| **Palier 2** | 20k–100k | Queue notifications (Inngest/Vercel Queues) | 1 jour | Moyenne |
| **Palier 2** | 20k–100k | Read replicas Supabase | 1h (config) | Moyenne |
| **Palier 3** | 100k+ | Multi-région Vercel | 4h | Haute |
| **Palier 3** | 100k+ | Supabase Enterprise + partitionnement | 2 jours | Haute |
| **Palier 3** | 100k+ | Observabilité (Datadog/Grafana) | 1 jour | Haute |

---

## Variables d'environnement à ajouter par palier

### Palier 1

```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://[id].upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Supabase Pooler (remplace ou complète DATABASE_URL)
SUPABASE_POOLER_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

### Palier 2

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Inngest (si choisi pour les queues)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

---

## Notes sur la sécurité à l'échelle

Les correctifs de sécurité appliqués en juin 2026 couvrent les vecteurs critiques jusqu'au Palier 2 :

- **Whitelist `updateShop`** — empêche l'élévation de plan via Server Action forgée
- **Rate limiting `/api/orders`** — 20 commandes/heure par IP (via `login_attempts`, à migrer vers Redis au Palier 1)
- **Rate limiting endpoints paiement** — 10 req/heure par IP
- **CSP + HSTS + X-Frame-Options** — configurés dans `next.config.ts`
- **Purge quotidienne `login_attempts`** — cron `cron-health-check` à 11h UTC
- **Chiffrement clés Bictorys** — AES avant stockage en DB
- **RLS Supabase** — toutes les tables sensibles protégées

Au Palier 2, ajouter un **WAF (Web Application Firewall)** Cloudflare devant Vercel pour absorber les attaques volumétriques avant qu'elles atteignent les fonctions.
