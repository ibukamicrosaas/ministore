# Intégration LafricaMobile — Guide complet

Ce document couvre l'intégration des deux produits LafricaMobile :

| Produit | URL de base | Usage |
|---------|-------------|-------|
| **SMS API** | `https://lamsms.lafricamobile.com` | Notifications transactionnelles, campagnes SMS |
| **WhatsApp Business API (WABA)** | `https://waba.lafricamobile.com` | Messages WhatsApp Business |

> **Important :** Ce sont deux APIs distinctes avec des credentials, des formats et des endpoints différents. Ne pas les confondre.

---

# PARTIE 1 — API SMS

## 1.1 Vue d'ensemble

L'API SMS LafricaMobile (LAMSMS) est une API HTTP simple. Elle est interconnectée directement aux opérateurs d'Afrique de l'Ouest (Orange, Wave, MTN, Moov, etc.), ce qui lui confère un excellent taux de délivrabilité à un coût faible (~15 FCFA/SMS selon le pays).

**Caractéristiques :**
- Méthode : `GET` uniquement
- Format : XML encodé en query string (`?xml=...`)
- Authentification : `accountid` et `password` dans le XML
- Pas de header d'authentification
- Réponse : texte brut (pas de JSON)

## 1.2 Credentials requis

Disponibles dans le dashboard LafricaMobile → section "API SMS" :

| Variable | Correspond à | Obligatoire |
|----------|-------------|-------------|
| `LAFRICAMOBILE_ACCOUNT_ID` | ACCESS KEY | Oui |
| `LAFRICAMOBILE_PASSWORD` | ACCESS PASSWORD | Oui |
| `LAFRICAMOBILE_SENDER_ID` | Nom affiché sur le téléphone du destinataire (max 11 caractères) | Oui |

> **Sender ID :** Par défaut, l'expéditeur affiché est `LAM`. Pour utiliser un nom personnalisé (ex. `TEKKIShop`), il faut déclarer le Sender ID dans le dashboard LafricaMobile → "Déclarer un Sender" et fournir un justificatif (registre de commerce). La validation prend **5 jours ouvrés minimum**.

## 1.3 Format de la requête

```
GET https://lamsms.lafricamobile.com/api?xml=<push accountid="X" password="Y" sender="Z"><message><text>MESSAGE</text><to>NUMERO</to></message></push>
```

Le XML doit être **URL-encodé** (`encodeURIComponent` en JavaScript, `urlencode` en PHP).

### Structure XML complète

```xml
<push accountid="MON_ACCOUNT_ID" password="MON_PASSWORD" sender="TEKKIShop">
  <message>
    <text>Bonjour, votre commande a été confirmée.</text>
    <to>+221771234567</to>
  </message>
</push>
```

**Points critiques :**
- `accountid`, `password` et `sender` sont des **attributs** de `<push>` (pas des éléments enfants)
- Le contenu est enveloppé dans `<message>` puis `<text>` et `<to>`
- Le numéro peut être au format `+221771234567` ou `00221771234567`
- Les caractères spéciaux XML dans les valeurs doivent être échappés : `&amp;` `&lt;` `&gt;` `&quot;` `&apos;`

## 1.4 Implémentation TypeScript (production-ready)

```typescript
// src/lib/notifications/lafricamobile.ts

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

interface SendLafricamobileSmsParams {
  to: string
  text: string
}

interface SendLafricamobileSmsResult {
  success: boolean
  rawResponse: string
  error?: string
}

export async function sendLafricamobileSms(
  { to, text }: SendLafricamobileSmsParams
): Promise<SendLafricamobileSmsResult> {
  const accountId = process.env.LAFRICAMOBILE_ACCOUNT_ID
  const password  = process.env.LAFRICAMOBILE_PASSWORD
  const sender    = process.env.LAFRICAMOBILE_SENDER_ID

  if (!accountId || !password || !sender) {
    return {
      success: false,
      rawResponse: '',
      error: "Lafricamobile SMS non configuré (variables d'environnement manquantes).",
    }
  }

  const xml =
    `<push accountid="${escapeXml(accountId)}" password="${escapeXml(password)}" sender="${escapeXml(sender)}">` +
    `<message>` +
    `<text>${escapeXml(text)}</text>` +
    `<to>${escapeXml(to)}</to>` +
    `</message>` +
    `</push>`

  const endpoint = `https://lamsms.lafricamobile.com/api?xml=${encodeURIComponent(xml)}`

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(20000),
    })

    const rawResponse = await res.text()

    if (!res.ok) {
      return { success: false, rawResponse, error: `Lafricamobile HTTP ${res.status}` }
    }

    return { success: true, rawResponse }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue'
    return { success: false, rawResponse: '', error: message }
  }
}
```

### Couche de service (wrapper recommandé)

```typescript
// src/lib/notifications/sms.ts

import { sendLafricamobileSms } from './lafricamobile'

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '')
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

export async function sendSMS(
  to: string,
  message: string,
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const result = await sendLafricamobileSms({ to: normalizePhone(to), text: message })
  if (!result.success) {
    console.error('[sms]', result.error)
    return { success: false, error: result.error }
  }
  return { success: true, sid: result.rawResponse }
}
```

## 1.5 Variables d'environnement

Ajouter dans `.env.local` (dev) et dans les variables de prod (Vercel, Railway, etc.) :

```bash
# LafricaMobile SMS
LAFRICAMOBILE_ACCOUNT_ID=votre_access_key
LAFRICAMOBILE_PASSWORD=votre_access_password
LAFRICAMOBILE_SENDER_ID=TEKKIShop
```

> **Note :** La variable `LAFRICAMOBILE_SMS_BASE_URL` n'est pas nécessaire — l'URL `https://lamsms.lafricamobile.com/api` est une constante de l'API et ne change pas.

## 1.6 Script de test (Node.js, sans dépendances)

Fonctionne avec Node 20+ grâce au flag `--env-file` natif.

```javascript
// scripts/test-sms.mjs
// Usage : node --env-file=.env.local scripts/test-sms.mjs +221XXXXXXXXX

const phone = process.argv[2]

if (!phone) {
  console.error('Usage : node --env-file=.env.local scripts/test-sms.mjs +221XXXXXXXXX')
  process.exit(1)
}

const ACCOUNT_ID = process.env.LAFRICAMOBILE_ACCOUNT_ID
const PASSWORD   = process.env.LAFRICAMOBILE_PASSWORD
const SENDER_ID  = process.env.LAFRICAMOBILE_SENDER_ID

const missing = [
  !ACCOUNT_ID && 'LAFRICAMOBILE_ACCOUNT_ID',
  !PASSWORD   && 'LAFRICAMOBILE_PASSWORD',
  !SENDER_ID  && 'LAFRICAMOBILE_SENDER_ID',
].filter(Boolean)

if (missing.length > 0) {
  console.error('Variables manquantes :', missing.join(', '))
  process.exit(1)
}

function escapeXml(v) {
  return v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&apos;')
}

const message = `Test SMS LafricaMobile. Si vous recevez ce message, l'integration fonctionne.`

const xml =
  `<push accountid="${escapeXml(ACCOUNT_ID)}" password="${escapeXml(PASSWORD)}" sender="${escapeXml(SENDER_ID)}">` +
  `<message><text>${escapeXml(message)}</text><to>${escapeXml(phone)}</to></message>` +
  `</push>`

const endpoint = `https://lamsms.lafricamobile.com/api?xml=${encodeURIComponent(xml)}`

console.log(`\nEnvoi vers ${phone} avec sender "${SENDER_ID}"...`)

const response = await fetch(endpoint, { method: 'GET', signal: AbortSignal.timeout(20000) })
const body = await response.text()

if (!response.ok) {
  console.error(`Erreur HTTP ${response.status} : ${body}`)
  process.exit(1)
}

console.log(`✅  SMS envoyé. Réponse : ${body}`)
console.log('Vérifiez votre téléphone dans les 30 secondes.\n')
```

## 1.7 Builders de messages SMS recommandés

Messages courts (≤ 160 caractères = 1 segment SMS, pas d'emoji) pour réduire les coûts :

```typescript
// Rappel expiration période d'essai
export function buildTrialReminderMessage(params: {
  shopName: string
  daysLeft: number
  upgradeUrl: string
}): string {
  return `TEKKIShop - ${params.shopName}: votre essai expire dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''}. Activez votre boutique: ${params.upgradeUrl}`
}

// Boutique suspendue après expiration
export function buildTrialExpiredMessage(params: {
  shopName: string
  upgradeUrl: string
}): string {
  return `TEKKIShop - ${params.shopName}: essai termine. Boutique suspendue. Choisissez un plan: ${params.upgradeUrl}`
}

// Confirmation de commande au client
export function buildOrderConfirmationMessage(params: {
  shopName: string
  items: string
  totalPrice: number
  orderUrl: string
}): string {
  return `Commande confirmee chez ${params.shopName}!\n${params.items}\nTotal: ${params.totalPrice.toLocaleString('fr-FR')} FCFA\n${params.orderUrl}`
}

// Alerte nouvelle commande au marchand
export function buildNewOrderAlertMessage(params: {
  clientName: string
  clientPhone: string
  items: string
  totalPrice: number
}): string {
  return `Nouvelle commande - ${params.clientName} (${params.clientPhone})\n${params.items}\n${params.totalPrice.toLocaleString('fr-FR')} FCFA`
}

// Changement de statut commande
export function buildOrderStatusMessage(params: {
  shopName: string
  newStatus: 'confirmed' | 'preparing' | 'ready' | 'delivered'
  deliveryType: 'home_delivery' | 'store_pickup'
  orderRef: string
}): string | null {
  const ref = `Ref #${params.orderRef.slice(0, 8).toUpperCase()}`
  switch (params.newStatus) {
    case 'confirmed':
      return `${params.shopName}: commande ${ref} confirmee! Preparation en cours.`
    case 'preparing':
      return `${params.shopName}: commande ${ref} en preparation.`
    case 'ready':
      return params.deliveryType === 'home_delivery'
        ? `${params.shopName}: commande ${ref} prete, livraison en cours.`
        : `${params.shopName}: commande ${ref} prete a retirer!`
    default:
      return null
  }
}

// Plan activé
export function buildPlanActivatedMessage(params: {
  shopName: string
  planLabel: string
  dashboardUrl: string
}): string {
  return `TEKKIShop - ${params.shopName}: plan ${params.planLabel} active! Boutique en ligne. Dashboard: ${params.dashboardUrl}`
}
```

## 1.8 Coûts et volumes (données réelles)

| Pays | Prix unitaire | 1000 SMS (HT) | 1000 SMS (TTC, TVA 18%) |
|------|--------------|---------------|------------------------|
| Sénégal | 15 FCFA | 15 000 FCFA | ~17 700 FCFA |
| Côte d'Ivoire | 15 FCFA | 15 000 FCFA | ~17 700 FCFA |
| (autres pays) | variable | — | Voir dashboard |

Les crédits s'achètent directement sur le dashboard LafricaMobile → "Recharger mon compte".

## 1.9 Erreurs courantes et solutions

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| `fetch failed` (erreur réseau) | Mauvaise URL de base | Vérifier que l'URL est exactement `https://lamsms.lafricamobile.com/api` |
| HTTP 200 mais SMS non reçu | Mauvais credentials | Vérifier ACCOUNT_ID et PASSWORD dans le dashboard |
| Sender affiché = "LAM" | Sender ID non déclaré | Remplir le formulaire de déclaration dans le dashboard |
| SMS non reçu après 60s | Numéro mal formaté | Utiliser le format `+221XXXXXXXXX` ou `00221XXXXXXXXX` |
| Réponse contient "error" | Erreur applicative | Logger `rawResponse` pour diagnostiquer |

---

# PARTIE 2 — API WhatsApp Business (WABA)

## 2.1 Vue d'ensemble

LafricaMobile expose une API REST pour WhatsApp Business (LAM WABA API). Contrairement à l'API SMS, cette API utilise des headers d'authentification, du JSON et suit les conventions REST standard.

**URL de base :**
```
https://waba.lafricamobile.com
```

**Authentification :** header `LAM-API-KEY` sur chaque requête.

```http
LAM-API-KEY: <clé_api_lafricamobile>
```

> Ne jamais exposer cette clé côté frontend, dans les logs ou dans le repository Git.

**Règle fondamentale :** Si le client n'a pas initié la conversation WhatsApp avec l'entreprise, utiliser un message de type `template` (pré-approuvé), pas un message texte libre.

## 2.2 Endpoints principaux

| Fonction | Méthode | Endpoint |
|----------|---------|----------|
| Envoyer un message | `POST` | `/messages` |
| Vérifier l'état WABA | `GET` | `/health` |
| Lister les templates | `GET` | `/configs/templates` |
| Récupérer le webhook | `GET` | `/configs/webhook` |
| Configurer le webhook | `POST` | `/configs/webhook` |
| Uploader un média | `POST` | `/media` |
| Infos d'un média | `GET` | `/media/{id}` |
| Supprimer un média | `DELETE` | `/media/{id}` |

Documentation officielle : https://developers.lafricamobile.com/docs/whatsapp/introduction

## 2.3 Variables d'environnement

```bash
# LafricaMobile WhatsApp Business API
LAFRICAMOBILE_WABA_API_KEY=votre_cle_api_waba
LAFRICAMOBILE_TEMPLATE_NAMESPACE=votre_namespace_waba

# Secret pour sécuriser le webhook entrant
LAFRICAMOBILE_WEBHOOK_SECRET=chaine_longue_aleatoire_non_devinable
```

## 2.4 Client HTTP

```typescript
// src/lib/notifications/lafricamobile-waba.ts

export class LafricamobileWabaClient {
  private readonly baseUrl = 'https://waba.lafricamobile.com'
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers = new Headers(init.headers)
    headers.set('LAM-API-KEY', this.apiKey)
    if (!path.startsWith('/media')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(url, {
      ...init,
      headers,
      signal: AbortSignal.timeout(20000),
    })

    const body = response.headers.get('content-type')?.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '')

    if (!response.ok) {
      throw new Error(`Lafricamobile WABA ${response.status} ${path}: ${JSON.stringify(body)}`)
    }

    return body as T
  }

  async getHealth() {
    return this.request<{ health: { gateway_status: string } }>('/health')
  }

  async listTemplates(params?: { limit?: number; offset?: number; sort?: string }) {
    const qs = new URLSearchParams({
      limit: String(params?.limit ?? 1000),
      offset: String(params?.offset ?? 0),
      sort: params?.sort ?? 'name',
    })
    return this.request<unknown>(`/configs/templates?${qs}`)
  }

  async sendMessage(payload: Record<string, unknown>) {
    return this.request<unknown>('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getWebhook() {
    return this.request<{ url: string }>('/configs/webhook')
  }

  async setWebhook(url: string) {
    return this.request<{ url: string }>('/configs/webhook', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  }
}
```

## 2.5 Normalisation des numéros WhatsApp

```typescript
// WhatsApp attend le numéro sans "+" mais avec l'indicatif pays
export function normalizeWhatsAppRecipient(phone: string): string {
  return phone
    .trim()
    .replace(/^\+/, '')   // retire le + initial
    .replace(/[\s().-]/g, '')  // retire espaces et ponctuation
}

// Exemples :
// +221 77 123 45 67  →  221771234567
// 00221771234567     →  00221771234567  (garder le 00, WhatsApp l'accepte)
// 221771234567       →  221771234567
```

## 2.6 Envoi d'un message texte

```typescript
async function sendTextMessage(to: string, body: string) {
  const client = new LafricamobileWabaClient(process.env.LAFRICAMOBILE_WABA_API_KEY!)
  return client.sendMessage({
    recipient_type: 'individual',
    to: normalizeWhatsAppRecipient(to),
    type: 'text',
    preview_url: false,
    text: { body },
  })
}
```

## 2.7 Envoi d'un message template

```typescript
async function sendTemplateMessage(params: {
  to: string
  templateName: string
  languageCode?: string
  bodyParameters?: string[]
}) {
  const client = new LafricamobileWabaClient(process.env.LAFRICAMOBILE_WABA_API_KEY!)
  const components = params.bodyParameters?.length
    ? [{ type: 'body', parameters: params.bodyParameters.map(text => ({ type: 'text', text })) }]
    : []

  return client.sendMessage({
    recipient_type: 'individual',
    to: normalizeWhatsAppRecipient(params.to),
    type: 'template',
    template: {
      namespace: process.env.LAFRICAMOBILE_TEMPLATE_NAMESPACE,
      name: params.templateName,
      language: {
        policy: 'deterministic',
        code: params.languageCode ?? 'fr',
      },
      components,
    },
  })
}
```

## 2.8 Envoi de médias

```typescript
// Par lien HTTP
async function sendImageByLink(to: string, link: string, caption?: string) {
  const client = new LafricamobileWabaClient(process.env.LAFRICAMOBILE_WABA_API_KEY!)
  return client.sendMessage({
    recipient_type: 'individual',
    to: normalizeWhatsAppRecipient(to),
    type: 'image',
    image: { link, ...(caption && { caption }) },
  })
}

// Document PDF par lien
async function sendDocumentByLink(to: string, link: string, filename: string, caption?: string) {
  const client = new LafricamobileWabaClient(process.env.LAFRICAMOBILE_WABA_API_KEY!)
  return client.sendMessage({
    recipient_type: 'individual',
    to: normalizeWhatsAppRecipient(to),
    type: 'document',
    document: { link, filename, ...(caption && { caption }) },
  })
}
```

## 2.9 Healthcheck (avec cache obligatoire)

```typescript
// Ne pas appeler GET /health plus d'une fois toutes les 5 minutes.
// Le statut est rafraîchi toutes les 5 minutes côté LafricaMobile.

let healthCache: { status: string; cachedAt: number } | null = null

async function getWabaHealth(): Promise<string> {
  const now = Date.now()
  if (healthCache && now - healthCache.cachedAt < 5 * 60 * 1000) {
    return healthCache.status
  }

  const client = new LafricamobileWabaClient(process.env.LAFRICAMOBILE_WABA_API_KEY!)
  const data = await client.getHealth()
  const status = data.health.gateway_status

  healthCache = { status, cachedAt: now }
  return status
}

// Statuts possibles : connected | connecting | disconnected | uninitialized | unregistered
```

## 2.10 Webhook entrant

### Configurer l'URL webhook

```typescript
async function registerWebhook(appPublicUrl: string) {
  const client = new LafricamobileWabaClient(process.env.LAFRICAMOBILE_WABA_API_KEY!)
  const secret = process.env.LAFRICAMOBILE_WEBHOOK_SECRET
  const webhookUrl = `${appPublicUrl}/api/webhooks/lafricamobile/whatsapp?token=${secret}`
  return client.setWebhook(webhookUrl)
}
```

### Endpoint de réception (Next.js App Router)

```typescript
// app/api/webhooks/lafricamobile/whatsapp/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== process.env.LAFRICAMOBILE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Sauvegarder le payload brut immédiatement (traitement async après)
  const admin = createAdminClient()
  await admin.from('lafricamobile_webhook_events').insert({
    payload_json: payload,
    received_at: new Date().toISOString(),
    processing_status: 'pending',
  })

  // Répondre 200 immédiatement pour éviter les retries
  return NextResponse.json({ received: true }, { status: 200 })
}
```

> **Note :** LafricaMobile ne fournit pas de signature HMAC webhook dans sa documentation publique. Utiliser un secret long dans l'URL tant qu'une signature officielle n'est pas disponible.

## 2.11 Payloads complets de référence

### Texte
```json
{
  "recipient_type": "individual",
  "to": "221771234567",
  "type": "text",
  "preview_url": false,
  "text": { "body": "Bonjour, votre commande a bien été reçue." }
}
```

### Template avec variables
```json
{
  "recipient_type": "individual",
  "to": "221771234567",
  "type": "template",
  "template": {
    "namespace": "<namespace>",
    "name": "order_confirmation",
    "language": { "policy": "deterministic", "code": "fr" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Fatoumata" },
          { "type": "text", "text": "CMD-4821" }
        ]
      }
    ]
  }
}
```

### Image par lien
```json
{
  "recipient_type": "individual",
  "to": "221771234567",
  "type": "image",
  "image": { "link": "https://example.com/photo.jpg", "caption": "Votre reçu" }
}
```

### Document PDF
```json
{
  "recipient_type": "individual",
  "to": "221771234567",
  "type": "document",
  "document": {
    "link": "https://example.com/facture.pdf",
    "caption": "Votre facture",
    "filename": "facture.pdf"
  }
}
```

### Boutons interactifs
```json
{
  "recipient_type": "individual",
  "to": "221771234567",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Confirmez-vous votre commande ?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "confirm", "title": "Confirmer" } },
        { "type": "reply", "reply": { "id": "cancel", "title": "Annuler" } }
      ]
    }
  }
}
```

---

# PARTIE 3 — Choisir entre SMS et WhatsApp Business

| Critère | SMS | WhatsApp Business |
|---------|-----|------------------|
| **Setup** | Immédiat (2 variables) | 2-3 jours (Meta Business Manager + numéro dédié) |
| **Coût** | ~15 FCFA/message | Variable (conversations Meta ~0,05-0,12€) |
| **Délivrabilité Afrique** | Excellente (interconnexion opérateurs) | Dépend de l'adoption WhatsApp |
| **Format** | Texte pur, 160 chars/segment | Texte, images, docs, boutons, templates |
| **Messages marketing** | Oui (pas de restriction Meta) | Uniquement via templates approuvés |
| **Sender branding** | Oui (après validation 5j) | Nom de compte WhatsApp Business |
| **Cas d'usage idéal** | Notifications transactionnelles rapides, campagnes de masse | Conversations riches, support client, templates visuels |

**Recommandation pour débuter :** Implémenter l'API SMS en premier (setup immédiat, zéro configuration Meta). Ajouter le WABA ensuite si le projet nécessite des messages riches ou des conversations bidirectionnelles.

---

# PARTIE 4 — Checklist d'intégration

## API SMS
- [ ] Créer un compte LafricaMobile sur lamsms.lafricamobile.com
- [ ] Récupérer ACCESS KEY et ACCESS PASSWORD dans le dashboard
- [ ] Ajouter `LAFRICAMOBILE_ACCOUNT_ID`, `LAFRICAMOBILE_PASSWORD`, `LAFRICAMOBILE_SENDER_ID` dans les variables d'environnement
- [ ] Déclarer le Sender ID personnalisé dans le dashboard (délai : 5 jours ouvrés)
- [ ] Implémenter `sendLafricamobileSms()` selon la section 1.4
- [ ] Tester avec le script de la section 1.6
- [ ] Acheter des crédits SMS (tarif : ~15 FCFA/SMS pour Sénégal et Côte d'Ivoire)
- [ ] Ajouter les variables en production (Vercel, Railway, etc.)

## API WhatsApp Business
- [ ] Créer un compte Meta Business Manager
- [ ] Connecter un numéro de téléphone dédié WhatsApp Business
- [ ] Récupérer la clé API WABA dans le dashboard LafricaMobile
- [ ] Créer et faire approuver les templates Meta (délai : 24-48h)
- [ ] Ajouter `LAFRICAMOBILE_WABA_API_KEY`, `LAFRICAMOBILE_TEMPLATE_NAMESPACE`, `LAFRICAMOBILE_WEBHOOK_SECRET`
- [ ] Implémenter le client WABA selon la section 2.4
- [ ] Configurer le webhook avec `registerWebhook()`
- [ ] Créer la table `lafricamobile_webhook_events` en base
- [ ] Tester `getHealth()` → statut `connected` attendu
- [ ] Tester un envoi réel vers un numéro test

---

# PARTIE 5 — Sécurité

- La clé API LafricaMobile (SMS ou WABA) ne doit **jamais** apparaître côté frontend, dans les logs publics ou dans le repository Git.
- Le frontend appelle des endpoints internes du serveur ; le serveur appelle LafricaMobile.
- Valider les droits utilisateur avant de déclencher tout envoi.
- Ne pas exposer les réponses d'erreur brutes LafricaMobile aux utilisateurs finaux.
- Pour le webhook WABA : utiliser un secret long et aléatoire dans l'URL tant que LafricaMobile ne fournit pas de signature HMAC officielle.
- Pour les campagnes SMS marketing : respecter les règles opt-in/opt-out locales.
