# Bictorys Integration Guide pour agents IA de code

> Objectif : intégrer proprement Bictorys dans un SaaS ou une application web : paiements entrants via Direct API, webhooks de confirmation, vérification de statut et payouts vers les utilisateurs lorsque nécessaire.
>
> Ce fichier doit être donné tel quel à un agent IA de code comme Claude Code, Codex, Antigravity, Cursor ou à un développeur.

---

## 1. Résultat attendu de l'intégration

L'intégration doit permettre de :

1. Créer une transaction de paiement Bictorys depuis le backend de l'application.
2. Rediriger l'utilisateur ou lui afficher les instructions adaptées selon le moyen de paiement choisi.
3. Recevoir les webhooks Bictorys et mettre à jour l'état métier de la commande, facture, abonnement, réservation ou wallet interne.
4. Vérifier le statut d'une transaction en fallback, notamment si le webhook tarde ou n'arrive pas.
5. Initier un payout vers un utilisateur ou prestataire, uniquement depuis le backend, avec protection contre les doublons.
6. Journaliser tous les événements critiques pour audit, support client, réconciliation comptable et debugging.

Ne jamais intégrer Bictorys directement depuis le frontend avec les vraies clés API. Toutes les requêtes Bictorys doivent passer par le backend.

---

## 2. Concepts Bictorys importants

### 2.1 Paiements entrants / Charges

Une charge est une demande de paiement créée par l'application. L'utilisateur paie via Wave, Orange Money, MTN, Moov, Togocell, Mobicash, Maxit ou carte selon les pays et moyens activés sur le compte Bictorys.

Endpoint principal :

```http
POST {BICTORYS_API_URL}/pay/v1/charges?payment_type={payment_type}
```

Pour carte bancaire, utiliser :

```http
POST {BICTORYS_API_URL}/pay/v1/charges?payment_type=card&payment_category=card
```

### 2.2 Direct API

Le Direct API donne plus de contrôle sur l'expérience de paiement. Il est recommandé surtout pour les applications mobiles, les expériences personnalisées, les TPE, les top-ups ou les workflows où on veut gérer soi-même l'UX.

Pour les paiements par carte bancaire via Direct API, attention : une certification PCI DSS peut être requise si l'application manipule directement les données de carte. Pour éviter ce risque, préférer une redirection vers la page de paiement/checkout Bictorys pour la carte.

### 2.3 Webhooks

Les webhooks sont la source de vérité côté backend. Quand Bictorys connaît le statut final d'une transaction, il appelle une URL de l'application, par exemple :

```http
POST https://api.votre-app.com/webhooks/bictorys
```

Le backend doit vérifier l'authenticité du webhook, journaliser le payload, valider que le montant correspond à la commande/facture interne, puis mettre à jour l'état métier.

### 2.4 Payouts

Un payout permet d'envoyer de l'argent vers un compte Mobile Money. C'est utile pour payer des vendeurs, prestataires, créateurs, chauffeurs, livreurs, affiliés, propriétaires, partenaires, etc.

Endpoint principal :

```http
POST {BICTORYS_API_URL}/pay/v1/payouts?payment_type={payment_type}
```

Les payouts doivent toujours être déclenchés depuis le backend avec la clé privée et un header `idempotency-key` unique.

---

## 3. Variables d'environnement obligatoires

Créer ces variables dans `.env`, dans l'hébergeur backend et dans le gestionnaire de secrets du projet.

```env
# Sandbox
BICTORYS_API_URL=https://api.test.bictorys.com
BICTORYS_API_KEY=test_public-XXXX.YYYY
BICTORYS_PRIVATE_KEY=test_secret-XXXX.YYYY
BICTORYS_WEBHOOK_SECRET=votre_secret_webhook_test
BICTORYS_MERCHANT_SECRET_CODE=1234

# Production
# BICTORYS_API_URL=https://api.bictorys.com
# BICTORYS_API_KEY=public-XXXX.YYYY
# BICTORYS_PRIVATE_KEY=secret-XXXX.YYYY
# BICTORYS_WEBHOOK_SECRET=votre_secret_webhook_prod
# BICTORYS_MERCHANT_SECRET_CODE=1234
```

### 3.1 Rôle des clés

| Variable | Usage | Où l'utiliser |
|---|---|---|
| `BICTORYS_API_URL` | URL de base de l'API | Backend uniquement |
| `BICTORYS_API_KEY` | Clé publique Bictorys | Créer une charge, vérifier un statut |
| `BICTORYS_PRIVATE_KEY` | Clé privée Bictorys | Payouts, lecture des moyens de paiement activés |
| `BICTORYS_WEBHOOK_SECRET` | Secret des webhooks | Validation des webhooks entrants |
| `BICTORYS_MERCHANT_SECRET_CODE` | Code secret marchand | Requis dans le body des payouts |

Important :

- Ne jamais exposer `BICTORYS_PRIVATE_KEY` au frontend.
- Ne jamais exposer `BICTORYS_MERCHANT_SECRET_CODE` au frontend.
- Ne pas confondre `BICTORYS_PRIVATE_KEY` et `BICTORYS_WEBHOOK_SECRET`.
- Pour les charges, utiliser `BICTORYS_API_KEY`.
- Pour les payouts, utiliser impérativement `BICTORYS_PRIVATE_KEY`.

---

## 4. Modèle de données recommandé

Adapter à l'ORM utilisé : Prisma, Drizzle, Sequelize, Laravel Eloquent, Django ORM, Supabase, etc.

### 4.1 Table `payments`

Créer une table pour suivre les paiements internes.

Champs recommandés :

```ts
type PaymentStatus =
  | "created"
  | "pending"
  | "processing"
  | "succeeded"
  | "authorized"
  | "failed"
  | "cancelled"
  | "reversed";
```

```sql
payments
- id uuid primary key
- user_id uuid nullable
- order_id uuid nullable
- invoice_id uuid nullable
- subscription_id uuid nullable
- payment_reference varchar unique not null
- bictorys_transaction_id varchar unique nullable
- amount integer not null
- currency varchar not null default 'XOF'
- country varchar not null
- payment_type varchar not null
- customer_name varchar nullable
- customer_phone varchar nullable
- customer_email varchar nullable
- status varchar not null default 'created'
- redirect_url text nullable
- payment_link text nullable
- qr_code text nullable
- ussd_message text nullable
- raw_create_response jsonb nullable
- raw_status_response jsonb nullable
- paid_at timestamp nullable
- failed_at timestamp nullable
- created_at timestamp not null
- updated_at timestamp not null
```

### 4.2 Table `payment_webhook_events`

Créer une table séparée pour journaliser les webhooks. C'est indispensable pour l'audit, l'idempotence et le debug.

```sql
payment_webhook_events
- id uuid primary key
- provider varchar not null default 'bictorys'
- bictorys_event_id varchar nullable
- bictorys_transaction_id varchar nullable
- payment_reference varchar nullable
- status varchar nullable
- signature_valid boolean not null default false
- headers jsonb nullable
- raw_body text not null
- parsed_payload jsonb nullable
- processing_status varchar not null default 'received'
- processing_error text nullable
- received_at timestamp not null
- processed_at timestamp nullable
```

Ajouter au minimum un index unique pour éviter de traiter deux fois le même événement ou la même transition :

```sql
create unique index if not exists idx_bictorys_webhook_transaction_status
on payment_webhook_events(provider, bictorys_transaction_id, status)
where bictorys_transaction_id is not null and status is not null;
```

### 4.3 Table `payouts`

Créer une table de suivi des payouts.

```sql
payouts
- id uuid primary key
- user_id uuid nullable
- wallet_id uuid nullable
- merchant_reference varchar unique not null
- idempotency_key uuid unique not null
- bictorys_payout_id varchar unique nullable
- amount integer not null
- currency varchar not null default 'XOF'
- country varchar not null
- payment_type varchar not null
- recipient_name varchar not null
- recipient_phone varchar not null
- recipient_email varchar nullable
- status varchar not null default 'created'
- payment_reason text nullable
- merchant_fee integer nullable
- customer_fee integer nullable
- raw_create_response jsonb nullable
- raw_error_response text nullable
- created_at timestamp not null
- updated_at timestamp not null
```

---

## 5. Codes pays et normalisation téléphone

### 5.1 Codes pays Bictorys

| Pays | Code Bictorys | Indicatif |
|---|---:|---:|
| Sénégal | `SN` | `+221` |
| Côte d'Ivoire | `CI` | `+225` |
| Burkina Faso | `BK` ou parfois `BF` selon endpoints/tests | `+226` |
| Mali | `ML` | `+223` |
| Togo | `TG` | `+228` |
| Bénin | `BJ` | `+229` |

Note importante : la documentation principale mentionne `BK` pour le Burkina Faso dans les charges, tandis que certains exemples et sections utilisent aussi `BF`. L'agent IA doit centraliser cette logique dans une fonction `normalizeBictorysCountryCode()` et vérifier en sandbox/production avec les moyens de paiement réellement activés sur le compte marchand.

### 5.2 Format téléphone obligatoire

Toujours stocker et envoyer les numéros au format international E.164 simplifié :

```txt
+221771234567
+2250701234567
+22376123456
+22890123456
+22997123456
+22670123456
```

Ne pas envoyer :

```txt
221771234567      # manque le +
771234567         # pas d'indicatif pays
+221 77 123 45 67 # espaces interdits
```

Créer une fonction utilitaire :

```ts
export function normalizePhoneForBictorys(rawPhone: string, defaultCountry?: string): string {
  const cleaned = rawPhone.replace(/[\s().-]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;

  // Optionnel : appliquer le pays par défaut si le numéro local est donné.
  if (defaultCountry === "SN" && cleaned.length === 9) return `+221${cleaned}`;
  if (defaultCountry === "CI" && cleaned.length >= 8) return `+225${cleaned}`;
  if (defaultCountry === "ML" && cleaned.length >= 8) return `+223${cleaned}`;
  if (defaultCountry === "TG" && cleaned.length >= 8) return `+228${cleaned}`;
  if (defaultCountry === "BJ" && cleaned.length >= 8) return `+229${cleaned}`;
  if ((defaultCountry === "BF" || defaultCountry === "BK") && cleaned.length >= 8) return `+226${cleaned}`;

  throw new Error("Invalid phone format for Bictorys. Expected international format like +221771234567");
}
```

Détection pays :

```ts
export function detectCountryFromPhone(phone: string): "SN" | "CI" | "BK" | "ML" | "TG" | "BJ" | null {
  const normalized = phone.startsWith("+") ? phone : `+${phone}`;
  if (normalized.startsWith("+221")) return "SN";
  if (normalized.startsWith("+225")) return "CI";
  if (normalized.startsWith("+226")) return "BK";
  if (normalized.startsWith("+223")) return "ML";
  if (normalized.startsWith("+228")) return "TG";
  if (normalized.startsWith("+229")) return "BJ";
  return null;
}
```

---

## 6. Moyens de paiement

### 6.1 `payment_type` supportés

| `payment_type` | Moyen de paiement |
|---|---|
| `wave_money` | Wave |
| `orange_money` | Orange Money |
| `mtn_money` | MTN Money |
| `moov` | Moov Money |
| `togocell` | Togocell |
| `mobicash` | Mobicash |
| `maxit` | Maxit Sénégal |
| `card` | Carte bancaire |

### 6.2 Lire les opérateurs activés sur le compte

Avant d'afficher les moyens de paiement à l'utilisateur, idéalement récupérer les moyens activés côté Bictorys ou maintenir une configuration interne par pays.

```http
GET {BICTORYS_API_URL}/onboarding/v1/payment-methods/me
X-API-Key: {BICTORYS_PRIVATE_KEY}
```

Le résultat doit être mis en cache côté backend, par exemple 15 minutes à 1 heure, afin d'éviter des appels inutiles à chaque paiement.

### 6.3 Recommandation UX par pays

Pour les SaaS et apps web en Afrique francophone, l'UX recommandée est :

1. Demander le pays de paiement ou le déduire du téléphone.
2. Afficher seulement les opérateurs disponibles dans ce pays.
3. Demander le numéro de téléphone si l'opérateur/pays l'exige.
4. Pour Wave mobile : rediriger vers le `link` retourné par Bictorys.
5. Pour Wave desktop : afficher le `qrCode` retourné par Bictorys, si présent.
6. Pour Orange Money CI/BF : prévoir une étape OTP avant de créer la charge.
7. Pour carte : rediriger vers la page/URL retournée, ne pas manipuler les données de carte si l'app n'est pas certifiée PCI DSS.

---

## 7. Créer un paiement Direct API

### 7.1 Endpoint

```http
POST {BICTORYS_API_URL}/pay/v1/charges?payment_type={payment_type}
```

Headers :

```http
X-Api-Key: {BICTORYS_API_KEY}
Content-Type: application/json
```

### 7.2 Body attendu

```json
{
  "amount": 5000,
  "currency": "XOF",
  "country": "SN",
  "paymentReference": "ORDER-ABC123",
  "successRedirectUrl": "https://votre-app.com/payment/success?ref=ORDER-ABC123",
  "ErrorRedirectUrl": "https://votre-app.com/payment/error?ref=ORDER-ABC123",
  "customerObject": {
    "name": "Amadou Fall",
    "phone": "+221771234567",
    "email": "amadou@example.com",
    "country": "SN"
  },
  "otp": "123456"
}
```

Important :

- `amount` est un entier en FCFA, sans décimales.
- `currency` doit être `XOF`.
- `paymentReference` doit être unique côté application.
- `ErrorRedirectUrl` peut être sensible à la casse selon la documentation. Utiliser `ErrorRedirectUrl` avec `E` majuscule pour suivre la doc principale.
- `otp` ne doit être envoyé que pour les flows Orange Money qui l'exigent.

### 7.3 Réponse possible

```json
{
  "transactionId": "33e1c83b-7cb0-437b-bc50-a7a58e5660ad",
  "redirectUrl": "https://pay.bictorys.com/checkout/33e1c83b-...",
  "link": "https://pay.bictorys.com/link/...",
  "qrCode": "data:image/png;base64,...",
  "message": "Composez *144*82# pour valider..."
}
```

Traitement recommandé :

- Sauvegarder `transactionId` dans `payments.bictorys_transaction_id`.
- Sauvegarder toute la réponse brute dans `raw_create_response`.
- Si `link` existe, l'utiliser prioritairement pour redirection mobile.
- Si `qrCode` existe, l'afficher dans un modal desktop.
- Si `message` existe, afficher clairement les instructions à l'utilisateur.
- Ne jamais marquer le paiement comme payé à la création de la charge. Attendre le webhook ou le statut final.

### 7.4 Implémentation TypeScript recommandée

```ts
// lib/bictorys.ts

import crypto from "crypto";

const API_URL = process.env.BICTORYS_API_URL!;
const API_KEY = process.env.BICTORYS_API_KEY!;
const PRIVATE_KEY = process.env.BICTORYS_PRIVATE_KEY!;
const WEBHOOK_SECRET = process.env.BICTORYS_WEBHOOK_SECRET!;
const MERCHANT_SECRET_CODE = process.env.BICTORYS_MERCHANT_SECRET_CODE!;

export type BictorysCountry = "SN" | "CI" | "BK" | "ML" | "TG" | "BJ";

export type BictorysPaymentType =
  | "wave_money"
  | "orange_money"
  | "mtn_money"
  | "moov"
  | "togocell"
  | "mobicash"
  | "maxit"
  | "card";

export interface CreateBictorysChargeParams {
  amount: number;
  country: BictorysCountry;
  paymentType: BictorysPaymentType;
  paymentReference: string;
  successRedirectUrl: string;
  errorRedirectUrl: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    country?: BictorysCountry;
  };
  otp?: string;
}

export interface BictorysChargeResponse {
  transactionId: string;
  redirectUrl?: string;
  link?: string;
  qrCode?: string;
  message?: string;
  [key: string]: unknown;
}

async function parseBictorysResponse(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  return { raw: text };
}

export async function createBictorysCharge(
  params: CreateBictorysChargeParams
): Promise<BictorysChargeResponse> {
  if (!Number.isInteger(params.amount) || params.amount < 100) {
    throw new Error("Bictorys amount must be an integer >= 100 XOF");
  }

  const queryParams =
    params.paymentType === "card"
      ? "payment_type=card&payment_category=card"
      : `payment_type=${encodeURIComponent(params.paymentType)}`;

  const url = `${API_URL}/pay/v1/charges?${queryParams}`;

  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: "XOF",
    country: params.country,
    paymentReference: params.paymentReference,
    successRedirectUrl: params.successRedirectUrl,
    ErrorRedirectUrl: params.errorRedirectUrl,
    customerObject: params.customer,
  };

  if (params.otp) {
    body.otp = params.otp;
  }

  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const parsed = await parseBictorysResponse(response);

    if (response.ok) {
      return parsed as BictorysChargeResponse;
    }

    const raw = typeof parsed.raw === "string" ? parsed.raw : JSON.stringify(parsed);
    const isWafForbidden = response.status === 403 && raw.includes("Forbidden");

    if (isWafForbidden && attempt < maxRetries) {
      continue;
    }

    throw new Error(`Bictorys charge error (${response.status}): ${raw}`);
  }

  throw new Error("Bictorys charge failed after max retries");
}
```

---

## 8. Flow OTP Orange Money CI/BF

Certains flows Orange Money exigent un OTP généré par l'utilisateur.

UX recommandée :

1. L'utilisateur choisit Orange Money.
2. L'utilisateur saisit son numéro.
3. Si pays `CI` ou `BK/BF`, afficher une étape OTP.
4. Lui demander de composer `#144*82#` sur son téléphone Orange Money.
5. Il reçoit un code OTP.
6. Il saisit ce code dans l'application.
7. Le backend crée la charge Bictorys avec le champ `otp`.
8. L'application affiche le `message` retourné par Bictorys.
9. La commande passe en `pending` jusqu'au webhook final.

Fonction de détection :

```ts
export function bictorysNeedsOtp(paymentType: BictorysPaymentType, country: BictorysCountry): boolean {
  return paymentType === "orange_money" && (country === "CI" || country === "BK");
}
```

En cas d'OTP invalide ou expiré, ne pas renvoyer l'utilisateur au formulaire complet. Le renvoyer à l'étape OTP avec un message simple :

> Le code OTP semble invalide ou expiré. Compose à nouveau `#144*82#`, récupère un nouveau code, puis réessaie.

---

## 9. Statuts de transaction

Statuts à gérer :

| Statut Bictorys | Interprétation métier |
|---|---|
| `succeeded` | Paiement confirmé, commande/facture à valider |
| `authorized` | Paiement autorisé, traiter comme succès sauf logique de capture séparée |
| `pending` | Paiement en attente de validation client |
| `processing` | Paiement en cours de traitement |
| `failed` | Paiement échoué |
| `cancelled` | Paiement annulé par le client |
| `reversed` | Paiement remboursé ou annulé après succès |

Mapping interne recommandé :

```ts
export function mapBictorysStatusToInternalStatus(status: string) {
  switch (status) {
    case "succeeded":
    case "authorized":
      return "paid";
    case "pending":
    case "processing":
      return "pending";
    case "failed":
    case "cancelled":
    case "reversed":
      return "failed";
    default:
      return "unknown";
  }
}
```

---

## 10. Vérifier le statut d'une transaction

Utiliser le status check comme fallback, pas comme source principale si le backend reçoit bien les webhooks.

Endpoint selon la doc principale :

```http
GET {BICTORYS_API_URL}/pay/v1/transactions/{transactionId}/status
X-Api-Key: {BICTORYS_API_KEY}
```

Certaines sections de la doc/exemples mentionnent aussi :

```http
GET {BICTORYS_API_URL}/pay/v1/charges/{transactionId}
X-Api-Key: {BICTORYS_API_KEY}
```

Implémenter la première forme `/transactions/{transactionId}/status` en priorité, puis prévoir un fallback vers `/charges/{transactionId}` si nécessaire après test réel.

```ts
export async function getBictorysTransactionStatus(transactionId: string) {
  const primaryUrl = `${API_URL}/pay/v1/transactions/${transactionId}/status`;
  const fallbackUrl = `${API_URL}/pay/v1/charges/${transactionId}`;

  async function request(url: string) {
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-Api-Key": API_KEY },
    });
    const parsed = await parseBictorysResponse(response);
    return { response, parsed };
  }

  const primary = await request(primaryUrl);
  if (primary.response.ok) return primary.parsed;

  const fallback = await request(fallbackUrl);
  if (fallback.response.ok) return fallback.parsed;

  throw new Error(
    `Bictorys status check failed. Primary=${primary.response.status}, fallback=${fallback.response.status}`
  );
}
```

---

## 11. Webhooks Bictorys

### 11.1 Configuration dashboard

Dans le dashboard Bictorys :

1. Aller dans `Developers` → `Webhooks`.
2. Ajouter l'URL backend publique, par exemple :

```txt
https://api.votre-app.com/webhooks/bictorys
```

3. Définir le `Secret Key`.
4. Sauvegarder.
5. Répéter séparément pour sandbox et production.

Important : les webhooks test et production sont séparés. Une URL configurée en test ne fonctionnera pas automatiquement en production.

### 11.2 Headers envoyés par Bictorys

Bictorys peut envoyer :

```http
Content-Type: application/json
X-Secret-Key: <votre_webhook_secret>
X-Webhook-Signature: <hmac_sha256_hex>
X-Webhook-Timestamp: <unix_timestamp_ms>
```

Validation recommandée :

1. Si `X-Webhook-Signature` et `X-Webhook-Timestamp` sont présents, valider en HMAC-SHA256.
2. Sinon, fallback sur `X-Secret-Key`.
3. Toujours utiliser une comparaison timing-safe.
4. Ne jamais comparer les secrets avec `===`.

### 11.3 Payload webhook type

```json
{
  "id": "33e1c83b-7cb0-437b-bc50-a7a58e5660ad",
  "merchantId": "d2d2053b-638d-4133-957e-3caf63e6b79c",
  "type": "payment",
  "amount": 5000,
  "currency": "XOF",
  "paymentReference": "ORDER-ABC123",
  "customerId": "fbd2053b-...",
  "customerObject": {
    "id": "fbd2053b-...",
    "name": "Amadou Fall",
    "phone": 221771234567,
    "email": "amadou@example.com",
    "address": "",
    "city": "Dakar",
    "postalCode": 0,
    "country": "SN",
    "locale": "fr-FR",
    "createdAt": "2026-03-01T12:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z"
  },
  "pspName": "wave_money",
  "paymentMeans": "+221 *** ** 67",
  "paymentChannel": "Terminal",
  "merchantFees": 150,
  "customerFees": 0,
  "merchantReference": "ORDER-ABC123",
  "status": "succeeded",
  "timestamp": "2026-03-01T12:05:00Z"
}
```

### 11.4 Implémentation Express.js

Attention critique : pour vérifier une signature HMAC, il faut le body brut. Donc `express.raw()` doit être appliqué avant `express.json()` pour la route webhook.

```ts
// app.ts ou server.ts

import express from "express";
import crypto from "crypto";

const app = express();

// Route webhooks en raw AVANT le json parser global.
app.use("/webhooks/bictorys", express.raw({ type: "application/json" }));
app.use(express.json());

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) return false;
    return crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

function verifyBictorysHmacSignature(rawBody: string, secret: string, signature: string, timestamp: string): boolean {
  const ts = parseInt(timestamp, 10);

  // Protection anti-replay : rejeter les timestamps de plus de 5 minutes.
  if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return timingSafeCompare(signature, expected);
}

function verifyBictorysStaticSecret(secretKeyHeader: string, expectedSecret: string): boolean {
  return timingSafeCompare(secretKeyHeader, expectedSecret);
}

function verifyBictorysWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): boolean {
  const signature = headers["x-webhook-signature"];
  const timestamp = headers["x-webhook-timestamp"];
  const secretKey = headers["x-secret-key"];

  const sig = Array.isArray(signature) ? signature[0] : signature;
  const ts = Array.isArray(timestamp) ? timestamp[0] : timestamp;
  const key = Array.isArray(secretKey) ? secretKey[0] : secretKey;

  if (sig && ts) {
    return verifyBictorysHmacSignature(rawBody, WEBHOOK_SECRET, sig, ts);
  }

  if (key) {
    return verifyBictorysStaticSecret(key, WEBHOOK_SECRET);
  }

  return false;
}

app.post("/webhooks/bictorys", async (req, res) => {
  let rawBody = "";

  try {
    rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf-8") : String(req.body || "");
    const isValid = verifyBictorysWebhook(rawBody, req.headers);

    let payload: any = null;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }

    // 1. Toujours logger le webhook, même invalide.
    // await db.paymentWebhookEvent.create({ ... })

    if (!isValid) {
      // Ne pas révéler de détail à Bictorys.
      // Retourner 200 pour éviter les retries inutiles.
      return res.status(200).json({ received: true });
    }

    if (!payload) {
      return res.status(200).json({ received: true });
    }

    const transactionId = payload.id;
    const paymentReference = payload.paymentReference || payload.merchantReference;
    const amount = payload.amount;
    const currency = payload.currency;
    const status = payload.status;

    // 2. Traitement idempotent dans une transaction DB.
    // await db.$transaction(async (tx) => {
    //   const payment = await tx.payment.findUnique({ where: { payment_reference: paymentReference } });
    //   if (!payment) return;
    //
    //   // Anti-fraude : ne jamais valider si montant/devise ne correspondent pas.
    //   if (payment.amount !== amount || payment.currency !== currency) {
    //     await tx.paymentWebhookEvent.update({ ... processing_error: "amount_or_currency_mismatch" });
    //     return;
    //   }
    //
    //   // Idempotence : si déjà succeeded, ne pas recréditer / relivrer / réactiver en double.
    //   if (payment.status === "succeeded" && (status === "succeeded" || status === "authorized")) {
    //     return;
    //   }
    //
    //   // Mise à jour métier.
    //   if (status === "succeeded" || status === "authorized") {
    //     await tx.payment.update({ where: { id: payment.id }, data: { status: "succeeded", paid_at: new Date(), bictorys_transaction_id: transactionId } });
    //     // Exemples : valider commande, activer abonnement, créditer wallet, confirmer réservation, envoyer email/WhatsApp.
    //   } else if (["failed", "cancelled", "reversed"].includes(status)) {
    //     await tx.payment.update({ where: { id: payment.id }, data: { status, failed_at: new Date() } });
    //   } else {
    //     await tx.payment.update({ where: { id: payment.id }, data: { status } });
    //   }
    // });

    return res.status(200).json({ received: true });
  } catch (error) {
    // Logger l'erreur côté serveur.
    // Ne jamais répondre 500, sinon Bictorys peut réessayer plusieurs fois.
    return res.status(200).json({ received: true });
  }
});
```

### 11.5 Checklist webhook obligatoire

L'agent IA doit vérifier que :

- [ ] La route webhook est publique et accessible depuis Internet.
- [ ] Le body brut est disponible pour la validation HMAC.
- [ ] Le webhook est loggé avant traitement métier.
- [ ] La signature HMAC est vérifiée si présente.
- [ ] Le fallback `X-Secret-Key` est vérifié si HMAC absent.
- [ ] La comparaison utilise `crypto.timingSafeEqual()` ou équivalent.
- [ ] Le montant reçu correspond au montant interne.
- [ ] La devise reçue correspond à `XOF`.
- [ ] La référence `paymentReference` ou `merchantReference` existe en base.
- [ ] Le traitement est idempotent.
- [ ] Le webhook retourne toujours HTTP 200.
- [ ] Les transitions métier critiques sont dans une transaction DB.

---

## 12. Payouts

### 12.1 Endpoint

```http
POST {BICTORYS_API_URL}/pay/v1/payouts?payment_type={payment_type}
```

Headers :

```http
X-API-Key: {BICTORYS_PRIVATE_KEY}
Content-Type: application/json
accept: application/json
idempotency-key: {uuid_unique}
```

Important :

- Utiliser `BICTORYS_PRIVATE_KEY`, pas `BICTORYS_API_KEY`.
- Toujours fournir `idempotency-key`.
- Réutiliser la même `idempotency-key` en cas de retry du même payout.
- Ne jamais déclencher un payout depuis le frontend.
- Mettre un timeout long mais borné, par exemple 30 secondes.
- Logger la réponse brute, y compris en cas d'erreur ou de réponse HTML/non JSON.

### 12.2 Body payout

```json
{
  "amount": 10000,
  "currency": "XOF",
  "country": "SN",
  "customerObject": {
    "name": "Amadou Fall",
    "phone": "+221771234567",
    "email": "amadou@example.com",
    "country": "SN",
    "locale": "fr-FR"
  },
  "transactionType": "payment",
  "paymentReason": "Appel de fonds",
  "merchantReference": "WD-ABC123",
  "merchant": {
    "secretCode": "1234"
  }
}
```

### 12.3 Réponse payout possible

```json
{
  "id": "abc123-def456",
  "merchantId": "d2d2053b-...",
  "amount": -10000,
  "merchantFee": 150,
  "customerFee": 0,
  "currency": "XOF",
  "paymentReference": "...",
  "customerName": "Amadou Fall",
  "customerPhone": "221771234567",
  "customerCountry": "SN",
  "pspName": "wave_money",
  "merchantReference": "WD-ABC123",
  "status": 0,
  "createdAt": "2026-03-01T12:00:00Z"
}
```

Dans la documentation d'intégration, `status: 0` est présenté comme un succès pour le payout. L'agent IA doit tout de même stocker la réponse brute et prévoir un statut interne explicite.

### 12.4 Implémentation TypeScript payout

```ts
export interface CreateBictorysPayoutParams {
  amount: number;
  country: BictorysCountry;
  paymentType: Extract<BictorysPaymentType, "wave_money" | "orange_money" | "mtn_money" | "moov">;
  recipient: {
    name: string;
    phone: string;
    email?: string;
    country: BictorysCountry;
  };
  merchantReference: string;
  paymentReason: string;
  idempotencyKey: string;
}

export async function createBictorysPayout(params: CreateBictorysPayoutParams) {
  if (!Number.isInteger(params.amount) || params.amount < 100) {
    throw new Error("Bictorys payout amount must be an integer >= 100 XOF");
  }

  const url = `${API_URL}/pay/v1/payouts?payment_type=${encodeURIComponent(params.paymentType)}`;

  const body = {
    amount: params.amount,
    currency: "XOF",
    country: params.country,
    customerObject: {
      name: params.recipient.name,
      phone: normalizePhoneForBictorys(params.recipient.phone, params.recipient.country),
      email: params.recipient.email,
      country: params.recipient.country,
      locale: "fr-FR",
    },
    transactionType: "payment",
    paymentReason: params.paymentReason,
    merchantReference: params.merchantReference,
    merchant: {
      secretCode: MERCHANT_SECRET_CODE,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": PRIVATE_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
        "idempotency-key": params.idempotencyKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const parsed = await parseBictorysResponse(response);

    if (response.ok) {
      return {
        success: true,
        httpStatus: response.status,
        data: parsed,
      };
    }

    return {
      success: false,
      httpStatus: response.status,
      error: parsed,
    };
  } finally {
    clearTimeout(timeout);
  }
}
```

### 12.5 Workflow métier payout recommandé

Ne jamais faire :

```txt
Utilisateur demande retrait → appel Bictorys immédiat → mise à jour DB ensuite
```

Faire plutôt :

```txt
1. Créer une demande de payout interne avec statut `created`.
2. Générer et stocker `merchantReference` + `idempotencyKey`.
3. Vérifier que le solde interne de l'utilisateur est suffisant.
4. Réserver/débiter le montant dans une transaction DB interne.
5. Appeler Bictorys avec l'idempotency-key stockée.
6. Stocker la réponse brute.
7. Marquer le payout `succeeded`, `pending` ou `failed` selon la réponse.
8. En cas d'erreur réseau/time-out, marquer `unknown` ou `processing`, ne pas relancer avec une nouvelle idempotency-key.
9. Si retry nécessaire, réutiliser exactement la même idempotency-key.
```

### 12.6 Erreurs payout à gérer

| HTTP / contenu | Signification probable | Action |
|---|---|---|
| `401` | Mauvaise clé | Vérifier `BICTORYS_PRIVATE_KEY` |
| `403 Access right not sufficient` | Droits insuffisants ou mauvaise clé | Vérifier clé privée et compte marchand |
| `400 balance` | Solde Bictorys insuffisant | Bloquer payout, alerter admin |
| `400 plafon` / `limit` | Plafond Mobile Money destinataire atteint | Demander autre numéro ou réessayer plus tard |
| `400 phone` | Numéro invalide | Corriger format téléphone |
| `400 secretCode` | Code marchand incorrect | Vérifier `BICTORYS_MERCHANT_SECRET_CODE` |
| `500+` | Erreur serveur Bictorys | Retry prudent avec même idempotency-key |
| HTML `Forbidden` | WAF/rate limit | Backoff exponentiel |

---

## 13. Routes backend recommandées

### 13.1 Paiement

Créer une route interne :

```http
POST /api/payments/bictorys/create
```

Body frontend :

```json
{
  "orderId": "uuid",
  "paymentType": "wave_money",
  "country": "SN",
  "customerPhone": "+221771234567",
  "otp": "123456"
}
```

Traitement backend :

1. Authentifier l'utilisateur si nécessaire.
2. Charger la commande/facture/abonnement depuis la base.
3. Vérifier que le montant est calculé côté backend, jamais depuis le frontend.
4. Générer `paymentReference` unique, par exemple `ORDER-{orderId}-{timestamp}`.
5. Créer un enregistrement `payments` en statut `created`.
6. Appeler `createBictorysCharge()`.
7. Sauvegarder `transactionId`, `link`, `qrCode`, `message`, `redirectUrl` et réponse brute.
8. Retourner au frontend uniquement les champs nécessaires à l'UX.

Réponse backend :

```json
{
  "paymentId": "uuid",
  "paymentReference": "ORDER-ABC123",
  "transactionId": "33e1c83b-...",
  "status": "pending",
  "nextAction": {
    "type": "redirect",
    "url": "https://pay.bictorys.com/link/..."
  }
}
```

Types de `nextAction` recommandés :

```ts
type BictorysNextAction =
  | { type: "redirect"; url: string }
  | { type: "qr_code"; qrCode: string; message?: string }
  | { type: "instructions"; message: string }
  | { type: "none" };
```

### 13.2 Statut paiement

```http
GET /api/payments/:paymentId/status
```

La route doit :

1. Lire d'abord le statut interne en base.
2. Si statut final, retourner directement.
3. Si statut pending/processing depuis longtemps, appeler Bictorys en fallback.
4. Ne jamais laisser le frontend appeler Bictorys directement.

### 13.3 Webhook

```http
POST /webhooks/bictorys
```

Route publique, sans auth utilisateur, protégée par signature/secret.

### 13.4 Payout

```http
POST /api/payouts/bictorys/create
```

Cette route doit être protégée :

- Admin seulement, ou
- Utilisateur authentifié pouvant retirer uniquement son propre solde, ou
- Process interne backend/cron.

Ne jamais accepter directement `amount` depuis le frontend sans recalcul et vérification côté backend.

---

## 14. Sécurité et anti-fraude

L'agent IA doit impérativement implémenter ces règles :

### 14.1 Clés

- `BICTORYS_API_KEY`, `BICTORYS_PRIVATE_KEY`, `BICTORYS_WEBHOOK_SECRET`, `BICTORYS_MERCHANT_SECRET_CODE` doivent être dans les variables d'environnement.
- La clé privée ne doit jamais apparaître dans le code client, les logs frontend ou les réponses API.
- Masquer les clés dans les logs backend.

### 14.2 Montants

- Le montant à payer doit toujours être calculé côté backend depuis la commande/facture/abonnement.
- Le frontend ne doit pas pouvoir imposer le montant final.
- Au webhook, vérifier `amount` et `currency` avant d'activer un service ou livrer une commande.

### 14.3 Idempotence

- Une commande déjà payée ne doit jamais être livrée deux fois.
- Un abonnement déjà activé ne doit pas être réactivé deux fois avec double crédit.
- Un wallet ne doit pas être crédité deux fois pour le même webhook.
- Un payout ne doit jamais être relancé avec une nouvelle `idempotency-key` pour le même retrait.

### 14.4 Logs

Logger :

- Création de charge.
- Réponse Bictorys brute.
- Webhooks reçus.
- Résultat de validation webhook.
- Erreurs Bictorys.
- Création de payout.
- Réponse payout brute.

Ne pas logger :

- Clés API complètes.
- Code secret marchand complet.
- Données sensibles inutiles.

### 14.5 Réconciliation

Prévoir un écran admin ou une commande interne pour :

- Rechercher une transaction par `paymentReference`.
- Rechercher une transaction par `transactionId`.
- Voir le dernier webhook reçu.
- Relancer un status check.
- Marquer manuellement une transaction comme à vérifier, mais éviter les validations manuelles sans preuve.

---

## 15. Gestion des erreurs générales

| Erreur | Cause probable | Action technique | Message utilisateur |
|---|---|---|---|
| `400 wrong payment type` | Opérateur non activé ou mauvais pays | Vérifier `payment_type`, pays et moyens activés | Ce moyen de paiement n'est pas disponible pour ce pays. |
| `400 country not available` | Pays non activé | Contacter Bictorys ou masquer le moyen | Ce pays n'est pas encore disponible pour ce moyen de paiement. |
| `401` | Clé API invalide/manquante | Vérifier variables d'environnement | Paiement temporairement indisponible. |
| `403 Access right not sufficient` | Mauvaise clé ou droits insuffisants | Utiliser bonne clé publique/privée | Paiement temporairement indisponible. |
| HTML `403 Forbidden` | WAF/rate limit | Retry avec backoff exponentiel | Le paiement prend un peu plus de temps, réessaie. |
| `500` | Erreur Bictorys | Retry contrôlé ou support | Paiement temporairement indisponible. |
| Webhook non reçu | URL inaccessible, secret incorrect, mode test/prod confondu | Vérifier dashboard webhook | Ne pas afficher de détail technique. |
| OTP invalide | OTP expiré ou mal saisi | Redemander OTP | Code expiré ou invalide, génère un nouveau code. |

---

## 16. Checklist sandbox

Avant production :

- [ ] Créer les clés sandbox Bictorys.
- [ ] Configurer `.env` sandbox.
- [ ] Configurer le webhook sandbox.
- [ ] Vérifier que l'URL webhook est publique.
- [ ] Tester un paiement Wave Sénégal.
- [ ] Tester Orange Money Sénégal si activé.
- [ ] Tester Orange Money CI avec OTP si nécessaire.
- [ ] Tester un échec paiement.
- [ ] Tester un webhook valide.
- [ ] Tester un webhook avec mauvais secret.
- [ ] Tester double webhook pour vérifier l'idempotence.
- [ ] Tester status check fallback.
- [ ] Tester payout sandbox si le compte le permet.
- [ ] Vérifier les logs.
- [ ] Vérifier que les montants sont entiers en XOF.
- [ ] Vérifier que les numéros sont au format `+indicatif`.

---

## 17. Checklist production

Avant d'activer en production :

- [ ] Remplacer `BICTORYS_API_URL` par `https://api.bictorys.com`.
- [ ] Utiliser les clés production, sans préfixe `test_`.
- [ ] Configurer le webhook production dans le dashboard Bictorys.
- [ ] Utiliser un `BICTORYS_WEBHOOK_SECRET` production différent du sandbox.
- [ ] Vérifier que `BICTORYS_PRIVATE_KEY` n'est jamais exposée.
- [ ] Vérifier que `BICTORYS_MERCHANT_SECRET_CODE` est correct si payouts.
- [ ] Faire un micro-paiement réel, par exemple 500 FCFA.
- [ ] Vérifier que le webhook production est reçu.
- [ ] Vérifier que la commande/facture/abonnement passe au bon statut.
- [ ] Tester un paiement abandonné ou échoué.
- [ ] Tester la page succès.
- [ ] Tester la page erreur.
- [ ] Tester le fallback status check.
- [ ] Si payouts : faire un petit payout réel vers un compte contrôlé.
- [ ] Vérifier réconciliation comptable et frais.

---

## 18. Instructions précises pour l'agent IA de code

Quand tu intègres Bictorys dans un projet, procède ainsi :

1. Inspecte le stack du projet : framework, backend, ORM, base de données, système d'auth, structure des routes.
2. Crée un module isolé `bictorys` ou `payment-providers/bictorys`.
3. Ajoute les variables d'environnement nécessaires et mets à jour `.env.example`.
4. Crée ou adapte les tables `payments`, `payment_webhook_events` et `payouts`.
5. Implémente les fonctions :
   - `createBictorysCharge()`
   - `getBictorysTransactionStatus()`
   - `verifyBictorysWebhook()`
   - `handleBictorysWebhook()`
   - `createBictorysPayout()` si nécessaire
   - `normalizePhoneForBictorys()`
   - `detectCountryFromPhone()`
   - `bictorysNeedsOtp()`
6. Crée une route backend pour initier un paiement.
7. Crée une route backend pour consulter le statut d'un paiement.
8. Crée une route webhook publique avec body brut.
9. Crée une route payout protégée si l'application a besoin de payer des utilisateurs.
10. Ajoute les tests unitaires ou tests d'intégration minimum :
    - normalisation téléphone
    - mapping statuts
    - vérification webhook static secret
    - vérification webhook HMAC
    - idempotence webhook
    - refus webhook montant incorrect
    - création payout avec idempotency-key
11. Ajoute des logs structurés.
12. Ne marque jamais un paiement comme réussi juste parce que la charge a été créée.
13. Ne traite jamais un webhook comme valide sans vérifier signature/secret.
14. Ne crédite/délivre jamais deux fois pour le même paiement.
15. Ne relance jamais un payout avec une nouvelle idempotency-key pour le même retrait.
16. Mets à jour la documentation interne du projet avec les URLs webhook à configurer dans le dashboard Bictorys.

---

## 19. Exemple de prompt à donner à un agent IA de code

```txt
Intègre Bictorys dans ce projet en suivant strictement le fichier bictorys-integration.md.

Objectif : permettre les paiements entrants via Direct API, recevoir et valider les webhooks, mettre à jour les commandes/factures/abonnements de façon idempotente, ajouter le fallback de vérification de statut et préparer les payouts si le projet contient un wallet ou des retraits utilisateurs.

Contraintes :
- Toutes les requêtes Bictorys doivent passer par le backend.
- Les clés Bictorys doivent être dans les variables d'environnement.
- Le webhook doit utiliser le body brut et vérifier HMAC ou X-Secret-Key.
- Le webhook doit toujours répondre HTTP 200 après logging.
- Vérifier amount + currency avant de valider une commande.
- Les payouts doivent utiliser la clé privée + idempotency-key.
- Ajouter les migrations DB nécessaires.
- Ajouter des tests pour les parties critiques.
- Ne casse pas les flows existants du projet.

Commence par inspecter le projet, propose le plan d'implémentation, puis applique les changements fichier par fichier.
```

---

## 20. Points à vérifier directement avec Bictorys si doute

La documentation contient quelques variations selon les pages ou exemples. Avant un lancement production important, vérifier avec le dashboard Bictorys ou leur support :

1. Le code exact du Burkina Faso à utiliser pour le compte : `BK` ou `BF` selon endpoint.
2. Les opérateurs réellement activés sur le compte marchand.
3. Les pays activés en production.
4. Le comportement exact des webhooks pour les payouts, si l'application doit suivre un statut asynchrone de payout.
5. L'endpoint de status check à privilégier en production : `/pay/v1/transactions/{id}/status` ou `/pay/v1/charges/{id}`.
6. Les exigences PCI DSS si l'application veut intégrer la carte bancaire en Direct API sans redirection checkout.

---

## 21. Résumé opérationnel

Pour une intégration robuste :

- Créer les paiements avec `POST /pay/v1/charges?payment_type=...` et la clé publique.
- Attendre le webhook pour valider réellement le paiement.
- Vérifier les webhooks avec HMAC ou `X-Secret-Key`.
- Toujours vérifier montant + devise.
- Traiter les webhooks de manière idempotente.
- Utiliser le status check seulement comme fallback.
- Créer les payouts avec `POST /pay/v1/payouts?payment_type=...`, la clé privée et `idempotency-key`.
- Journaliser toutes les réponses Bictorys utiles.
- Tester séparément sandbox et production.
```
