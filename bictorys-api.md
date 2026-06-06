# Guide d'intégration Bictorys — Sheka

> Ce document explique comment intégrer l'API Bictorys de A à Z.
> Il couvre le paiement (Direct Charge), les webhooks et l'API de reversement (Payout).
> Un développeur peut implémenter une intégration complète en lisant uniquement ce fichier.

---

## Sommaire

1. [Présentation de Bictorys](#1-présentation-de-bictorys)
2. [Authentification](#2-authentification)
3. [API de paiement — Créer un charge](#3-api-de-paiement--créer-un-charge)
4. [Types de paiement supportés](#4-types-de-paiement-supportés)
5. [Réponse et URL de paiement](#5-réponse-et-url-de-paiement)
6. [Webhooks — Confirmation de paiement](#6-webhooks--confirmation-de-paiement)
7. [Idempotence et gestion des doublons](#7-idempotence-et-gestion-des-doublons)
8. [API de reversement (Payout)](#8-api-de-reversement-payout)
9. [Stratégie multi-tenant dans Sheka](#9-stratégie-multi-tenant-dans-sheka)
10. [Exemples de code — implémentation Sheka](#10-exemples-de-code--implémentation-sheka)
11. [Erreurs fréquentes](#11-erreurs-fréquentes)
12. [Environnement et clés](#12-environnement-et-clés)

---

## 1. Présentation de Bictorys

Bictorys est un agrégateur de paiement mobile money africain. Il supporte :
- **Wave** (Sénégal, Côte d'Ivoire, Mali, etc.)
- **Orange Money** (Sénégal, Côte d'Ivoire, etc.)
- **Maxit** (Sénégal)

Le flow de paiement Bictorys est entièrement hébergé par Bictorys :
1. On crée un charge via l'API → Bictorys retourne une URL de checkout
2. L'utilisateur est redirigé vers cette URL et y complète le paiement
3. Bictorys envoie un webhook POST sur notre serveur pour confirmer le paiement

**Base URL :** `https://api.bictorys.com/pay/v1`

**Dashboard développeur :** `https://dashboard.bictorys.com`
- Developers → API Keys : générer/récupérer la `secret key`
- Developers → Webhooks : configurer l'URL du webhook et récupérer le `webhook secret`

---

## 2. Authentification

Toutes les requêtes API s'authentifient avec un header `X-Api-Key` :

```
X-Api-Key: secret-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Content-Type: application/json
```

Il n'y a pas de Bearer token JWT. La clé secrète est envoyée directement dans le header.

**Important :** La clé secrète ne doit jamais être exposée côté client. Elle est utilisée uniquement dans des Server Actions ou Route Handlers côté serveur.

---

## 3. API de paiement — Créer un charge

```
POST https://api.bictorys.com/pay/v1/charges
POST https://api.bictorys.com/pay/v1/charges?payment_type=wave_money
```

### Corps de la requête

```json
{
  "amount": 7500,
  "currency": "XOF",
  "paymentReference": "sheka-a1b2c3d4",
  "merchantReference": "booking-uuid-here",
  "successRedirectUrl": "https://sheka.store/mon-salon/book/success?booking_id=xxx",
  "errorRedirectUrl": "https://sheka.store/mon-salon/book/service-id/pay?cancelled=1&booking_id=xxx",
  "webhookUrl": "https://sheka.store/api/webhooks/bictorys",
  "orderDetails": [
    {
      "name": "Tresses box braids",
      "price": 7500,
      "quantity": 1,
      "taxRate": 0
    }
  ],
  "customerObject": {
    "name": "Aminata Diallo",
    "phone": "+221771234567",
    "locale": "fr-FR"
  }
}
```

### Description des champs

| Champ | Type | Requis | Description |
|---|---|---|---|
| `amount` | integer | ✓ | Montant en FCFA (entier, sans décimales) |
| `currency` | string | ✓ | Toujours `"XOF"` pour les pays francophones |
| `paymentReference` | string | ✓ | Référence affichée à l'utilisateur (ex: `sheka-a1b2c3d4`) |
| `merchantReference` | string | ✗ | Votre identifiant interne — **renvoyé dans le webhook**. Utiliser le `bookingId` |
| `successRedirectUrl` | string | ✓ | URL de redirection après paiement réussi |
| `errorRedirectUrl` | string | ✓ | URL de redirection après échec ou annulation |
| `webhookUrl` | string | ✗ | URL POST pour la notification de paiement confirmé |
| `orderDetails` | array | ✗ | Détail des articles (affiché sur la page de paiement Bictorys) |
| `customerObject.name` | string | ✗ | Nom du payeur |
| `customerObject.phone` | string | ✗ | Téléphone du payeur (format international) |
| `customerObject.locale` | string | ✗ | Langue (`"fr-FR"`) |

---

## 4. Types de paiement supportés

Le paramètre `payment_type` dans l'URL permet de pré-sélectionner le moyen de paiement :

| Valeur | Méthode |
|---|---|
| `wave_money` | Wave |
| `orange_money` | Orange Money |
| `maxit` | Maxit |

Si `payment_type` est omis, Bictorys affiche une page de choix avec toutes les méthodes disponibles.

```
# Avec pré-sélection Wave :
POST /pay/v1/charges?payment_type=wave_money

# Sans pré-sélection (choix affiché à l'utilisateur) :
POST /pay/v1/charges
```

---

## 5. Réponse et URL de paiement

En cas de succès (HTTP 200 ou 201), Bictorys retourne un JSON avec l'URL de paiement.
**Le champ exact varie selon la version de l'API.** Vérifier dans cet ordre :

```typescript
const checkoutUrl = json.link ?? json.url ?? json.confirmationLink
const transactionId = json.id ?? json.transactionId
```

Exemple de réponse :
```json
{
  "id": "txn_xxxxxxxx",
  "link": "https://checkout.bictorys.com/pay/xxxxxxxx",
  "status": "pending"
}
```

**Après récupération de l'URL :**
1. Stocker le `transactionId` dans la table `payments` (`provider_payment_id`)
2. Rediriger l'utilisateur vers `checkoutUrl`

**Ne pas considérer le paiement comme confirmé au retour sur `successRedirectUrl`.** La redirection se produit que le paiement ait réussi ou non. La source de vérité est le webhook.

---

## 6. Webhooks — Confirmation de paiement

Bictorys envoie un `POST` sur l'URL configurée (`webhookUrl` dans le charge, et/ou configuré dans le dashboard Bictorys).

### Validation du webhook

Bictorys envoie le header :
```
X-Secret-Key: votre-webhook-secret
```

La validation est une **comparaison simple de chaînes**, pas un HMAC :
```typescript
function verifyBictorysSignature(headerSecret: string, envSecret: string): boolean {
  return headerSecret === envSecret
}
```

### Corps du webhook

```json
{
  "id": "txn_xxxxxxxx",
  "status": "succeed",
  "amount": 7500,
  "currency": "XOF",
  "merchantReference": "booking-uuid-here"
}
```

| Champ | Description |
|---|---|
| `id` | ID de transaction Bictorys |
| `status` | `"succeed"` \| `"failed"` \| `"pending"` |
| `amount` | Montant en FCFA |
| `merchantReference` | Votre identifiant interne (le `bookingId` que vous avez passé) |

### Traitement recommandé

```
1. Parser le body JSON
2. Extraire merchantReference (= bookingId)
3. Charger la réservation → récupérer le salon → récupérer le webhook secret du salon
4. Valider X-Secret-Key (comparaison de chaînes)
5. Vérifier idempotence : si payment.status déjà 'completed' → return 200
6. Si status ≠ 'succeed' → marquer payment comme 'failed' → return 200
7. Si status = 'succeed' :
   - UPDATE payments SET status='completed', paid_at=now, provider_payment_id=id
   - UPDATE bookings SET status='confirmed', deposit_paid=true
   - Envoyer notifications WhatsApp
   - return 200
```

**Toujours retourner HTTP 200**, même en cas d'erreur de traitement interne, pour éviter que Bictorys retente indéfiniment.

---

## 7. Idempotence et gestion des doublons

Bictorys peut envoyer le même webhook plusieurs fois. Il faut gérer l'idempotence :

```typescript
// Vérifier si déjà traité avant de faire quoi que ce soit
const { data: existingPayment } = await supabase
  .from('payments')
  .select('id, status')
  .eq('booking_id', bookingId)
  .maybeSingle()

if (existingPayment?.status === 'completed') {
  return NextResponse.json({ ok: true, skipped: true }) // return 200
}
```

**Pourquoi matcher par `booking_id` et non `provider_payment_id` ?**
La route de création stocke d'abord un `provider_payment_id` de substitution (`bictorys-{bookingId}`) avant même de connaître l'ID réel Bictorys. Le webhook retourne le vrai ID. Matcher par `booking_id` est plus fiable.

---

## 8. API de reversement (Payout)

L'API de reversement permet d'envoyer de l'argent vers un numéro Wave ou Orange Money. Elle est utilisée pour reverser les fonds aux salons.

### Endpoint

```
POST https://api.bictorys.com/pay/v1/payouts?payment_type=wave_money
POST https://api.bictorys.com/pay/v1/payouts?payment_type=orange_money
```

### Headers requis

```
Content-Type: application/json
X-Api-Key: votre-secret-key
idempotency-key: uuid-unique-par-reversement
```

**`idempotency-key` est critique.** Utiliser un UUID unique par opération de reversement (par exemple, l'ID du payout dans votre base). Si la même clé est renvoyée, Bictorys ne crée pas un second virement.

### Corps de la requête

```json
{
  "amount": 14550,
  "currency": "XOF",
  "country": "SN",
  "customerObject": {
    "name": "Chez Aïssatou",
    "phone": "+221771234567"
  },
  "paymentReason": "Reversement Sheka — semaine du 5 mai 2026",
  "merchantReference": "payout-uuid-here"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `amount` | integer | ✓ | Montant net à reverser en FCFA |
| `currency` | string | ✓ | `"XOF"` |
| `country` | string | ✓ | Code pays ISO : `"SN"` (Sénégal), `"CI"` (Côte d'Ivoire), etc. |
| `customerObject.name` | string | ✓ | Nom du bénéficiaire |
| `customerObject.phone` | string | ✓ | Numéro Wave ou OM du bénéficiaire (format international) |
| `paymentReason` | string | ✗ | Libellé du virement (visible sur le relevé du bénéficiaire) |
| `merchantReference` | string | ✗ | Votre identifiant interne pour la traçabilité |

### Réponse

- **HTTP 201** → succès. Le JSON retourné contient `id` ou `transactionId`.
- **HTTP 400/401/403/500** → erreur. Lire le body pour le message d'erreur.

```typescript
if (res.status === 201) {
  const json = await res.json()
  const transactionId = json.id ?? json.transactionId
  return { success: true, transactionId }
}
const text = await res.text()
return { success: false, error: `Bictorys payout error ${res.status}: ${text}` }
```

### Précautions

1. **Ne jamais déclencher un payout sans `idempotency-key`** — risque de double virement
2. **Vérifier le solde disponible** sur le compte Bictorys avant d'initier un payout
3. **Stocker le `transactionId`** retourné dans la colonne `bictorys_transfer_id` de la table `payouts`
4. **Tester en sandbox** avant de passer en production (vérifier que les permissions payout sont activées sur le compte)

---

## 9. Stratégie multi-tenant dans Sheka

Sheka gère deux types de comptes Bictorys selon le plan du salon :

### Plan Starter / Trial — Clé plateforme Sheka

```
Salon Starter → Paiement → Compte Bictorys Sheka
                           Commission 3 % prélevée au reversement
                           Reversement manuel par l'admin Sheka
```

La clé API utilisée est `process.env.BICTORYS_SECRET_KEY`.

### Plan Pro / Multi — Clé propre du salon

```
Salon Pro → Paiement → Compte Bictorys du salon (directement)
                       Commission 0 %
                       Pas de reversement Sheka
```

La clé API utilisée est `salon.bictorys_secret_key` (configurée dans Paramètres).

### Webhook multi-tenant

Un seul endpoint webhook (`/api/webhooks/bictorys`) reçoit les events pour tous les salons.
La validation du secret se fait en deux étapes :

```typescript
// 1. Charger le secret du salon via la réservation
const salonWebhookSecret = booking.salon.bictorys_webhook_secret ?? null

// 2. Valider avec le secret du salon en priorité, sinon le secret Sheka
const expectedSecret = salonWebhookSecret ?? process.env.BICTORYS_WEBHOOK_SECRET
if (expectedSecret && !verifyBictorysSignature(headerSecret, expectedSecret)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

**Problème du chicken-and-egg :** Pour valider le webhook, il faut connaître le salon.
Pour connaître le salon, il faut parser le body. Solution : parser d'abord (lenient),
extraire `merchantReference`, charger le salon, puis valider.

---

## 10. Exemples de code — implémentation Sheka

### Créer un charge (src/lib/payments/bictorys.ts)

```typescript
export async function createBictorysCharge(
  apiKey: string,
  payload: BictorysChargePayload,
  paymentType?: 'wave_money' | 'orange_money' | 'maxit',
): Promise<{ checkoutUrl: string; transactionId: string }> {
  const url = paymentType
    ? `${BICTORYS_BASE_URL}/charges?payment_type=${paymentType}`
    : `${BICTORYS_BASE_URL}/charges`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bictorys error ${res.status}: ${text}`)
  }

  const json = await res.json() as Record<string, unknown>
  const checkoutUrl = (json.link ?? json.url ?? json.confirmationLink) as string | undefined
  const transactionId = (json.id ?? json.transactionId) as string | undefined

  if (!checkoutUrl) {
    throw new Error(`Bictorys: pas d'URL dans la réponse: ${JSON.stringify(json)}`)
  }

  return { checkoutUrl, transactionId: transactionId ?? '' }
}
```

### Routage selon le plan (src/app/api/payments/bictorys/create/route.ts)

```typescript
// Récupérer la clé selon le plan
const { data: salonData } = await supabase
  .from('salons')
  .select('bictorys_secret_key, plan')
  .eq('id', booking.salon_id)
  .single()

const salonKey = salonData?.bictorys_secret_key ?? null
const useOwnKey = !!salonKey && ['pro', 'multi'].includes(salonData?.plan ?? '')
const apiKey = useOwnKey ? salonKey : process.env.BICTORYS_SECRET_KEY
```

### Webhook handler (src/app/api/webhooks/bictorys/route.ts)

```typescript
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const headerSecret = req.headers.get('x-secret-key') ?? ''

  // Parse lenient pour extraire le bookingId
  let payload: BictorysWebhookPayload
  try {
    payload = JSON.parse(rawBody) as BictorysWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const bookingId = payload.merchantReference
  if (!bookingId) return NextResponse.json({ error: 'merchantReference manquant' }, { status: 400 })

  // Charger le secret webhook du salon
  const { data: bookingLookup } = await supabase
    .from('bookings')
    .select('salon_id, salons(bictorys_webhook_secret)')
    .eq('id', bookingId)
    .single()

  const salonWebhookSecret = bookingLookup?.salons?.bictorys_webhook_secret ?? null
  const expectedSecret = salonWebhookSecret ?? process.env.BICTORYS_WEBHOOK_SECRET ?? ''

  if (expectedSecret && !verifyBictorysSignature(headerSecret, expectedSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Idempotence
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (existingPayment?.status === 'completed') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Traitement
  if (payload.status !== 'succeed') {
    await supabase.from('payments').update({ status: 'failed' }).eq('booking_id', bookingId)
    return NextResponse.json({ ok: true })
  }

  await supabase.from('payments')
    .update({ status: 'completed', paid_at: new Date().toISOString(), provider_payment_id: payload.id })
    .eq('booking_id', bookingId)

  await supabase.from('bookings')
    .update({ status: 'confirmed', deposit_paid: true })
    .eq('id', bookingId)
    .eq('status', 'pending')

  // ... notifications WhatsApp

  return NextResponse.json({ ok: true })
}
```

### Créer un payout (src/lib/payments/bictorys.ts)

```typescript
export async function createBictorysPayout(
  apiKey: string,
  payload: BictorysPayoutPayload,
  paymentType: 'wave_money' | 'orange_money',
  idempotencyKey: string,  // utiliser l'UUID du payout en base
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const url = `${BICTORYS_BASE_URL}/payouts?payment_type=${paymentType}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 201) {
      const json = await res.json() as Record<string, unknown>
      return { success: true, transactionId: (json.id ?? json.transactionId) as string }
    }

    const text = await res.text()
    return { success: false, error: `Bictorys payout error ${res.status}: ${text}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
```

---

## 11. Erreurs fréquentes

| Erreur | Cause probable | Solution |
|---|---|---|
| `401 Unauthorized` | Mauvaise clé API | Vérifier `X-Api-Key` dans le header |
| `400 Bad Request` | Champ manquant ou invalide | Vérifier le body JSON (amount > 0, currency = XOF) |
| `Bictorys: pas d'URL dans la réponse` | Format de réponse inattendu | Logger le JSON brut, adapter les champs (`link`/`url`/`confirmationLink`) |
| Webhook reçu mais non traité | `merchantReference` absent | S'assurer que le payload de charge inclut `merchantReference` |
| Double virement payout | `idempotency-key` identique ou absent | Toujours passer l'UUID du payout comme `idempotency-key` |
| Webhook non reçu | URL webhook incorrecte | Vérifier `webhookUrl` dans le charge ET la config dans le dashboard Bictorys |

---

## 12. Environnement et clés

### Variables d'environnement

```env
# Compte Bictorys plateforme Sheka (pour les salons Starter/Trial)
BICTORYS_SECRET_KEY=secret-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
BICTORYS_WEBHOOK_SECRET=votre-webhook-secret
BICTORYS_API_URL=https://api.bictorys.com/pay/v1   # optionnel, valeur par défaut
```

### Où trouver les clés

1. Se connecter sur [dashboard.bictorys.com](https://dashboard.bictorys.com)
2. **Developers → API Keys** : copier la Secret Key
3. **Developers → Webhooks** : configurer l'URL (`https://sheka.store/api/webhooks/bictorys`) et copier le Webhook Secret

### Clés par salon (Pro/Multi)

Les salons Pro/Multi configurent leurs propres clés dans **Paramètres du salon → Votre compte Bictorys** :
- `bictorys_secret_key` : stocké en clair en base (chiffrement recommandé pour la v2)
- `bictorys_webhook_secret` : stocké en clair en base

La même URL de webhook (`/api/webhooks/bictorys`) est utilisée pour tous les salons — le routage est géré côté applicatif via la validation du secret.
