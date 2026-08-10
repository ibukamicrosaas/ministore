# Spec — Vente de produits digitaux sur TEKKIShop

> **Session cible :** Lire ce fichier en entier avant de commencer. Il contient tout le contexte, les décisions d'architecture, et les instructions précises pour implémenter la fonctionnalité de bout en bout.

---

## Contexte projet

**TEKKIShop** (`tekki.shop`) est un SaaS e-commerce mobile-first pour les marchands africains.  
Stack : Next.js 15 App Router · TypeScript strict · Supabase (Auth + PostgreSQL + RLS + Storage) · Tailwind CSS uniquement.

Les fichiers `.md` sont dans `.gitignore` — ne jamais les pousser sur GitHub.  
Toujours vérifier `npx tsc --noEmit` (zéro erreur) avant de committer.  
Committer avec `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`.

---

## Objectif

Permettre aux marchands de vendre des **fichiers à télécharger** (ebooks, templates, guides, PDF…) via leur boutique TEKKIShop. Après paiement, le client reçoit automatiquement un lien de téléchargement sécurisé et temporaire sur WhatsApp.

---

## Décisions d'architecture

| Décision | Choix retenu | Raison |
|---|---|---|
| Stockage des fichiers | Bucket privé Supabase `digital-products` | Pas d'accès direct, contrôle total |
| Génération du lien | Token en DB + API route `/api/download/[token]` | Audit trail, limite de téléchargements |
| Durée de validité du lien | 48h après achat | Équilibre UX / sécurité (minutes trop court) |
| Limite téléchargements | 5 par achat | Protège contre le partage massif |
| Signed URL Supabase | 60 secondes (à chaque accès) | Le token long-lived est dans notre DB, pas dans l'URL |
| Panier mixte | **Interdit en V1** | Simplifie le flux de commande |
| Statut commande finale | `completed` (auto, sans étapes livraison) | Pas de livraison physique |

---

## Migration 1 — Extension de la table `products`

**Fichier à créer :** `supabase/migrations/048_digital_products.sql`

```sql
-- Migration 048 : support des produits digitaux (téléchargeables)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'physical'
    CHECK (product_type IN ('physical', 'digital')),
  ADD COLUMN IF NOT EXISTS digital_file_path  TEXT,    -- chemin dans Supabase Storage: '{shop_id}/{filename}'
  ADD COLUMN IF NOT EXISTS digital_file_name  TEXT,    -- nom affiché au client (ex: "Guide-Marketing.pdf")
  ADD COLUMN IF NOT EXISTS digital_file_size  INTEGER; -- taille en octets

-- Index pour filtrer les produits digitaux d'une boutique
CREATE INDEX IF NOT EXISTS products_digital_idx
  ON products(shop_id, product_type)
  WHERE product_type = 'digital';
```

---

## Migration 2 — Table `download_tokens`

**À ajouter dans le même fichier `048_digital_products.sql`**, à la suite :

```sql
-- Table des tokens de téléchargement
CREATE TABLE IF NOT EXISTS download_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  token          TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at     TIMESTAMPTZ NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads  INTEGER NOT NULL DEFAULT 5,
  downloaded_at  TIMESTAMPTZ,                         -- date du 1er téléchargement
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour lookup rapide par token
CREATE UNIQUE INDEX IF NOT EXISTS download_tokens_token_idx ON download_tokens(token);
CREATE INDEX IF NOT EXISTS download_tokens_order_idx ON download_tokens(order_id);

-- RLS : désactivé pour l'accès public (sécurité = token non devinable)
-- L'API utilise le service_role pour lire/écrire
ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;
-- Pas de policy publique — uniquement service_role via l'API route
```

---

## Migration 3 — Mise à jour des types TypeScript

**Fichier :** `src/types/database.ts`

Dans la section `products: { Row: { ... } }`, ajouter **après** `updated_at: string` :

```typescript
product_type: 'physical' | 'digital' | null
digital_file_path: string | null
digital_file_name: string | null
digital_file_size: number | null
```

Faire la même chose pour `Insert:` et `Update:` (tous optionnels avec `?`).

Ajouter également la définition de `download_tokens` dans la section `Tables` :

```typescript
download_tokens: {
  Row: {
    id: string
    order_id: string
    product_id: string
    shop_id: string
    token: string
    expires_at: string
    download_count: number
    max_downloads: number
    downloaded_at: string | null
    created_at: string
  }
  Insert: {
    id?: string
    order_id: string
    product_id: string
    shop_id: string
    token?: string
    expires_at: string
    download_count?: number
    max_downloads?: number
    downloaded_at?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    order_id?: string
    product_id?: string
    shop_id?: string
    token?: string
    expires_at?: string
    download_count?: number
    max_downloads?: number
    downloaded_at?: string | null
    created_at?: string
  }
  Relationships: []
}
```

---

## Bucket Supabase Storage

**Ne pas créer via migration SQL** — créer manuellement dans le dashboard Supabase ou via le SDK admin au démarrage :

- **Nom :** `digital-products`
- **Visibilité :** Privé (non public)
- **Taille max par fichier :** 50 MB
- **Types MIME autorisés :** `application/pdf`, `application/zip`, `application/epub+zip`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Structure des chemins :** `{shop_id}/{timestamp}-{filename_sanitized}`

Créer une **RLS policy** sur le bucket : uniquement le service_role peut lire et écrire (pas de lecture publique).

---

## Fichiers à créer

### 1. API route — upload fichier digital

**Fichier :** `src/app/api/products/digital-upload/route.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifier que l'user est owner d'une boutique
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id || profile.role !== 'owner')
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  // Validation taille (50 MB max)
  if (file.size > 50 * 1024 * 1024)
    return NextResponse.json({ error: 'Fichier trop lourd (max 50 MB)' }, { status: 400 })

  // Validation type MIME
  const ALLOWED = [
    'application/pdf',
    'application/zip',
    'application/epub+zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: 'Type de fichier non accepté' }, { status: 400 })

  // Sanitize nom de fichier
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = `${profile.shop_id}/${safeName}`

  const admin = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from('digital-products')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError)
    return NextResponse.json({ error: 'Erreur upload: ' + uploadError.message }, { status: 500 })

  return NextResponse.json({
    path: filePath,
    name: file.name,
    size: file.size,
  })
}
```

### 2. API route — téléchargement sécurisé

**Fichier :** `src/app/api/download/[token]/route.ts`

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) return NextResponse.redirect(new URL('/telechargement/expire', process.env.NEXT_PUBLIC_APP_URL!))

  const admin = createAdminClient()

  // Récupérer le token
  const { data: dt, error } = await admin
    .from('download_tokens')
    .select('*, products(digital_file_path, digital_file_name)')
    .eq('token', token)
    .single()

  if (error || !dt) return NextResponse.redirect(new URL('/telechargement/expire', process.env.NEXT_PUBLIC_APP_URL!))

  // Vérifier expiration
  if (new Date(dt.expires_at) < new Date())
    return NextResponse.redirect(new URL('/telechargement/expire', process.env.NEXT_PUBLIC_APP_URL!))

  // Vérifier limite de téléchargements
  if (dt.download_count >= dt.max_downloads)
    return NextResponse.redirect(new URL('/telechargement/expire', process.env.NEXT_PUBLIC_APP_URL!))

  const product = dt.products as { digital_file_path: string; digital_file_name: string } | null
  if (!product?.digital_file_path)
    return NextResponse.redirect(new URL('/telechargement/expire', process.env.NEXT_PUBLIC_APP_URL!))

  // Générer signed URL Supabase (60 secondes)
  const { data: signedData, error: signedError } = await admin.storage
    .from('digital-products')
    .createSignedUrl(product.digital_file_path, 60)

  if (signedError || !signedData?.signedUrl)
    return NextResponse.json({ error: 'Erreur génération lien' }, { status: 500 })

  // Incrémenter le compteur + enregistrer la date du 1er téléchargement
  await admin
    .from('download_tokens')
    .update({
      download_count: dt.download_count + 1,
      downloaded_at: dt.downloaded_at ?? new Date().toISOString(),
    })
    .eq('id', dt.id)

  return NextResponse.redirect(signedData.signedUrl)
}
```

### 3. Page de téléchargement client

**Fichier :** `src/app/telechargement/[token]/page.tsx`

Cette page publique accueille le client et lui propose de télécharger son fichier.

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { APP_URL } from '@/constants'

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: dt } = await admin
    .from('download_tokens')
    .select(`
      expires_at, download_count, max_downloads, downloaded_at,
      products(name, digital_file_name, digital_file_size),
      orders(total_price),
      shops:shop_id(name, slug)
    `)
    .eq('token', token)
    .single()

  const isExpired  = !dt || new Date(dt.expires_at) < new Date()
  const isExhausted = dt && dt.download_count >= dt.max_downloads
  const isInvalid  = !dt

  if (isInvalid || isExpired || isExhausted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-sm text-gray-500 mb-6">
            {isExhausted
              ? 'Le nombre maximum de téléchargements a été atteint.'
              : 'Ce lien de téléchargement n\'est plus valide ou a expiré (48h après l\'achat).'}
          </p>
          <p className="text-xs text-gray-400">
            Contacte la boutique via WhatsApp pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    )
  }

  const product  = dt.products as { name: string; digital_file_name: string; digital_file_size: number | null } | null
  const shop     = dt.shops as { name: string; slug: string } | null
  const remaining = dt.max_downloads - dt.download_count
  const expiresAt = new Date(dt.expires_at)

  const fileSizeStr = product?.digital_file_size
    ? product.digital_file_size > 1024 * 1024
      ? `${(product.digital_file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(product.digital_file_size / 1024)} KB`
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-4">
        {/* Card principale */}
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          {shop && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {shop.name}
            </p>
          )}
          <h1 className="text-xl font-bold text-gray-900 mb-1">Merci pour ton achat !</h1>
          {product && (
            <p className="text-sm text-gray-500 mb-6">{product.name}</p>
          )}

          <a
            href={`/api/download/${token}`}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            <Download className="h-5 w-5" />
            Télécharger{product?.digital_file_name ? ` — ${product.digital_file_name}` : ''}
            {fileSizeStr && <span className="opacity-70 font-normal">({fileSizeStr})</span>}
          </a>

          <div className="mt-5 space-y-1.5 text-xs text-gray-400">
            <p className="flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Lien valide jusqu'au {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
            <p>{remaining} téléchargement{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Problème ?{' '}
          {shop && (
            <Link href={`/${shop.slug}`} className="underline hover:text-gray-600">
              Contacter {shop.name}
            </Link>
          )}
        </p>
      </div>
    </div>
  )
}
```

### 4. Page d'expiration (fallback)

**Fichier :** `src/app/telechargement/expire/page.tsx`

Page statique simple :

```typescript
import { AlertCircle } from 'lucide-react'

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Lien expiré</h1>
        <p className="text-sm text-gray-500">
          Ce lien de téléchargement n&apos;est plus valide. Contacte la boutique via WhatsApp pour obtenir un nouveau lien.
        </p>
      </div>
    </div>
  )
}
```

---

## Fichiers à modifier

### 5. Dashboard — Formulaire produit (nouveau produit et édition)

**Fichiers :** `src/app/dashboard/products/new/page.tsx` et `src/app/dashboard/products/[id]/page.tsx` (ou leur composant de formulaire partagé — chercher où se trouve le formulaire de création/édition produit)

**Ce qu'il faut ajouter :**

a) Un sélecteur de type produit en haut du formulaire :

```tsx
{/* Sélecteur type produit */}
<div>
  <label className="block text-sm font-semibold text-gray-900 mb-3">Type de produit</label>
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setProductType('physical')}
      className={`rounded-2xl border p-4 text-left transition-all ${
        productType === 'physical'
          ? 'border-[var(--color-primary)] bg-sky-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <p className="text-sm font-semibold text-gray-900">📦 Physique</p>
      <p className="text-xs text-gray-500 mt-0.5">Livré ou retiré en boutique</p>
    </button>
    <button
      type="button"
      onClick={() => setProductType('digital')}
      className={`rounded-2xl border p-4 text-left transition-all ${
        productType === 'digital'
          ? 'border-[var(--color-primary)] bg-sky-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <p className="text-sm font-semibold text-gray-900">📄 Digital</p>
      <p className="text-xs text-gray-500 mt-0.5">Fichier à télécharger</p>
    </button>
  </div>
</div>
```

b) Si `productType === 'digital'`, afficher un bloc d'upload fichier à la place des champs stock/variantes :

```tsx
{productType === 'digital' && (
  <div>
    <label className="block text-sm font-semibold text-gray-900 mb-2">Fichier à vendre</label>
    {digitalFilePath ? (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{digitalFileName}</p>
          <p className="text-xs text-gray-500">
            {digitalFileSize ? `${(digitalFileSize / (1024 * 1024)).toFixed(1)} MB` : ''}
          </p>
        </div>
        <button type="button" onClick={() => { setDigitalFilePath(null); setDigitalFileName(null); setDigitalFileSize(null) }}
          className="text-xs text-red-500 hover:text-red-700">
          Supprimer
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 cursor-pointer hover:border-[var(--color-primary)] hover:bg-sky-50 transition-all">
        <Upload className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-600">Cliquer pour uploader</p>
        <p className="text-xs text-gray-400 mt-1">PDF, ZIP, DOCX, EPUB — max 50 MB</p>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.zip,.docx,.xlsx,.epub"
          onChange={handleFileUpload}
        />
      </label>
    )}
  </div>
)}
```

c) Fonction `handleFileUpload` :

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setUploadingFile(true)
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/products/digital-upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (res.ok) {
    setDigitalFilePath(data.path)
    setDigitalFileName(data.name)
    setDigitalFileSize(data.size)
  } else {
    toast.error(data.error ?? 'Erreur upload')
  }
  setUploadingFile(false)
}
```

d) Inclure dans la soumission du formulaire :

```typescript
// Dans l'action de sauvegarde du produit :
product_type: productType,
digital_file_path: productType === 'digital' ? digitalFilePath : null,
digital_file_name: productType === 'digital' ? digitalFileName : null,
digital_file_size: productType === 'digital' ? digitalFileSize : null,
```

e) **Masquer** pour les produits digitaux : les champs variantes, stock, date de livraison, zones de livraison.

### 6. Page produit publique

**Fichier :** `src/app/[shop-slug]/produit/[id]/page.tsx`

a) Récupérer `product_type`, `digital_file_name`, `digital_file_size` dans la query Supabase.

b) Si `product.product_type === 'digital'`, afficher :
- Un badge `📄 Téléchargement numérique` sous le nom du produit
- Le nom du fichier et sa taille
- **Ne pas afficher** les informations de livraison/délai
- Changer le label du bouton CTA : `"Acheter — {prix}"` au lieu de `"Je le prends"`

Exemple badge :
```tsx
{product.product_type === 'digital' && (
  <div className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2 w-fit">
    <span className="text-base">📄</span>
    <div>
      <p className="text-xs font-semibold text-violet-700">Téléchargement numérique</p>
      {product.digital_file_name && (
        <p className="text-[10px] text-violet-500">{product.digital_file_name}</p>
      )}
    </div>
  </div>
)}
```

### 7. Formulaire de commande

**Fichier :** `src/app/[shop-slug]/commander/OrderForm.tsx` (1145 lignes — modifications ciblées)

a) Dans les props, recevoir `isDigital: boolean` (calculé depuis le produit dans la page parente).

b) Si `isDigital === true` :
- Masquer entièrement la section livraison/retrait (delivery_type, adresse, date, zones)
- Masquer le champ date de livraison
- Changer le texte du bouton de validation : `"Acheter et télécharger — {prix}"`
- Forcer `delivery_type = 'store_pickup'` et `delivery_date = null` dans la soumission (valeurs par défaut pour ne pas casser le schema)
- Masquer les options de paiement à la livraison (forcer paiement en ligne uniquement)

c) Dans la page parente `src/app/[shop-slug]/commander/page.tsx` :
```typescript
// Récupérer le type du produit présélectionné
const { data: productData } = preselectedProductId
  ? await supabase.from('products').select('product_type').eq('id', preselectedProductId).single()
  : { data: null }

const isDigital = (productData as { product_type?: string } | null)?.product_type === 'digital'

// Passer à OrderForm :
<OrderForm ... isDigital={isDigital} />
```

**Note importante :** Si un client tente d'ajouter manuellement un produit physique à un panier digital (ou vice versa), afficher une erreur et empêcher le mélange. En V1, la page commander est toujours ouverte avec un `?product=ID` présélectionné, donc le panier mixte ne se produit pas naturellement.

### 8. Webhooks paiement — génération des tokens

**Fichiers :** `src/app/api/webhooks/bictorys/route.ts` et `src/app/api/webhooks/stripe/route.ts`

Dans la fonction qui traite un paiement réussi (après mise à jour du statut de commande), ajouter la génération des tokens et l'envoi WhatsApp pour les commandes digitales.

Chercher le pattern `handleOrderWebhook` ou équivalent, et après la mise à jour du statut de commande, ajouter :

```typescript
// Après la mise à jour du statut de la commande :

// Vérifier si la commande contient des produits digitaux
const { data: orderItems } = await supabase
  .from('order_items')
  .select('product_id, products(product_type, digital_file_name)')
  .eq('order_id', orderId)

const digitalItems = (orderItems ?? []).filter(
  (item: any) => item.products?.product_type === 'digital'
)

if (digitalItems.length > 0) {
  // Marquer la commande comme "completed" (pas de livraison physique)
  await adminClient
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId)

  // Générer un token par produit digital
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h

  for (const item of digitalItems) {
    const { data: tokenData } = await adminClient
      .from('download_tokens')
      .insert({
        order_id:   orderId,
        product_id: item.product_id,
        shop_id:    shopId,
        expires_at: expiresAt,
        max_downloads: 5,
      })
      .select('token')
      .single()

    if (tokenData?.token) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/telechargement/${tokenData.token}`
      const msg = buildDigitalDownloadMessage({
        shopName:     shopName,
        clientName:   clientName,
        productName:  item.products?.digital_file_name ?? 'ton fichier',
        downloadUrl,
        expiresHours: 48,
      })
      await sendWhatsApp(clientWhatsapp, msg)
    }
  }
}
```

### 9. Nouveau message WhatsApp — téléchargement digital

**Fichier :** `src/lib/notifications/whatsapp.ts`

Ajouter la fonction suivante :

```typescript
export function buildDigitalDownloadMessage(params: {
  shopName: string
  clientName: string
  productName: string
  downloadUrl: string
  expiresHours: number
}): string {
  return `Merci ${params.clientName} ! Ton achat chez *${params.shopName}* est confirme.\n\n📄 *${params.productName}*\n\nTelecharge ton fichier ici :\n${params.downloadUrl}\n\n_Lien valide ${params.expiresHours}h — max 5 telechargements._`
}
```

### 10. Dashboard — Page de détail commande digitale

**Fichier :** `src/app/dashboard/orders/[id]/page.tsx`

Ajouter une section qui affiche, pour les commandes digitales, le statut des téléchargements :

```typescript
// Récupérer les tokens liés à la commande
const { data: tokens } = await supabase
  .from('download_tokens')
  .select('*, products(name, digital_file_name)')
  .eq('order_id', orderId)

// Afficher si tokens.length > 0 :
// Pour chaque token :
// - Nom du fichier
// - Téléchargements : X/5
// - Lien expiré le : ...
// - Bouton "Renvoyer le lien" (génère un nouveau token si l'ancien est expiré/épuisé)
```

---

## Nouveau statut de commande

Ajouter `'completed'` aux statuts existants dans `src/constants/index.ts` :

```typescript
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready:     'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  completed: 'Complétée',   // ← nouveau : commandes digitales payées et liens envoyés
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  // ... existants ...
  completed: 'bg-violet-100 text-violet-800',  // ← nouveau
}
```

---

## Checklist d'implémentation (ordre recommandé)

1. [ ] Créer `supabase/migrations/048_digital_products.sql` (migrations 1 + 2 ci-dessus)
2. [ ] Appliquer la migration en local (`supabase db push` ou `supabase migration up`)
3. [ ] Mettre à jour `src/types/database.ts` (migration 3)
4. [ ] Créer le bucket `digital-products` dans Supabase Storage (privé)
5. [ ] Créer `src/app/api/products/digital-upload/route.ts`
6. [ ] Créer `src/app/api/download/[token]/route.ts`
7. [ ] Créer `src/app/telechargement/[token]/page.tsx`
8. [ ] Créer `src/app/telechargement/expire/page.tsx`
9. [ ] Ajouter `buildDigitalDownloadMessage` dans `src/lib/notifications/whatsapp.ts`
10. [ ] Ajouter `completed` dans `src/constants/index.ts`
11. [ ] Modifier le formulaire produit dashboard (sélecteur type + upload fichier)
12. [ ] Modifier `src/app/[shop-slug]/produit/[id]/page.tsx` (badge + CTA adapté)
13. [ ] Modifier `src/app/[shop-slug]/commander/OrderForm.tsx` (masquer livraison si digital)
14. [ ] Modifier `src/app/[shop-slug]/commander/page.tsx` (passer `isDigital`)
15. [ ] Modifier les webhooks Bictorys et Stripe (génération tokens + WhatsApp)
16. [ ] Modifier `src/app/dashboard/orders/[id]/page.tsx` (afficher statut téléchargements)
17. [ ] Tester le flux complet : création produit → commande → paiement simulé → token → téléchargement
18. [ ] `npx tsc --noEmit` (zéro erreur)
19. [ ] Committer et pousser

---

## Contraintes V1 — à respecter

- **Pas de panier mixte** (digital + physique dans la même commande)
- **Taille max** : 50 MB par fichier
- **Formats acceptés** : PDF, ZIP, DOCX, XLSX, EPUB uniquement
- **Pas de DRM** : le fichier n'est pas protégé contre la copie, uniquement le lien
- **Pas de re-génération de token depuis le dashboard** en V1 (à ajouter en V2)
- **Pas de page "Mes achats"** côté client en V1 — le lien WhatsApp est le seul point d'accès

---

## Variables d'environnement nécessaires

Aucune nouvelle variable — tout utilise les existantes :
- `NEXT_PUBLIC_APP_URL` — pour construire les liens de téléchargement
- `SUPABASE_SERVICE_ROLE_KEY` — pour les opérations admin (admin client)
- `NEXT_PUBLIC_SUPABASE_URL` — existant

---

## Notes importantes

- Le `createAdminClient()` (service_role) est **obligatoire** dans l'API download et dans les webhooks pour bypasser le RLS sur `download_tokens`.
- Ne jamais exposer `digital_file_path` côté client — c'est un chemin interne Storage.
- La page `/telechargement/[token]` est publique mais sécurisée par le token (32 bytes = 64 chars hex, non devinable).
- Les signed URLs Supabase de 60 secondes sont générées **à chaque appel** à `/api/download/[token]` — elles ne sont jamais stockées.
