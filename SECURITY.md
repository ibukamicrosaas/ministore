# Guide de Sécurité SaaS — Règles Absolues

> Ce document est destiné à tout développeur ou agent IA travaillant sur un projet SaaS.
> Chaque règle est accompagnée du problème qu'elle résout, d'un exemple mauvais et d'un exemple correct.
> Appliquer ce guide AVANT d'écrire du code, pas après.

---

## Table des matières

1. [Ne jamais faire confiance au client](#1-ne-jamais-faire-confiance-au-client)
2. [Authentification](#2-authentification)
3. [Autorisation et contrôle d'accès](#3-autorisation-et-contrôle-daccès)
4. [Validation des entrées](#4-validation-des-entrées)
5. [Paiements et données financières](#5-paiements-et-données-financières)
6. [Cryptographie et secrets](#6-cryptographie-et-secrets)
7. [Rate limiting et protection brute-force](#7-rate-limiting-et-protection-brute-force)
8. [Base de données et RLS](#8-base-de-données-et-rls)
9. [Webhooks](#9-webhooks)
10. [Exposition d'informations](#10-exposition-dinformations)
11. [Gestion des sessions](#11-gestion-des-sessions)
12. [Infrastructure et déploiement](#12-infrastructure-et-déploiement)
13. [Checklist avant mise en production](#13-checklist-avant-mise-en-production)

---

## 1. Ne jamais faire confiance au client

**Principe fondateur :** Tout ce qui vient du navigateur peut être falsifié. Prix, IDs, rôles, montants — tout.

### ❌ Mauvais

```typescript
// Le client envoie le prix dans le body — un attaquant envoie price: 1
const { productId, price } = await req.json()
await db.orders.insert({ productId, price })
```

```typescript
// Le client envoie son propre rôle
const { userId, role } = await req.json()
if (role === 'admin') { /* ... */ }
```

### ✅ Correct

```typescript
// Le prix est toujours lu depuis la base de données
const { productId } = await req.json()
const product = await db.products.findById(productId)
await db.orders.insert({ productId, price: product.price })
```

```typescript
// Le rôle est toujours lu depuis la DB ou le token de session
const session = await getSession(req)
const user = await db.profiles.findById(session.userId)
if (user.role === 'admin') { /* ... */ }
```

### Règles

- **Tous les montants financiers** sont calculés côté serveur depuis la DB
- **Tous les IDs** sont revalidés côté serveur (appartiennent-ils à l'utilisateur ?)
- **Tous les rôles et permissions** viennent de la session ou de la DB, jamais du body
- **Toutes les variantes de prix** (options, formules) sont vérifiées contre la DB

---

## 2. Authentification

### 2.1 Force des mots de passe et PINs

| Type | Minimum | Recommandé |
|---|---|---|
| Mot de passe | 8 caractères | 12 caractères + complexité |
| PIN numérique | 6 chiffres | 8 chiffres |
| Token de reset | 128 bits (hex 32 chars) | idem |
| Token de session client | UUID v4 (122 bits) | `crypto.randomBytes(32).toString('hex')` |

### ❌ Mauvais

```typescript
// PIN 6 chiffres sans rate limiting = brute-forceable en quelques minutes
const token = String(Math.floor(100000 + Math.random() * 900000))

// Identifiant prévisible à partir du numéro de téléphone
const email = `${phone}@monapp.com`  // révèle le schéma
```

### ✅ Correct

```typescript
import crypto from 'crypto'

// Token de reset avec entropie suffisante pour les usages programmatiques
const resetToken = crypto.randomBytes(16).toString('hex')  // 128 bits

// Pour les codes entrés manuellement (UX), compenser avec du rate limiting strict
const pinCode = String(Math.floor(100000 + Math.random() * 900000))
// + max 5 tentatives avant invalidation du code
```

### 2.2 Ne pas révéler l'existence des comptes

```typescript
// ❌ Révèle si le compte existe
if (!user) return { error: 'Aucun compte trouvé avec ce numéro.' }

// ✅ Réponse identique que le compte existe ou non
return { success: true }  // "Si un compte existe, vous recevrez un email/SMS"
```

### 2.3 Génération de tokens cryptographiquement sûre

```typescript
// ❌ Math.random() n'est pas cryptographiquement sûr
const token = Math.random().toString(36)

// ✅ crypto.randomBytes / randomUUID pour tout ce qui touche à la sécurité
import crypto from 'crypto'
const token = crypto.randomUUID()          // session clients
const secret = crypto.randomBytes(32).toString('hex')  // secrets webhook
```

---

## 3. Autorisation et contrôle d'accès

### 3.1 Vérifier l'appartenance des ressources (IDOR)

L'**Insecure Direct Object Reference** est la faille la plus courante dans les SaaS multi-tenant. Toujours vérifier que la ressource demandée appartient à l'utilisateur qui la demande.

### ❌ Mauvais

```typescript
// Tout le monde peut voir n'importe quelle réservation avec son UUID
const booking = await db.bookings.findById(params.id)
return NextResponse.json({ booking })

// Token optionnel — si absent, accès accordé quand même
if (token && booking.client_token !== token) {
  return NextResponse.json({ error: 'Token invalide' }, { status: 403 })
}
```

### ✅ Correct

```typescript
// Token obligatoire — sans token valide, aucune donnée
if (!token || booking.client_token !== token) {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}

// Pour les routes admin, toujours filtrer par l'ID du salon de l'utilisateur
const session = await getSession(req)
const booking = await db.bookings.findOne({
  where: { id: params.id, salon_id: session.salon_id }  // filtre propriétaire
})
if (!booking) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
```

### 3.2 Valider les relations entre entités

```typescript
// ❌ staffId envoyé par le client n'est jamais vérifié
const { staffId } = await req.json()
await db.bookings.insert({ staffId, salonId })

// ✅ Vérifier que staffId appartient bien au salon de la réservation
const staff = await db.staff.findOne({
  where: { id: staffId, salon_id: salonId, is_active: true }
})
if (!staff) return { error: 'Prestataire invalide' }
```

### 3.3 Protéger toutes les routes sensibles au niveau middleware

Ne pas compter uniquement sur les vérifications dans chaque handler — un handler oublié crée une vulnérabilité. Le middleware garantit une protection systématique.

```typescript
// middleware.ts — protéger par catégorie de route
export const config = {
  matcher: [
    '/dashboard/:path*',   // authentification obligatoire
    '/admin/:path*',       // authentification + rôle admin
    '/api/admin/:path*',   // authentification + rôle admin (API)
    '/api/cron/:path*',    // secret cron obligatoire
  ],
}
```

### 3.4 Séparation des privilèges — client service_role

```typescript
// ❌ Utiliser le client admin partout (bypass RLS pour tout)
const admin = createAdminClient()
const { data } = await admin.from('bookings').select('*')

// ✅ Client admin uniquement pour les opérations légitimes qui nécessitent bypass RLS
// - Webhooks de paiement
// - Cron jobs
// - Opérations admin explicitement autorisées

// Pour tout le reste : client normal (respecte RLS)
const supabase = await createServerClient()
const { data } = await supabase.from('bookings').select('*')
```

---

## 4. Validation des entrées

### Principe : valider côté serveur TOUJOURS, côté client en bonus

La validation côté client (formulaire, TypeScript) est de l'UX, pas de la sécurité. Un attaquant peut contourner n'importe quelle validation frontend.

### 4.1 Format et type

```typescript
// ❌ Passer date et time directement en DB sans validation
const { date, time } = await req.json()
await db.bookings.insert({ date, time })

// ✅ Valider le format avant tout
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^\d{2}:\d{2}$/

if (!DATE_REGEX.test(date)) return { error: 'Format date invalide' }
if (!TIME_REGEX.test(time)) return { error: 'Format heure invalide' }
```

### 4.2 Limites de taille

```typescript
// Toujours définir des limites sur les champs texte
const MAX_LENGTHS = {
  name:        100,
  description: 500,
  notes:       1000,
  phone:       20,
}

for (const [field, max] of Object.entries(MAX_LENGTHS)) {
  if (body[field]?.length > max) {
    return { error: `${field} trop long (max ${max} caractères)` }
  }
}
```

### 4.3 Valeurs énumérées

```typescript
// ❌ Accepter n'importe quelle valeur de méthode
const { method } = await req.json()
await payout(method)

// ✅ Whitelist explicite
const VALID_METHODS = ['wave', 'orange_money'] as const
if (!VALID_METHODS.includes(method)) {
  return { error: 'Méthode invalide' }
}
```

### 4.4 IDs — format UUID

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

if (!isValidUUID(bookingId)) {
  return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
}
```

---

## 5. Paiements et données financières

Ces règles s'appliquent quel que soit l'agrégateur (Bictorys, Stripe, PayPal, etc.).

### Règle 1 — Ne jamais confirmer un paiement sur la redirection de retour

```typescript
// ❌ La successRedirectUrl n'est pas une preuve de paiement
// Un utilisateur peut naviguer vers cette URL sans avoir payé
app.get('/success', async (req) => {
  await confirmBooking(req.query.booking_id)  // FAUX
})

// ✅ Seul le webhook est une source de vérité
app.post('/webhooks/payment', async (req) => {
  // Vérifier signature → mettre à jour statut → confirmer booking
})
```

### Règle 2 — Calculer les montants côté serveur

```typescript
// ❌ Le client envoie le montant à payer
const { amount } = await req.json()
await createPaymentCharge(amount)

// ✅ Le serveur calcule le montant depuis la DB
const booking = await db.bookings.findById(bookingId)
const amount = booking.deposit_amount > 0 ? booking.deposit_amount : booking.total_price
await createPaymentCharge(amount)
```

### Règle 3 — Vérifier le solde disponible avant un reversement

```typescript
// ❌ Accepter le montant demandé sans vérification
const { amount } = await req.json()
await payout(amount)

// ✅ Calculer le solde réel, rejeter si insuffisant
const totalCollected = await db.payments.sum('amount', { status: 'completed', salon_id })
const totalPaidOut   = await db.payouts.sum('gross_amount', { status: ['pending','completed'], salon_id })
const available = totalCollected - totalPaidOut

if (requestedAmount > available) {
  return { error: `Solde insuffisant. Disponible : ${available}` }
}
```

### Règle 4 — Idempotence sur tous les webhooks de paiement

```typescript
// Avant tout traitement, vérifier si déjà traité
const existing = await db.payments.findOne({ booking_id: bookingId })
if (existing?.status === 'completed') {
  return res.status(200).json({ ok: true, skipped: true })
}
// Traiter seulement si pas encore fait
```

### Règle 5 — Idempotence sur les reversements

```typescript
// Pour les virements automatiques (ex: Bictorys Payout API)
// Utiliser un idempotency-key = l'UUID du payout en base
await fetch('/payouts', {
  headers: { 'idempotency-key': payout.id },  // UUID unique par opération
  body: JSON.stringify({ amount: payout.net_amount })
})
// Si la même clé est renvoyée, l'API ne crée pas un second virement
```

---

## 6. Cryptographie et secrets

### 6.1 Comparaison de secrets — toujours constant-time

La comparaison `===` s'arrête au premier caractère différent. Un attaquant peut extraire un secret caractère par caractère en mesurant le temps de réponse.

```typescript
// ❌ Vulnérable aux timing attacks
if (headerSecret === process.env.WEBHOOK_SECRET) { ... }

// ✅ Comparaison constant-time
import crypto from 'crypto'

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

if (timingSafeEqual(headerSecret, process.env.WEBHOOK_SECRET ?? '')) { ... }
```

**S'applique à :** secrets webhook, clés API entrantes, tokens de session, CRON_SECRET.

### 6.2 Ne jamais stocker des secrets en clair si évitable

```typescript
// Pour les clés API de tiers stockées en DB
// Option A : chiffrement applicatif (AES-256-GCM)
// Option B : colonne chiffrée avec pgcrypto (Supabase/Postgres)
// Option C : secrets vault (HashiCorp Vault, AWS Secrets Manager)

// À minima : ne jamais les logger
console.log('Clé API:', apiKey)  // ❌ JAMAIS
console.log('Clé API: [REDACTED]')  // ✅
```

### 6.3 Variables d'environnement — règles

```env
# Jamais de secrets dans le code source
# Jamais de .env dans git (vérifier .gitignore)

# Préfixes Next.js :
# NEXT_PUBLIC_* → exposé au navigateur (anon key, URL publique uniquement)
# Sans préfixe   → côté serveur uniquement (service_role, clés API, secrets)
```

```typescript
// Valider la présence des secrets au démarrage
const requiredEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'WEBHOOK_SECRET',
  'CRON_SECRET',
]

for (const key of requiredEnvVars) {
  if (!process.env[key]) throw new Error(`Variable d'environnement manquante : ${key}`)
}
```

---

## 7. Rate limiting et protection brute-force

### Principe : toute action répétable sans coût doit être limitée

| Endpoint | Limite recommandée | Fenêtre |
|---|---|---|
| Login | 10 tentatives échouées | 15 min |
| Reset de mot de passe (demande) | 3 demandes | 1 heure |
| Reset de mot de passe (confirmation) | 5 tentatives | 15 min |
| Création de compte | 5 créations | 1 heure par IP |
| Endpoints publics (réservations) | 20 requêtes | 1 minute |
| Endpoints publics (disponibilités) | 60 requêtes | 1 minute |

### Implémentation — table DB (sans dépendance externe)

```sql
CREATE TABLE login_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier    TEXT NOT NULL,        -- email, phone_email, IP
  attempt_type  TEXT NOT NULL,        -- 'login', 'pin_reset', 'signup'
  success       BOOLEAN NOT NULL DEFAULT false,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON login_attempts (identifier, attempted_at DESC);
```

```typescript
async function isRateLimited(identifier: string, type: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs).toISOString()
  const { count } = await adminDb
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('attempt_type', type)
    .eq('success', false)
    .gte('attempted_at', windowStart)
  return (count ?? 0) >= maxAttempts
}
```

### Implémentation — Upstash Redis (recommandé en production)

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '15 m'),
})

const { success } = await ratelimit.limit(identifier)
if (!success) return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
```

### Réponse aux tentatives bloquées

```typescript
// ❌ Indiquer le temps restant exact (aide l'attaquant à synchroniser)
return { error: 'Compte bloqué pour encore 847 secondes.' }

// ✅ Message générique
return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
```

---

## 8. Base de données et RLS

### Règle 1 — RLS activé sur TOUTES les tables, sans exception

```sql
-- Activer sur chaque nouvelle table immédiatement après CREATE TABLE
ALTER TABLE ma_nouvelle_table ENABLE ROW LEVEL SECURITY;

-- Sans policy explicite, RLS bloque tout accès → behavior sûr par défaut
-- Ajouter les policies nécessaires explicitement
```

### Règle 2 — Policies restrictives par défaut

```sql
-- ❌ Policy trop permissive
CREATE POLICY "public_read" ON bookings FOR SELECT USING (true);

-- ✅ Lecture publique uniquement sur les champs nécessaires, filtrée
CREATE POLICY "client_read_own" ON bookings
  FOR SELECT USING (client_token = current_setting('app.client_token', true));

-- ✅ Owner voit uniquement son salon
CREATE POLICY "owner_access" ON bookings
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );
```

### Règle 3 — Fonctions SECURITY DEFINER — utiliser avec parcimonie

```sql
-- SECURITY DEFINER exécute la fonction avec les droits du créateur (superuser)
-- Utiliser uniquement pour les helpers RLS qui ont besoin d'accès élevé
-- Toujours ajouter STABLE ou IMMUTABLE pour limiter les side effects

CREATE OR REPLACE FUNCTION get_my_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Règle 4 — Pas de SQL dynamique dans les RPC

```sql
-- ❌ SQL dynamique avec interpolation de chaînes = injection SQL
CREATE FUNCTION search_bookings(search_term TEXT) RETURNS SETOF bookings AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT * FROM bookings WHERE notes LIKE ''%' || search_term || '%''';
END;
$$ LANGUAGE plpgsql;

-- ✅ Requêtes paramétrées
CREATE FUNCTION search_bookings(search_term TEXT) RETURNS SETOF bookings AS $$
  SELECT * FROM bookings WHERE notes ILIKE '%' || search_term || '%';
$$ LANGUAGE sql STABLE;
```

### Règle 5 — Migrations : toujours inclure RLS

```sql
-- Template pour chaque nouvelle migration créant une table
CREATE TABLE IF NOT EXISTS nouvelle_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  -- autres colonnes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nouvelle_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_access" ON nouvelle_table
  FOR ALL USING (salon_id = get_my_salon_id());
```

---

## 9. Webhooks

Les webhooks reçoivent des données de systèmes externes — ils sont une surface d'attaque critique.

### Règle 1 — Toujours valider la signature avant tout traitement

```typescript
export async function POST(req: NextRequest) {
  const rawBody = await req.text()  // Lire en text pour la vérification de signature
  const signature = req.headers.get('x-signature') ?? ''

  // Valider AVANT de parser ou de traiter quoi que ce soit
  if (!timingSafeEqual(signature, process.env.WEBHOOK_SECRET ?? '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  // Traiter seulement ici
}
```

### Règle 2 — Retourner 200 même en cas d'erreur interne

```typescript
// Si on retourne 4xx/5xx, le fournisseur retentera → risque de double traitement
try {
  await processWebhook(payload)
  return NextResponse.json({ ok: true })
} catch (err) {
  console.error('[webhook]', err)
  // Logger l'erreur mais retourner 200 pour stopper les retries
  return NextResponse.json({ ok: true, error: 'processing_failed' })
}
```

### Règle 3 — Idempotence obligatoire

```typescript
// Toujours vérifier si l'event a déjà été traité
const existing = await db.events.findOne({ provider_event_id: payload.id })
if (existing) return NextResponse.json({ ok: true, skipped: true })

// Marquer immédiatement comme "en cours" avant le traitement
await db.events.insert({ provider_event_id: payload.id, status: 'processing' })
```

### Règle 4 — Multi-tenant : valider le secret du bon tenant

```typescript
// En multi-tenant, chaque salon peut avoir son propre webhook secret
// Il faut d'abord identifier le tenant, puis valider avec son secret

const bookingId = payload.merchantReference  // identifier le tenant via l'event
const salon = await getSalonByBooking(bookingId)
const expectedSecret = salon?.webhook_secret ?? process.env.PLATFORM_WEBHOOK_SECRET ?? ''

if (!timingSafeEqual(headerSecret, expectedSecret)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

---

## 10. Exposition d'informations

### Règle 1 — Messages d'erreur génériques côté client

```typescript
// ❌ Révèle des détails d'implémentation
return { error: 'Column "deposit_amount" violates not-null constraint' }
return { error: 'JWT expired at 2026-01-01T00:00:00Z' }
return { error: 'User with email 221771234567@beautydesk.app not found' }

// ✅ Messages génériques
return { error: 'Réservation introuvable.' }
return { error: 'Session expirée. Reconnectez-vous.' }
return { error: 'Numéro ou code PIN incorrect.' }

// Les détails techniques vont dans les logs serveur uniquement
console.error('[signIn] Supabase error:', error.message)
```

### Règle 2 — Ne pas logguer de données sensibles

```typescript
// ❌ Clés et données personnelles dans les logs
console.log('API key:', apiKey)
console.log('User data:', { name, phone, pin })

// ✅ Logguer uniquement les identifiants non sensibles
console.log('[createCharge] salon_id:', salonId, 'amount:', amount)
console.error('[createCharge] error:', error.message)
```

### Règle 3 — Champs masqués dans les réponses API

```typescript
// ❌ Retourner tous les champs du salon, y compris les clés API
const salon = await db.salons.findById(id)
return NextResponse.json({ salon })

// ✅ Sélectionner uniquement les champs nécessaires
const salon = await db.salons.findById(id, {
  select: ['id', 'name', 'city', 'description', 'primary_color', 'logo_url']
  // Exclure : bictorys_secret_key, payout_wave_number, plan, etc.
})
```

### Règle 4 — Headers de sécurité HTTP

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

---

## 11. Gestion des sessions

### Règle 1 — Cookies sécurisés

```typescript
// Configuration des cookies de session
cookieOptions: {
  httpOnly: true,          // Inaccessible depuis JavaScript
  secure: process.env.NODE_ENV === 'production',  // HTTPS uniquement en prod
  sameSite: 'lax',         // Protection CSRF basique
  maxAge: 60 * 60 * 24 * 365,  // 1 an (ajuster selon le besoin)
  path: '/',
}
```

### Règle 2 — Tokens dans les URLs — les traiter comme éphémères

Les tokens dans les URLs (liens client, liens de reset) apparaissent dans :
- Les access logs du serveur
- L'historique du navigateur
- Les headers `Referer` des requêtes sortantes
- Les outils d'analytics

```typescript
// ✅ Atténuation : expiration courte + usage unique
const clientToken = crypto.randomUUID()
// Ce token expire avec la réservation, pas un token de long terme

// ✅ Pour les tokens de reset : usage unique, expiration 15 min
await db.pin_resets.update({ used: true }).eq('id', resetData.id)
```

### Règle 3 — Invalider les sessions à la déconnexion

```typescript
// ❌ Déconnexion purement client (localStorage)
localStorage.removeItem('token')

// ✅ Invalider côté serveur
await supabase.auth.signOut()  // révoque la session en DB
// Supprimer les cookies
```

### Règle 4 — Singleton pour le client navigateur (Supabase SSR)

```typescript
// ❌ Recréer le client à chaque render — perd les listeners de session
const supabase = createBrowserClient(url, key)

// ✅ Singleton — conserve l'auto-refresh du token
let client: SupabaseClient | null = null
export function getSupabaseClient() {
  if (!client) client = createBrowserClient(url, key, { /* cookieOptions */ })
  return client
}
```

---

## 12. Infrastructure et déploiement

### Règle 1 — Principe du moindre privilège

| Contexte | Client à utiliser |
|---|---|
| Server Components (lecture données utilisateur) | `createServerClient()` — respecte RLS |
| Server Actions (mutations utilisateur) | `createServerClient()` — respecte RLS |
| Webhooks de paiement | `createAdminClient()` — bypass RLS justifié |
| Cron jobs | `createAdminClient()` — bypass RLS justifié |
| Côté navigateur | `createBrowserClient()` — anon key uniquement |

### Règle 2 — Cron jobs — authentification robuste

```typescript
// ❌ Secret comparé avec ===
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

// ✅ Constant-time + vérification que le secret est configuré
if (!process.env.CRON_SECRET || !timingSafeEqual(authHeader, `Bearer ${process.env.CRON_SECRET}`)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Règle 3 — Dépendances

```bash
# Auditer régulièrement les dépendances
npm audit

# Maintenir les dépendances à jour (patches de sécurité)
npm outdated

# Ne jamais installer des packages sans vérifier leur popularité et maintenance
# Préférer les packages officiel du framework (next/*, @supabase/*)
```

### Règle 4 — Variables d'environnement en production

```bash
# Ne jamais mettre de secrets dans les variables publiques Vercel/Netlify
# NEXT_PUBLIC_* = visible par tous les utilisateurs dans le bundle JS

# Vérification : inspecter le bundle produit pour détecter des fuites
grep -r "secret" .next/static/  # Ne doit rien retourner de sensible
```

### Règle 5 — Sauvegardes et chiffrement au repos

- Les backups de base de données doivent être chiffrés
- Les clés de chiffrement ne doivent pas être stockées au même endroit que les données
- Tester la restauration des backups régulièrement (un backup non testé n'existe pas)

---

## 13. Checklist avant mise en production

### Authentification & Sessions
- [ ] Rate limiting sur le login (max N tentatives / fenêtre de temps)
- [ ] Rate limiting sur le reset de mot de passe (demande + confirmation)
- [ ] Cookies : `httpOnly`, `secure`, `sameSite` configurés
- [ ] Tokens générés avec `crypto.randomBytes` ou `crypto.randomUUID`
- [ ] Messages d'erreur génériques (pas de révélation d'existence de compte)
- [ ] Sessions invalidées côté serveur à la déconnexion

### Autorisation
- [ ] Chaque endpoint vérifie que la ressource appartient à l'utilisateur
- [ ] Tokens d'accès publics (liens client) obligatoires, pas optionnels
- [ ] Middleware protège toutes les routes sensibles (`/dashboard`, `/admin`, `/api/admin`)
- [ ] Relations entre entités validées (ex: staffId appartient au bon salon)
- [ ] Rôles lus depuis la DB, jamais depuis le body de la requête

### Données financières
- [ ] Montants calculés côté serveur depuis la DB
- [ ] Paiements confirmés uniquement via webhook, jamais via redirect
- [ ] Solde vérifié avant tout reversement
- [ ] Idempotence sur webhooks et payouts
- [ ] Variantes de prix validées contre la DB

### Cryptographie
- [ ] Comparaison de secrets avec `crypto.timingSafeEqual` partout
- [ ] Pas de `Math.random()` pour des tokens de sécurité
- [ ] Secrets sensibles non loggués
- [ ] `.env` dans `.gitignore`

### Base de données
- [ ] RLS activé sur toutes les tables
- [ ] Policies restrictives (pas de `USING (true)` sur des données sensibles)
- [ ] Migrations testées en staging avant production

### Webhooks
- [ ] Signature validée avant tout traitement
- [ ] Idempotence implémentée
- [ ] Retour HTTP 200 même en cas d'erreur interne
- [ ] Secrets webhook différents par tenant (si multi-tenant)

### Infrastructure
- [ ] `npm audit` sans vulnérabilités critiques
- [ ] Variables d'environnement vérifiées au démarrage
- [ ] Headers de sécurité HTTP configurés
- [ ] Logs ne contiennent pas de données sensibles
- [ ] Backups configurés et testés

---

## Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Les 10 failles les plus courantes
- [OWASP API Security](https://owasp.org/www-project-api-security/) — Spécifique aux APIs REST
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
