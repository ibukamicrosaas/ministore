# Bictorys — Guide d'intégration complet

> Document de référence unique pour l'intégration de Bictorys de A à Z.
> Couvre : charges (paiements entrants), webhooks, vérification de statut, payouts (reversements).
> Inclut les pièges découverts en production sur MiniStore, Sheka et BeautyDesk.
>
> À donner tel quel à un agent IA de code ou à un développeur.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Variables d'environnement et clés](#2-variables-denvironnement-et-clés)
3. [Codes pays et moyens de paiement](#3-codes-pays-et-moyens-de-paiement)
4. [Normalisation du numéro de téléphone](#4-normalisation-du-numéro-de-téléphone)
5. [Créer un paiement — Charges](#5-créer-un-paiement--charges)
6. [Flow OTP Orange Money (CI / BK)](#6-flow-otp-orange-money-ci--bk)
7. [Webhooks — réception et validation](#7-webhooks--réception-et-validation)
8. [Vérification de statut — fallback](#8-vérification-de-statut--fallback)
9. [Payouts — reversements](#9-payouts--reversements)
10. [Modèle de données recommandé](#10-modèle-de-données-recommandé)
11. [Pièges et bugs connus (critique)](#11-pièges-et-bugs-connus-critique)
12. [Sécurité](#12-sécurité)
13. [Checklists](#13-checklists)
14. [Prompt d'intégration pour agent IA](#14-prompt-dintégration-pour-agent-ia)

---

## 1. Vue d'ensemble

Bictorys est un agrégateur de paiement mobile money africain. Il supporte Wave, Orange Money, MTN Money, Moov Money, Maxit, Togocell, Mobicash et carte bancaire selon les pays activés sur le compte.

**Base URL production :** `https://api.bictorys.com/pay/v1`
**Base URL sandbox :** `https://api.test.bictorys.com`

**Dashboard :** `https://dashboard.bictorys.com`
- **Developers → API Keys** : clé publique (charges) et clé privée (payouts)
- **Developers → Webhooks** : configurer l'URL et récupérer le webhook secret

**Flow de paiement :**
```
Application → POST /charges → Bictorys retourne URL ou instructions
Utilisateur paie → Bictorys envoie webhook → Application met à jour la commande
```

**Ne jamais exposer les clés côté client.** Toutes les requêtes Bictorys passent par le backend.

---

## 2. Variables d'environnement et clés

```env
# Sandbox
BICTORYS_API_URL=https://api.test.bictorys.com
BICTORYS_API_KEY=test_public-XXXX.YYYY         # Clé publique (charges)
BICTORYS_PRIVATE_KEY=test_secret-XXXX.YYYY     # Clé privée (payouts)
BICTORYS_WEBHOOK_SECRET=votre_secret_test

# Production
# BICTORYS_API_URL=https://api.bictorys.com
# BICTORYS_API_KEY=public-XXXX.YYYY
# BICTORYS_PRIVATE_KEY=secret-XXXX.YYYY
# BICTORYS_WEBHOOK_SECRET=votre_secret_prod
# BICTORYS_MERCHANT_SECRET_CODE=1234   # Optionnel pour les payouts
```

| Variable | Usage | Obligatoire |
|---|---|---|
| `BICTORYS_API_KEY` | Créer une charge, vérifier un statut | ✓ |
| `BICTORYS_PRIVATE_KEY` | Payouts uniquement — la clé publique retourne 401 | ✓ si payouts |
| `BICTORYS_WEBHOOK_SECRET` | Valider les webhooks entrants | ✓ |
| `BICTORYS_MERCHANT_SECRET_CODE` | `merchant.secretCode` dans le body payout | Optionnel |
| `BICTORYS_API_URL` | Changer d'environnement (sandbox ↔ prod) | Optionnel |

**Important :** `BICTORYS_PRIVATE_KEY` commence par `secret-...`. `BICTORYS_API_KEY` commence par `public-...` ou `test_public-...`. Ne pas les confondre — une charge avec la clé privée retourne une erreur, un payout avec la clé publique retourne 401.

---

## 3. Codes pays et moyens de paiement

### Codes pays Bictorys

| Pays | Code | Indicatif |
|---|---|---|
| Sénégal | `SN` | `+221` |
| Côte d'Ivoire | `CI` | `+225` |
| Burkina Faso | `BK` (parfois `BF` selon endpoints) | `+226` |
| Mali | `ML` | `+223` |
| Togo | `TG` | `+228` |
| Bénin | `BJ` | `+229` |

### `payment_type` supportés

| Valeur | Moyen |
|---|---|
| `wave_money` | Wave |
| `orange_money` | Orange Money |
| `mtn_money` | MTN Money |
| `moov` | Moov Money / Flooz |
| `togocell` | Togocell |
| `mobicash` | Mobicash |
| `maxit` | Maxit (Sénégal) |
| `card` | Carte bancaire |

### Disponibilité par pays (validée sur le compte TEKKIShop — juin 2026)

> ⚠️ Ces méthodes reflètent ce qui est **activé sur le compte Bictorys TEKKIShop**. Un autre compte peut avoir un périmètre différent. Toujours vérifier via le dashboard Bictorys avant d'exposer une méthode à l'utilisateur.

| Pays | Méthodes disponibles | OTP requis |
|---|---|---|
| SN | `wave_money`, `maxit` | non |
| CI | `wave_money`, `orange_money`, `mtn_money`, `moov` | oui (orange_money uniquement) |
| BK | `wave_money`, `orange_money`, `moov` | oui (orange_money uniquement) |
| ML | `orange_money`, `mobicash` | non |
| TG | `moov`, `togocell` | non |
| BJ | `mtn_money`, `moov` | non |

**Retraits importants depuis la mise en service initiale :**
- `orange_money` retiré pour SN (Sénégal) — non activé sur le compte TEKKIShop
- `wave_money` retiré pour ML (Mali) — retourne `E400-33: Wrong payment type or disabled:wave_money`
- `mobicash` ajouté pour ML, `togocell` ajouté pour TG (catalogue mars 2026)

Pour récupérer dynamiquement les méthodes réellement activées :
```
GET {BICTORYS_API_URL}/onboarding/v1/payment-methods/me
X-API-Key: {BICTORYS_PRIVATE_KEY}
```
Mettre le résultat en cache 15 à 60 minutes côté backend.

---

## 4. Normalisation du numéro de téléphone

Bictorys exige le format international E.164 (`+221771234567`).

```typescript
export function normalizePhoneForBictorys(rawPhone: string, defaultCountry?: string): string {
  const cleaned = rawPhone.replace(/[\s().\-]/g, '')

  let result: string
  if (cleaned.startsWith('+')) {
    result = cleaned
  } else if (cleaned.startsWith('00')) {
    result = `+${cleaned.slice(2)}`
  } else {
    // Appliquer le pays par défaut si le numéro est local
    if (defaultCountry === 'SN' && cleaned.length === 9) return `+221${cleaned}`
    if (defaultCountry === 'CI' && cleaned.length >= 8)  return `+225${cleaned}`
    if (defaultCountry === 'ML' && cleaned.length >= 8)  return `+223${cleaned}`
    if (defaultCountry === 'TG' && cleaned.length >= 8)  return `+228${cleaned}`
    if (defaultCountry === 'BJ' && cleaned.length >= 8)  return `+229${cleaned}`
    if ((defaultCountry === 'BF' || defaultCountry === 'BK') && cleaned.length >= 8) return `+226${cleaned}`
    result = `+${cleaned}`
  }

  // Correction CI : numéros 10 chiffres locaux parfois réduits à 9 après nettoyage
  if (result.startsWith('+225') && result.length === 13) {
    result = `+225${`0${result.slice(4)}`}`
  }

  return result
}

export function detectCountryFromPhone(phone: string): 'SN' | 'CI' | 'BK' | 'ML' | 'TG' | 'BJ' | null {
  const normalized = normalizePhoneForBictorys(phone)
  if (normalized.startsWith('+221')) return 'SN'
  if (normalized.startsWith('+225')) return 'CI'
  if (normalized.startsWith('+226')) return 'BK'
  if (normalized.startsWith('+223')) return 'ML'
  if (normalized.startsWith('+228')) return 'TG'
  if (normalized.startsWith('+229')) return 'BJ'
  return null
}
```

---

## 5. Créer un paiement — Charges

### Endpoint

```
POST {BICTORYS_API_URL}/pay/v1/charges
POST {BICTORYS_API_URL}/pay/v1/charges?payment_type=wave_money
```

Header : `X-Api-Key: {BICTORYS_API_KEY}`

### Body

```json
{
  "amount": 7500,
  "currency": "XOF",
  "country": "SN",
  "paymentReference": "tekkishop-a1b2c3d4",
  "merchantReference": "order-uuid-ici",
  "successRedirectUrl": "https://votre-app.com/success?order_id=xxx",
  "ErrorRedirectUrl": "https://votre-app.com/error?order_id=xxx",
  "webhookUrl": "https://votre-app.com/api/webhooks/bictorys",
  "customerObject": {
    "name": "Aminata Diallo",
    "phone": "+221771234567",
    "email": "aminata@example.com",
    "country": "SN",
    "locale": "fr-FR"
  },
  "orderDetails": [
    { "name": "Produit X", "price": 7500, "quantity": 1, "taxRate": 0 }
  ]
}
```

| Champ | Requis | Description |
|---|---|---|
| `amount` | ✓ | Entier en FCFA (>= 100, sans décimales) |
| `currency` | ✓ | Toujours `"XOF"` |
| `country` | ✓ | Code pays Bictorys |
| `paymentReference` | ✓ | Référence courte unique (affichée à l'utilisateur). Format : `{prefix}-{8chars}` |
| `merchantReference` | Recommandé | Votre UUID interne — **renvoyé dans le webhook**. Utiliser l'ID de la commande/réservation |
| `successRedirectUrl` | ✓ | Redirection après paiement (attention : ce n'est pas la preuve du paiement) |
| `ErrorRedirectUrl` | ✓ | `E` majuscule selon la doc Bictorys |
| `webhookUrl` | Recommandé | URL POST pour la confirmation — peut aussi être configuré dans le dashboard |
| `otp` | Conditionnel | Uniquement pour Orange Money CI/BK |

**Important :** `paymentReference` ≠ `merchantReference`. Voir [section 11](#11-pièges-et-bugs-connus-critique) pour les pièges liés à cette distinction.

### Réponse

Le nom du champ URL varie selon la version. Tester dans cet ordre :

```typescript
const checkoutUrl = json.link ?? json.url ?? json.confirmationLink ?? json.redirectUrl
const transactionId = json.id ?? json.transactionId ?? json.charge_id ?? json.chargeId
```

- `link` → deep link Wave (redirection mobile)
- `qrCode` → QR code base64 (Wave desktop)
- `message` → instructions USSD (Orange Money, MTN, Moov)
- Absence de `link` + présence de `message` = paiement push (aucune redirection)

**Ne jamais marquer le paiement comme confirmé à la création de la charge.** La `successRedirectUrl` est déclenchée que le paiement ait réussi ou non. La source de vérité est le webhook.

### Implémentation TypeScript

```typescript
export async function createBictorysCharge(
  apiKey: string,
  payload: BictorysChargePayload,
  paymentType?: BictorysPaymentType,
): Promise<{ checkoutUrl?: string; transactionId: string; message?: string }> {
  const url = paymentType
    ? `${BICTORYS_BASE_URL}/charges?payment_type=${paymentType}`
    : `${BICTORYS_BASE_URL}/charges`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    throw err instanceof Error && err.name === 'AbortError'
      ? new Error('Bictorys: délai dépassé (10s)')
      : err
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new Error(`Bictorys error ${res.status}: ${await res.text()}`)

  const json = await res.json() as Record<string, unknown>
  const checkoutUrl = (json.link ?? json.url ?? json.confirmationLink ?? json.redirectUrl) as string | undefined
  const message = json.message as string | undefined
  const transactionId = (json.chargeId ?? json.charge_id ?? json.id ?? json.transactionId) as string | undefined

  if (!checkoutUrl && !message && !transactionId) {
    throw new Error(`Bictorys: réponse invalide: ${JSON.stringify(json)}`)
  }

  return { checkoutUrl, transactionId: transactionId ?? '', message }
}
```

---

## 6. Flow OTP Orange Money (CI / BK)

Certains flows Orange Money exigent un OTP généré par l'utilisateur avant la charge.

```typescript
export function bictorysNeedsOtp(paymentType: string, country: string): boolean {
  return paymentType === 'orange_money' && (country === 'CI' || country === 'BK')
}
```

**UX recommandée :**
1. L'utilisateur sélectionne Orange Money
2. Si pays CI ou BK → afficher l'étape OTP
3. Afficher le message : _"Composez #144*82# sur votre téléphone Orange Money"_ (CI) ou _"Composez \*144\*4\*6\*[montant]# "_ (BK)
4. L'utilisateur saisit le code reçu
5. Créer la charge avec le champ `otp`
6. Afficher le `message` retourné par Bictorys

En cas d'OTP invalide ou expiré, ne pas renvoyer au formulaire complet — renvoyer uniquement à l'étape OTP avec un message clair.

---

## 7. Webhooks — réception et validation

### Configuration

Dans le dashboard Bictorys → **Developers → Webhooks** :
- Ajouter l'URL publique : `https://votre-app.com/api/webhooks/bictorys`
- Définir le Secret Key
- Répéter séparément pour sandbox et production

**Piège #1 critique** : Si votre domaine redirige (ex: `tekki.shop` → `www.tekki.shop`), Bictorys abandonne sur la redirection 307. L'URL webhook doit correspondre exactement au domaine final — avec ou sans `www`. Tester :
```bash
curl -i -X POST https://votre-url/api/webhooks/bictorys
# Doit retourner 200 ou 400/401, JAMAIS 307
```

### Headers envoyés par Bictorys

```
X-Secret-Key: <webhook_secret>              ← comparaison simple
X-Webhook-Signature: <hmac_sha256_hex>      ← HMAC si présent
X-Webhook-Timestamp: <unix_ms>              ← anti-replay
```

**Validation (priorité HMAC > Secret statique) :**

```typescript
import crypto from 'crypto'

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch { return false }
}

function verifyBictorysWebhook(
  rawBody: string,
  headers: { signature?: string; timestamp?: string; secretKey?: string },
  envSecret: string,
): boolean {
  if (headers.signature && headers.timestamp) {
    const ts = parseInt(headers.timestamp, 10)
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) return false
    const expected = crypto.createHmac('sha256', envSecret)
      .update(`${headers.timestamp}.${rawBody}`).digest('hex')
    return timingSafeCompare(headers.signature, expected)
  }
  if (headers.secretKey) {
    return timingSafeCompare(headers.secretKey, envSecret)
  }
  return false
}
```

Ne jamais comparer les secrets avec `===`. Utiliser systématiquement `timingSafeEqual`.

### Payload webhook type

```json
{
  "id": "txn-uuid",
  "status": "succeeded",
  "amount": 7500,
  "currency": "XOF",
  "paymentReference": "tekkishop-a1b2c3d4",
  "merchantReference": "order-uuid-ici"
}
```

Statuts possibles : `succeeded`, `authorized`, `pending`, `processing`, `failed`, `cancelled`, `reversed`.

`succeeded` et `authorized` = paiement confirmé. Traiter les deux comme un succès.

### Traitement Next.js App Router

```typescript
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const headerSecret = req.headers.get('x-secret-key') ?? ''
  const signature   = req.headers.get('x-webhook-signature') ?? undefined
  const timestamp   = req.headers.get('x-webhook-timestamp') ?? undefined

  // Parser d'abord (lenient) pour extraire les références
  let payload: BictorysWebhookPayload
  try { payload = JSON.parse(rawBody) as BictorysWebhookPayload }
  catch { return NextResponse.json({ error: 'Payload invalide' }, { status: 400 }) }

  // Valider la signature
  const envSecret = process.env.BICTORYS_WEBHOOK_SECRET ?? ''
  const isValid = verifyBictorysWebhook(rawBody, { signature, timestamp, secretKey: headerSecret }, envSecret)
  // Ne pas logger le secret, ne pas révéler si invalide à Bictorys
  if (!isValid) return NextResponse.json({ received: true }) // 200 pour éviter les retries

  // Idempotence : vérifier si déjà traité
  const isBictorysSuccess = (s: string) => s === 'succeed' || s === 'succeeded' || s === 'authorized'

  // Extraire la référence : merchantReference = UUID interne, paymentReference = référence courte
  // Voir section 11 pour le piège critique sur ces deux champs
  const merchantReference = payload.merchantReference ?? payload.paymentReference

  // Charger la commande, vérifier montant + devise, mettre à jour, notifier
  // ... logique métier ...

  // Toujours retourner 200 — même en cas d'erreur interne
  return NextResponse.json({ ok: true })
}
```

**Règles absolues :**
- Toujours retourner HTTP 200, même en cas d'erreur de traitement
- Logger le payload brut avant tout traitement
- Vérifier `amount` et `currency` avant de valider une commande (anti-fraude)
- Traitement idempotent : si le paiement est déjà `completed`, retourner 200 sans rien faire
- Bictorys peut envoyer le même webhook plusieurs fois

### Piège : `paymentReference` vs `merchantReference` dans le webhook

Dans certains cas (abonnements), Bictorys retourne `merchantReference: null` et met votre identifiant dans `paymentReference`. Chercher les deux :

```typescript
const reference = payload.merchantReference ?? payload.paymentReference
```

---

## 8. Vérification de statut — fallback

Webhooks non garantis à 100%. Implémenter un fallback cron ou polling.

**Endpoint :**
```
GET {BICTORYS_API_URL}/pay/v1/charges/{transactionId}
X-Api-Key: {BICTORYS_API_KEY}
```

```typescript
export async function getBictorysCharge(
  apiKey: string,
  chargeId: string,
): Promise<BictorysWebhookPayload> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${BICTORYS_BASE_URL}/charges/${encodeURIComponent(chargeId)}`, {
      headers: { 'X-Api-Key': apiKey },
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Bictorys error ${res.status}`)
    return res.json() as Promise<BictorysWebhookPayload>
  } finally {
    clearTimeout(timeout)
  }
}
```

**Cron de fallback (Vercel) :** Vérifier les paiements `pending` depuis moins de 24h, appeler Bictorys pour chacun, activer si `succeed`.

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/verify-pending-payments", "schedule": "*/5 * * * *" }
  ]
}
```

---

## 9. Payouts — reversements

### Endpoint

```
POST {BICTORYS_API_URL}/pay/v1/payouts?payment_type=wave_money
POST {BICTORYS_API_URL}/pay/v1/payouts?payment_type=orange_money
```

### Headers requis

```
Content-Type: application/json
accept: application/json
X-API-Key: {BICTORYS_PRIVATE_KEY}     ← clé privée, PAS la clé publique
idempotency-key: {uuid-du-payout}     ← obligatoire, utiliser l'UUID en base
```

### Body minimal (validé en production)

```json
{
  "amount": 22310,
  "currency": "XOF",
  "country": "SN",
  "customerObject": {
    "name": "Chez Soso",
    "phone": "+221771234567"
  },
  "paymentReason": "Reversement TEKKIShop — Chez Soso",
  "merchantReference": "payout-abc12345"
}
```

Tous les champs optionnels dans le body (dont `merchant.secretCode`, `transactionType`, `locale`, `email`) peuvent être omis sans erreur — confirmé en production.

| Champ | Requis | Description |
|---|---|---|
| `amount` | ✓ | Montant net à reverser en FCFA (entier >= 100) |
| `currency` | ✓ | `"XOF"` |
| `country` | ✓ | Code pays du bénéficiaire |
| `customerObject.name` | ✓ | Nom du bénéficiaire |
| `customerObject.phone` | ✓ | Numéro Wave ou OM du bénéficiaire (format international) |
| `paymentReason` | Optionnel | Libellé visible sur le relevé du bénéficiaire |
| `merchantReference` | Optionnel | Votre identifiant interne |
| `merchant.secretCode` | Optionnel | Code secret marchand Bictorys (BICTORYS_MERCHANT_SECRET_CODE) |

### Réponse

- HTTP 200 ou 201 = succès
- `json.id ?? json.transactionId` = ID de transaction à stocker dans `bictorys_transfer_id`

### Implémentation TypeScript

```typescript
export async function createBictorysPayout(
  privateKey: string,
  payload: BictorysPayoutPayload,
  paymentType: 'wave_money' | 'orange_money' | 'mtn_money' | 'moov',
  idempotencyKey: string,
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(
      `${BICTORYS_BASE_URL}/payouts?payment_type=${encodeURIComponent(paymentType)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'accept':          'application/json',
          'X-API-Key':       privateKey,
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    )

    const rawText = await res.text()
    let json: Record<string, unknown> = {}
    try { json = JSON.parse(rawText) as Record<string, unknown> } catch { /* réponse HTML possible */ }

    if (res.ok || res.status === 201) {
      return { success: true, transactionId: (json.id ?? json.transactionId) as string | undefined }
    }
    return { success: false, error: `Bictorys payout ${res.status}: ${rawText}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  } finally {
    clearTimeout(timeout)
  }
}
```

### Architecture payout recommandée — appel inline (pattern BeautyDesk)

Ne pas créer un payout `pending` et attendre un cron. Appeler Bictorys directement dans la route de demande de retrait :

```typescript
// POST /api/payouts/request
export async function POST(req: NextRequest) {
  // 1. Authentifier l'utilisateur
  // 2. Récupérer les infos de la boutique (nom, pays, numéro de payout)
  // 3. Calculer le solde disponible CÔTÉ SERVEUR (ne jamais faire confiance au montant client)

  const [paymentsResult, payoutsResult] = await Promise.all([
    supabase.from('payments').select('amount').eq('shop_id', shopId).eq('status', 'completed'),
    admin.from('payouts').select('gross_amount').eq('shop_id', shopId)
      .in('status', ['pending', 'processing', 'completed']),
  ])
  const totalCollected    = (paymentsResult.data ?? []).reduce((s, p) => s + p.amount, 0)
  const totalPaidOutGross = (payoutsResult.data ?? []).reduce((s, p) => s + p.gross_amount, 0)
  const grossBalance      = totalCollected - totalPaidOutGross
  const commissionAmount  = Math.floor(grossBalance * (COMMISSION_RATE / 100))
  const netAmount         = grossBalance - commissionAmount

  if (netAmount < PAYOUT_MIN_AMOUNT) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

  // 4. Insérer en "processing" (RLS bloque les inserts → utiliser createAdminClient())
  const { data: payoutRecord } = await admin.from('payouts').insert({
    shop_id: shopId, gross_amount: grossBalance, commission_amount: commissionAmount,
    net_amount: netAmount, payout_method: method, payout_number: payoutNumber,
    status: 'processing',
  }).select('id').single()

  // 5. Appeler Bictorys immédiatement
  const result = await createBictorysPayout(
    process.env.BICTORYS_PRIVATE_KEY!,
    { amount: netAmount, currency: 'XOF', country, customerObject: { name: shopName, phone: payoutNumber },
      paymentReason: `Reversement — ${shopName}`, merchantReference: payoutRecord.id },
    bictorysPaymentType,
    payoutRecord.id, // idempotency key = UUID du payout
  )

  if (result.success) {
    await admin.from('payouts').update({
      status: 'completed', bictorys_transfer_id: result.transactionId ?? null,
      completed_at: new Date().toISOString(),
    }).eq('id', payoutRecord.id)
    return NextResponse.json({ success: true, auto: true })
  }

  // Échec → passer en pending pour traitement manuel
  await admin.from('payouts').update({ status: 'pending' }).eq('id', payoutRecord.id)
  return NextResponse.json({ success: true, auto: false })
}
```

**Pourquoi ce pattern ?**
- Retrait instantané pour l'utilisateur (pas de cron à 6h du matin)
- Si Bictorys échoue → `pending` pour traitement manuel admin
- Même `idempotency-key` réutilisable en cas de retry

### Erreurs payout fréquentes

| HTTP / message | Cause | Action |
|---|---|---|
| `401` | Clé publique utilisée au lieu de la privée | Vérifier `BICTORYS_PRIVATE_KEY` |
| `400 balance` | Solde Bictorys insuffisant | Alerter admin |
| `400 secretCode` | `merchant.secretCode` incorrect | Vérifier ou omettre le champ |
| `400 phone` | Format numéro invalide | Corriger normalisation |
| `403 Access right not sufficient` | Mauvaise clé ou droits insuffisants | Vérifier clé privée |
| HTML `Forbidden` | WAF / rate limit | Backoff exponentiel |

---

## 10. Modèle de données recommandé

### Table `payments`

```sql
payments
- id uuid primary key default gen_random_uuid()
- shop_id uuid references shops(id)
- order_id uuid nullable
- provider varchar not null default 'bictorys'
- provider_payment_id varchar unique nullable   -- chargeId Bictorys (peut être null au début)
- amount integer not null
- currency varchar not null default 'XOF'
- status varchar not null default 'pending'    -- pending / completed / failed
- paid_at timestamp nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

**Important :** `provider_payment_id` peut être un placeholder (`bictorys-{orderId}`) au moment de la création de la charge si Bictorys ne retourne pas encore l'ID réel. Le webhook mettra à jour avec le vrai `chargeId`. Voir [section 11](#11-pièges-et-bugs-connus-critique).

### Table `payouts`

```sql
payouts
- id uuid primary key default gen_random_uuid()
- shop_id uuid references shops(id)
- gross_amount integer not null    -- total collecté brut (avant commission)
- commission_amount integer not null
- net_amount integer not null      -- montant envoyé au marchand
- payout_method varchar not null   -- wave, orange_money, mtn, moov, etc.
- payout_number varchar not null   -- numéro Wave ou OM du marchand
- status varchar not null default 'processing'
                                   -- processing / completed / pending / failed
- bictorys_transfer_id varchar unique nullable
- requested_at timestamp not null default now()
- completed_at timestamp nullable
- updated_at timestamp not null default now()
```

**Convention `gross_amount` / `net_amount` :**
- `gross_amount` = total collecté dans cette demande de retrait (avant commission TekkiShop)
- `net_amount` = montant effectivement envoyé au marchand
- La page Revenus utilise `net_amount` pour calculer `totalAlreadyOut`
- La route payout utilise `gross_amount` pour calculer `grossBalance` (évite la double commission)

### Table `payment_webhook_events` (recommandé pour l'audit)

```sql
payment_webhook_events
- id uuid primary key
- provider varchar not null default 'bictorys'
- bictorys_transaction_id varchar nullable
- status varchar nullable
- signature_valid boolean not null default false
- raw_body text not null
- parsed_payload jsonb nullable
- received_at timestamp not null default now()
```

---

## 11. Pièges et bugs connus (critique)

### Piège 1 : `paymentReference` vs `merchantReference` — distinction critique

Dans la charge Bictorys, deux champs existent :
- `paymentReference` : référence **courte** affichée à l'utilisateur. Format : `{prefix}-{8chars}`. C'est une **clé de routage**, pas un UUID interne.
- `merchantReference` : votre **UUID interne** (orderID, bookingId, etc.). Renvoyé intact dans le webhook.

**Erreur classique :** utiliser `payload.paymentReference` pour retrouver la commande en base. Ce champ contient `tekkishop-a1b2c3d4`, pas l'UUID de la commande.

**Solution :**
```typescript
// Dans le webhook :
const orderId = payload.merchantReference ?? payload.paymentReference
// Chercher d'abord par merchantReference (UUID), fallback sur paymentReference
```

### Piège 2 : `provider_payment_id` de substitution

Si Bictorys ne retourne pas de `chargeId` dans la réponse initiale (certains flows), on stocke un placeholder `bictorys-{orderId}`. Le webhook retourne le vrai `chargeId` dans `payload.id`. Les deux ne correspondent pas → le match par `provider_payment_id` échoue.

**Solution :** double lookup dans le webhook :
```typescript
// 1. Chercher par chargeId (payload.id)
let payment = await supabase.from('payments')
  .select().eq('provider_payment_id', payload.id).maybeSingle()

// 2. Fallback : chercher par order_id / merchantReference
if (!payment) {
  payment = await supabase.from('payments')
    .select().eq('order_id', merchantReference).maybeSingle()
}
```

### Piège 3 : Double commission sur les payouts

**Erreur classique :** la page Revenus affiche un `availableBalance` déjà net (après commission). Si la route payout reçoit ce montant comme `grossAmount` et déduit à nouveau la commission, le marchand perd deux fois la commission.

**Mauvais pattern :**
```typescript
// Frontend envoie availableBalance = 22310 (déjà net)
// Route reçoit amount = 22310
const commissionAmount = Math.floor(22310 * 0.03) // = 669 de trop !
const netAmount = 22310 - 669 // = 21641 au lieu de 22310
```

**Bon pattern (calculer côté serveur) :**
```typescript
// Ne jamais faire confiance au montant client
const totalCollected    = sum(payments.amount where status = 'completed')
const totalPaidOutGross = sum(payouts.gross_amount where status in ('pending','processing','completed'))
const grossBalance      = totalCollected - totalPaidOutGross  // = 23000 (brut)
const commission        = Math.floor(grossBalance * 0.03)    // = 690
const netAmount         = grossBalance - commission           // = 22310 ✓
```

### Piège 4 : RLS Supabase bloque les inserts dans `payouts`

`createServerClient()` respecte le RLS. Si la politique RLS ne permet pas aux utilisateurs d'insérer dans `payouts`, l'insert échoue silencieusement ou retourne 500.

**Solution :** utiliser `createAdminClient()` (service role) pour les inserts et updates dans `payouts`.

```typescript
const admin = createAdminClient() // bypass RLS
await admin.from('payouts').insert({ ... })
```

Pour les lectures (page Revenus), `createServerClient()` (RLS) suffit.

### Piège 5 : Redirection 307 sur l'URL webhook

Si votre domaine redirige HTTP→HTTPS ou sans-www→www, Bictorys abandonne sur la redirection et le webhook n'arrive jamais. Configurer l'URL webhook avec le domaine final exact.

```bash
# Tester avant de configurer
curl -i -X POST https://votre-domaine.com/api/webhooks/bictorys \
  -H "Content-Type: application/json" -d '{}'
# Doit retourner 200/400/401, PAS 307
```

### Piège 6 : Clé publique utilisée pour les payouts (401)

`BICTORYS_API_KEY` (`public-...` ou `test_public-...`) → pour les **charges** seulement.
`BICTORYS_PRIVATE_KEY` (`secret-...`) → pour les **payouts** uniquement.

Utiliser la mauvaise clé retourne 401 immédiatement.

### Piège 7 : Idempotency key manquante → double virement

Ne jamais appeler `/payouts` sans `idempotency-key`. En cas de timeout réseau, le retry sans nouvelle clé peut déclencher deux virements.

```typescript
idempotencyKey = payoutRecord.id  // UUID du payout en base = idempotency key
```

Si retry nécessaire, réutiliser exactement la même clé.

### Piège 8 : `.maybeSingle()` vs `.single()` sur les lookups

`.single()` throw une erreur si 0 résultat. `.maybeSingle()` retourne `null` si 0 résultat. Préférer `.maybeSingle()` pour les lookups de webhook où le record pourrait ne pas exister.

### Piège 9 : Méthode de paiement non activée sur le compte (`E400-33`)

Le catalogue Bictorys peut lister une méthode pour un pays (ex: `wave_money` pour ML) sans qu'elle soit activée sur votre compte marchand. Afficher cette option à l'utilisateur aboutit à l'erreur :

```
E400-33: Wrong payment type or disabled:wave_money
```

**Règle :** ne jamais se baser uniquement sur le catalogue général Bictorys pour déterminer les méthodes disponibles. Toujours vérifier ce qui est activé sur votre compte spécifique via le dashboard ou l'endpoint `/onboarding/v1/payment-methods/me`. Mettre à jour la liste hardcodée dès qu'une méthode est activée ou désactivée.

### Piège 10 : `BICTORYS_WEBHOOK_SECRET` désynchronisé

Si les webhooks arrivent (status HTTP 200) mais que la signature est systématiquement invalide, comparer le secret dans votre env (`BICTORYS_WEBHOOK_SECRET`) avec celui affiché dans le dashboard Bictorys → **Developers → Webhooks**. La moindre différence (espace, retour à la ligne, guillemet) provoque un rejet silencieux.

```
[webhook] Signature invalide — webhook de commande rejeté <merchantReference>
```

Pour diagnostiquer : logger (temporairement) les 8 premiers caractères des deux secrets pour confirmer qu'ils correspondent. Ne jamais logger le secret complet.

---

## 12. Sécurité

### Clés
- Ne jamais exposer `BICTORYS_PRIVATE_KEY` au frontend
- Ne jamais logger les clés API complètes
- Utiliser des variables d'environnement distinctes pour sandbox et production

### Montants
- Le montant à payer est toujours calculé côté backend depuis la commande/facture
- Au webhook, vérifier `amount` et `currency` avant de valider
- Ne jamais faire confiance au `amount` envoyé par le frontend pour les payouts

### Idempotence
- Une commande déjà payée ne doit jamais être livrée deux fois
- Un wallet ne doit pas être crédité deux fois pour le même webhook
- Un payout ne doit jamais être relancé avec une nouvelle `idempotency-key`

### Comparaison de secrets
- Toujours utiliser `crypto.timingSafeEqual()` pour comparer les secrets webhook
- Ne jamais utiliser `===` (timing attack)

---

## 13. Checklists

### Sandbox (avant d'écrire du code)

- [ ] Créer les clés sandbox dans le dashboard Bictorys
- [ ] Configurer `.env.local` avec les clés sandbox
- [ ] Ajouter l'URL webhook sandbox dans le dashboard
- [ ] Vérifier que l'URL webhook est publique (pas de 307) :
  `curl -i -X POST https://votre-url/api/webhooks/bictorys`
- [ ] Tester un paiement Wave Sénégal → webhook reçu → commande confirmée
- [ ] Tester un paiement échoué → webhook reçu → commande échouée
- [ ] Tester le même webhook deux fois → idempotence OK
- [ ] Tester le status check en fallback
- [ ] Tester un payout (si applicable) → vérifier `BICTORYS_PRIVATE_KEY`
- [ ] Vérifier les montants : entiers en FCFA, pas de décimales
- [ ] Vérifier les numéros : format `+indicatif`

### Production (avant le lancement)

- [ ] Remplacer `BICTORYS_API_URL` par `https://api.bictorys.com`
- [ ] Utiliser les clés production (sans préfixe `test_`)
- [ ] Configurer le webhook production dans le dashboard Bictorys
- [ ] Webhook secret production différent du sandbox
- [ ] `BICTORYS_PRIVATE_KEY` jamais exposée (grep dans le code)
- [ ] Faire un micro-paiement réel (500 FCFA) et vérifier le webhook
- [ ] Tester un payout réel vers un numéro contrôlé
- [ ] Vérifier les logs Vercel après chaque test
- [ ] Activer le cron de fallback pour les paiements pending
- [ ] Vérifier la réconciliation : commandes confirmées = paiements reçus

---

## 14. Prompt d'intégration pour agent IA

Copier-coller ce prompt pour intégrer Bictorys dans un nouveau projet :

```
Intègre Bictorys dans ce projet en suivant strictement le fichier bictorys-api-integration.md.

Stack actuel : [Next.js 15 App Router / Express / etc.] + [Supabase / Prisma / etc.]

Objectifs :
1. Paiements entrants via Direct API (charges)
2. Webhooks de confirmation — validation HMAC et X-Secret-Key
3. Vérification de statut en fallback (cron ou polling)
4. Payouts si le projet a des reversements marchand

Contraintes absolues :
- Toutes les requêtes Bictorys passent par le backend
- Clés dans les variables d'environnement uniquement
- Le webhook valide signature avant tout traitement
- Le webhook retourne toujours HTTP 200
- Vérifier amount + currency avant de valider une commande
- Payouts : utiliser BICTORYS_PRIVATE_KEY + idempotency-key
- Ne jamais faire confiance au montant envoyé par le frontend
- Utiliser createAdminClient() pour les inserts dans la table payouts (RLS)
- Appel Bictorys payout inline dans la route (pas de cron)

Pièges à éviter (lire la section 11 du fichier) :
- paymentReference (courte) ≠ merchantReference (UUID interne)
- provider_payment_id peut être un placeholder → double lookup dans le webhook
- Double commission si le solde envoyé est déjà net
- Redirection 307 sur l'URL webhook
- Clé publique pour les payouts (retourne 401)

Processus :
1. Inspecter la structure du projet
2. Créer le module lib/payments/bictorys.ts avec les fonctions : createBictorysCharge, getBictorysCharge, createBictorysPayout, verifyBictorysWebhook, normalizePhoneForBictorys, detectCountryFromPhone
3. Créer la route POST /api/payments/bictorys/create
4. Créer la route POST /api/webhooks/bictorys
5. Créer la route POST /api/payouts/request (si applicable)
6. Créer le cron GET /api/cron/verify-pending-payments
7. Mettre à jour .env.local et .env.example
8. Documenter les URLs webhook à configurer dans le dashboard Bictorys
```
