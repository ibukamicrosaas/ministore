# TekkiShop — Agent-Readable Improvement Specifications

**Stack**: Next.js 15 App Router, TypeScript, Supabase, Tailwind CSS v4, Vercel, Bictorys, Twilio WhatsApp, Sentry.
**Primary color CSS var**: `var(--color-primary)` = `#0EA5E9`
**Plans** (in order): `trial` (free) → `decouverte` (2 900 FCFA) → `business` (4 900 FCFA) → `pro` (9 900 FCFA)
**Types** are auto-generated from Supabase schema in `src/types/database.ts` and re-exported from `src/types/index.ts`.
After any schema change, regenerate types with `npx supabase gen types typescript --local > src/types/database.ts`.

---

## Improvement 1 — Image de couverture (Hero) — Plan Pro uniquement

### Plan restriction
Only available to shops where `shop.plan === 'pro'`.

### DB schema changes — migration 010

File: `supabase/migrations/010_cover_and_featured.sql`

```sql
-- 1. Colonne cover_url sur shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Colonne is_featured sur products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 3. Colonnes about sur shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_photo_url TEXT;
```

(All four schema changes for improvements 1, 2, and 4 go in the same migration file `010_cover_and_featured.sql`.)

### Backend — server action

File: `src/lib/actions/settings.ts`

Add the following function after `uploadShopLogo`:

```typescript
export async function uploadShopCover(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  // Verify plan is pro
  const { data: shop } = await supabase
    .from('shops')
    .select('plan')
    .eq('id', profile.shop_id)
    .single()

  if (!shop || shop.plan !== 'pro') return { error: 'Cette fonctionnalité est réservée au plan Pro.' }

  const file = formData.get('cover') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Le fichier doit faire moins de 5 Mo.' }
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${profile.shop_id}/cover.${ext}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('shop-covers')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[uploadShopCover]', uploadError.message)
    return { error: 'Impossible de télécharger l\'image de couverture.' }
  }

  const { data: { publicUrl } } = admin.storage.from('shop-covers').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('shops')
    .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', profile.shop_id)

  if (updateError) {
    console.error('[uploadShopCover update]', updateError.message)
    return { error: 'Image téléchargée mais mise à jour échouée.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true, url: publicUrl }
}
```

Also add `uploadShopCover` to the imports in `SettingsForm.tsx`:
```typescript
import { updateShop, uploadShopLogo, uploadShopCover } from '@/lib/actions/settings'
```

### Backend — Supabase Storage bucket

Create bucket `shop-covers` (public, max file size 5 MB, allowed MIME types: `image/*`).
Run in Supabase SQL editor:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('shop-covers', 'shop-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read shop-covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-covers');

CREATE POLICY "Owners upload shop-covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shop-covers'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Owners update shop-covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'shop-covers'
    AND auth.uid() IS NOT NULL
  );
```

### Frontend — SettingsForm.tsx

File: `src/app/dashboard/settings/SettingsForm.tsx`

The component receives `shop: Shop`. Add to the component:
1. A new state: `const [coverUrl, setCoverUrl] = useState<string | null>((shop as any).cover_url ?? null)`
2. A new ref: `const coverInputRef = useRef<HTMLInputElement>(null)`
3. A new handler:
```typescript
async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  setUploadingCover(true)
  const fd = new FormData()
  fd.append('cover', file)
  const result = await uploadShopCover(fd)
  if ('error' in result) {
    toast.error(result.error ?? 'Erreur')
  } else {
    setCoverUrl(result.url ?? null)
    toast.success('Image de couverture mise à jour ✓')
  }
  setUploadingCover(false)
  if (coverInputRef.current) coverInputRef.current.value = ''
}
```

Add a new section in the JSX, BELOW the logo section and ABOVE the shop name field:

- **If** `shop.plan === 'pro'`: render the upload section.
- **Else**: render a locked card with upgrade CTA.

```tsx
{/* Image de couverture — Pro only */}
{shop.plan === 'pro' ? (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Image de couverture</label>
    <p className="text-xs text-gray-500 mb-3">
      Apparaît en haut de votre boutique publique. Format recommandé : 1400×500 px, max 5 Mo.
    </p>
    <div className="relative w-full aspect-[21/7] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
      {coverUrl ? (
        <img src={coverUrl} alt="Couverture" className="w-full h-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-400 text-sm">
          Aucune image de couverture
        </div>
      )}
      <button
        type="button"
        onClick={() => coverInputRef.current?.click()}
        disabled={uploadingCover}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/90 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white shadow-sm transition-colors disabled:opacity-50"
      >
        <Camera className="h-3.5 w-3.5" />
        {uploadingCover ? 'Envoi...' : 'Changer'}
      </button>
    </div>
    <input
      ref={coverInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleCoverChange}
    />
  </div>
) : (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-sm font-medium text-gray-900">Image de couverture</p>
    <p className="text-xs text-gray-500 mt-1 mb-3">
      Ajoutez une belle bannière en haut de votre boutique pour attirer l'attention.
    </p>
    <a
      href="/dashboard/upgrade"
      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
    >
      Passer au plan Pro pour déverrouiller
    </a>
  </div>
)}
```

### Frontend — Public shop page

File: `src/app/[shop-slug]/page.tsx`

1. Update the Supabase select query to also fetch `cover_url` and `plan`:
```typescript
const { data: shopData } = await supabase
  .from('shops')
  .select('id, name, description, logo_url, primary_color, city, phone_whatsapp, available_days, delivery_options, cover_url, plan')
  .eq('slug', slug)
  .eq('is_active', true)
  .single()
```

2. Update the `Pick<Shop, ...>` type annotation to include `'cover_url' | 'plan'`.

3. Add the hero image BEFORE the `<header>` section (the very first element inside `<div className="max-w-lg mx-auto">`):

```tsx
{/* Hero cover image — Pro only */}
{shop.plan === 'pro' && (shop as any).cover_url && (
  <div className="relative w-full aspect-[16/7] md:aspect-[21/7] overflow-hidden">
    <img
      src={(shop as any).cover_url}
      alt={`${shop.name} — couverture`}
      className="w-full h-full object-cover"
    />
    {shop.logo_url && (
      <div className="absolute bottom-3 left-4">
        <img
          src={shop.logo_url}
          alt={shop.name}
          className="h-14 w-14 rounded-xl object-cover ring-2 ring-white shadow-md"
        />
      </div>
    )}
  </div>
)}
```

When the hero is shown, the logo inside `<header>` should be hidden to avoid duplication. Wrap the header logo with a conditional: `{!(shop.plan === 'pro' && (shop as any).cover_url) && shop.logo_url && ( <img ... /> )}`.

---

## Improvement 2 — Produit mis en avant ("Coup de cœur") — Plans Business et Pro

### Plan restriction
Only available to shops where `shop.plan === 'business' || shop.plan === 'pro'`.

### DB schema changes
Already covered in migration `010_cover_and_featured.sql` above:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
```

### Backend — products.ts server actions

File: `src/lib/actions/products.ts`

In `UpdateProductInput` (in `src/types/index.ts`), add:
```typescript
is_featured?: boolean
```

In `updateProduct` server action, ensure `is_featured` is passed through to the update payload when it is defined in the input. No other changes needed — the existing `updateProduct` should already spread the input.

Also in `createProduct`, ensure `is_featured` is included from `CreateProductInput`:
Add `is_featured?: boolean` to `CreateProductInput` in `src/types/index.ts`.

### Frontend — ProductForm component

File: `src/components/dashboard/ProductForm.tsx`

The `ProductForm` currently does not receive the shop plan. It needs to receive it as a prop.

1. Add `shopPlan?: string` to `ProductFormProps`.
2. Add state: `const [isFeatured, setIsFeatured] = useState<boolean>((product as any)?.is_featured ?? false)`
3. Add a UI toggle BELOW the stock/deposit section, but only when `shopPlan === 'business' || shopPlan === 'pro'`:

```tsx
{(shopPlan === 'business' || shopPlan === 'pro') && (
  <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
    <input
      id="is_featured"
      type="checkbox"
      checked={isFeatured}
      onChange={(e) => setIsFeatured(e.target.checked)}
      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
    />
    <div>
      <label htmlFor="is_featured" className="text-sm font-medium text-gray-900 cursor-pointer">
        Mettre en avant (Coup de cœur)
      </label>
      <p className="text-xs text-gray-500 mt-0.5">
        Ce produit apparaîtra en position mise en avant en haut de votre boutique.
        Un seul produit peut être mis en avant à la fois.
      </p>
    </div>
  </div>
)}
```

4. In the `handleSubmit` function, include `is_featured: isFeatured` in the input passed to `createProduct` / `updateProduct`.

### Passing shop plan to ProductForm

File: `src/app/dashboard/products/new/page.tsx`

Fetch the shop plan server-side and pass it to `<ProductForm shopPlan={shop.plan} />`:
```typescript
// After fetching profile, also fetch shop plan:
const { data: shopData } = await supabase
  .from('shops')
  .select('plan')
  .eq('id', profile.shop_id)
  .single()
const shopPlan = (shopData as { plan: string } | null)?.plan ?? 'trial'
// Then:
<ProductForm shopPlan={shopPlan} />
```

File: `src/app/dashboard/products/[id]/page.tsx`

Same pattern — fetch `shopPlan` and pass `<ProductForm product={data as Product} shopPlan={shopPlan} />`.

### Frontend — Public shop page

File: `src/app/[shop-slug]/page.tsx`

1. Update the products query to also fetch `is_featured`:
```typescript
const { data: productsData } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shop.id)
  .eq('is_active', true)
  .order('display_order', { ascending: true })
  .order('created_at', { ascending: true })
```
(Already selects `*` so `is_featured` is included automatically once the column exists.)

2. Find the featured product: `const featuredProduct = (shop.plan === 'business' || shop.plan === 'pro') ? products.find(p => (p as any).is_featured === true) ?? null : null`

3. Render the "Coup de cœur" section ABOVE the `<ProductGrid>` call but inside the main container:

```tsx
{featuredProduct && (() => {
  const photo = /* use the getPrimaryPhoto logic inline or import a helper */
    Array.isArray(featuredProduct.photos) && (featuredProduct.photos as any[]).length > 0
      ? ((featuredProduct.photos as any[]).find((p: any) => p.is_primary)?.url ?? (featuredProduct.photos as any[])[0]?.url)
      : featuredProduct.photo_url

  const price = (() => {
    const variants = featuredProduct.variants as { label: string; price: number }[] | null
    if (variants && variants.length > 0) {
      const min = Math.min(...variants.map(v => v.price))
      return `À partir de ${min.toLocaleString('fr-FR')} FCFA`
    }
    return `${featuredProduct.price.toLocaleString('fr-FR')} FCFA`
  })()

  return (
    <div className="px-4 pb-4">
      <p className="text-xs font-bold tracking-widest mb-3" style={{ color }}>⭐ COUP DE CŒUR</p>
      <Link
        href={`/${slug}/produit/${featuredProduct.id}`}
        className="flex gap-4 rounded-2xl bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow active:scale-[0.99]"
      >
        {photo ? (
          <img
            src={photo}
            alt={featuredProduct.name}
            className="h-36 w-36 shrink-0 object-cover"
          />
        ) : (
          <div className="flex h-36 w-36 shrink-0 items-center justify-center bg-gray-100">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
        )}
        <div className="flex flex-col justify-center py-4 pr-4 flex-1 min-w-0">
          <p className="text-base font-bold text-gray-900 leading-snug line-clamp-2">{featuredProduct.name}</p>
          {featuredProduct.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{featuredProduct.description}</p>
          )}
          <p className="mt-2 text-sm font-bold" style={{ color }}>{price}</p>
          <span
            className="mt-3 inline-block self-start rounded-xl px-4 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            Voir le produit
          </span>
        </div>
      </Link>
    </div>
  )
})()}
```

Make sure `Package` is imported from `lucide-react` (it already is in the existing file, but verify).

---

## Improvement 3 — Partage WhatsApp depuis la page produit — Tous plans

### Plan restriction
Available on all plans.

### Frontend — Product detail page

File: `src/app/[shop-slug]/produit/[id]/page.tsx`

Inside the fixed CTA bar at the bottom of the page (the `<div className="fixed bottom-0 ...">` block), add a "Partager sur WhatsApp" button BELOW the existing "Commander ce produit" `<Link>`:

```tsx
{/* WhatsApp share button */}
{(() => {
  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${slug}/produit/${product.id}`
  const waText = encodeURIComponent(`Regarde ce produit : ${product.name} ${productUrl}`)
  return (
    <a
      href={`https://wa.me/?text=${waText}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#25D366] bg-white py-3.5 text-sm font-semibold text-[#25D366] shadow-sm transition-opacity hover:opacity-80 mt-2"
    >
      {/* WhatsApp SVG icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
      Partager sur WhatsApp
    </a>
  )
})()}
```

Import `APP_URL` from `@/constants` if needed, or use `process.env.NEXT_PUBLIC_APP_URL`. Check how `APP_URL` is defined in the existing codebase at `src/constants/index.ts` and use the same constant. In the product detail page, the slug comes from `params['shop-slug']` and product id from `params.id` — both are already in scope.

---

## Improvement 4 — Section "À propos" enrichie — Plans Business et Pro

### Plan restriction
Only available to shops where `shop.plan === 'business' || shop.plan === 'pro'`.

### DB schema changes
Already covered in migration `010_cover_and_featured.sql`:
```sql
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_photo_url TEXT;
```

### Backend — server action

File: `src/lib/actions/settings.ts`

Add a new server action `uploadShopAboutPhoto` (follows the same pattern as `uploadShopLogo`):
```typescript
export async function uploadShopAboutPhoto(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  const { data: shop } = await supabase.from('shops').select('plan').eq('id', profile.shop_id).single()
  if (!shop || (shop.plan !== 'business' && shop.plan !== 'pro')) {
    return { error: 'Cette fonctionnalité est réservée aux plans Business et Pro.' }
  }

  const file = formData.get('about_photo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Le fichier doit faire moins de 2 Mo.' }
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${profile.shop_id}/about.${ext}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('shop-logos')  // Reuse existing shop-logos bucket
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[uploadShopAboutPhoto]', uploadError.message)
    return { error: 'Impossible de télécharger la photo.' }
  }

  const { data: { publicUrl } } = admin.storage.from('shop-logos').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('shops')
    .update({ about_photo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', profile.shop_id)

  if (updateError) return { error: 'Photo téléchargée mais mise à jour échouée.' }

  revalidatePath('/dashboard/settings')
  return { success: true, url: publicUrl }
}
```

Also update `updateShop` to accept `about_text`:
- In `src/types/index.ts`, add `about_text?: string | null` to `UpdateShopInput`.
- In the `updateShop` function body, include `about_text` in the update payload when it is present in the input.

### Frontend — SettingsForm.tsx

File: `src/app/dashboard/settings/SettingsForm.tsx`

1. Import `uploadShopAboutPhoto` from settings actions.
2. Add states:
```typescript
const [aboutText, setAboutText] = useState<string>((shop as any).about_text ?? '')
const [aboutPhotoUrl, setAboutPhotoUrl] = useState<string | null>((shop as any).about_photo_url ?? null)
const [uploadingAboutPhoto, setUploadingAboutPhoto] = useState(false)
const aboutPhotoInputRef = useRef<HTMLInputElement>(null)
```
3. Add handler for about photo upload (mirrors logo/cover handlers, uses field name `about_photo`).
4. In `handleSubmit`, add `about_text: aboutText.trim() || null` to the `updateShop(...)` call payload.
5. Add a new form section at the bottom of the form, BEFORE the submit button, ONLY if `shop.plan === 'business' || shop.plan === 'pro'`:

```tsx
{(shop.plan === 'business' || shop.plan === 'pro') && (
  <div className="space-y-4 rounded-xl border border-gray-200 p-4">
    <div>
      <p className="text-sm font-semibold text-gray-900">À propos de la boutique</p>
      <p className="text-xs text-gray-500 mt-0.5">Ces informations apparaissent en bas de votre boutique publique.</p>
    </div>

    {/* About text */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description "À propos"</label>
      <textarea
        value={aboutText}
        onChange={(e) => setAboutText(e.target.value.slice(0, 500))}
        rows={4}
        maxLength={500}
        placeholder="Présentez votre boutique, votre histoire, vos valeurs..."
        className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
      />
      <p className="text-right text-xs text-gray-400 mt-1">{aboutText.length}/500</p>
    </div>

    {/* About photo */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Photo "À propos" (optionnelle)</label>
      <div className="flex items-center gap-3">
        {aboutPhotoUrl ? (
          <img src={aboutPhotoUrl} alt="À propos" className="h-16 w-16 rounded-xl object-cover border border-gray-200" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 border border-dashed border-gray-300">
            <Camera className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <button
          type="button"
          onClick={() => aboutPhotoInputRef.current?.click()}
          disabled={uploadingAboutPhoto}
          className="text-xs font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
        >
          {uploadingAboutPhoto ? 'Envoi...' : aboutPhotoUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
      </div>
      <input
        ref={aboutPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setUploadingAboutPhoto(true)
          const fd = new FormData()
          fd.append('about_photo', file)
          const result = await uploadShopAboutPhoto(fd)
          if ('error' in result) toast.error(result.error ?? 'Erreur')
          else { setAboutPhotoUrl(result.url ?? null); toast.success('Photo mise à jour ✓') }
          setUploadingAboutPhoto(false)
          if (aboutPhotoInputRef.current) aboutPhotoInputRef.current.value = ''
        }}
      />
    </div>
  </div>
)}
```

If the plan is NOT business/pro, show a locked card similar to the cover image locked state.

### Frontend — Public shop page

File: `src/app/[shop-slug]/page.tsx`

1. Update the Supabase select to also include `about_text, about_photo_url` (if not already selecting all columns, add them explicitly).
2. BELOW the `<ProductGrid>` component, add the "À propos" section:

```tsx
{/* À propos section */}
{(shop.plan === 'business' || shop.plan === 'pro') && (shop as any).about_text && (
  <div className="px-4 py-6 border-t border-gray-100 mx-4 mt-4">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">À propos</p>
    <div className="flex items-start gap-4">
      {(shop as any).about_photo_url && (
        <img
          src={(shop as any).about_photo_url}
          alt={`À propos de ${shop.name}`}
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      )}
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {(shop as any).about_text}
      </p>
    </div>
  </div>
)}
```

---

## Improvement 5 — Analytics dashboard — Plans Business et Pro

### Plan restriction
Only available to shops where `shop.plan === 'business' || shop.plan === 'pro'`. On lower plans, show a locked upgrade page.

### New page

File: `src/app/dashboard/analytics/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BarChart2, Lock } from 'lucide-react'
import type { Profile, Shop } from '@/types'

export const metadata = { title: 'Statistiques — TekkiShop' }

export default async function AnalyticsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles').select('shop_id').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'shop_id'> | null
  if (!profile?.shop_id) redirect('/onboarding')

  const { data: shopData } = await supabase
    .from('shops').select('plan').eq('id', profile.shop_id).single()
  const shop = shopData as Pick<Shop, 'plan'> | null

  if (!shop || (shop.plan !== 'business' && shop.plan !== 'pro')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <Lock className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Statistiques avancées</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Les statistiques détaillées sont disponibles à partir du plan Business.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Passer au plan Business
        </Link>
      </div>
    )
  }

  // Date helpers
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
  const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all data in parallel
  const [thisMonthRes, lastMonthRes, last30DaysRes, topProductsRes] = await Promise.all([
    // Orders this month
    supabase
      .from('orders')
      .select('id, total_price, status, created_at')
      .eq('shop_id', profile.shop_id)
      .gte('created_at', thisMonthStart)
      .not('status', 'eq', 'cancelled'),

    // Orders last month
    supabase
      .from('orders')
      .select('id, total_price')
      .eq('shop_id', profile.shop_id)
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd)
      .not('status', 'eq', 'cancelled'),

    // Orders last 30 days (for bar chart)
    supabase
      .from('orders')
      .select('id, created_at')
      .eq('shop_id', profile.shop_id)
      .gte('created_at', thirtyDaysAgo)
      .not('status', 'eq', 'cancelled'),

    // Top products by order_items count
    supabase
      .from('order_items')
      .select('product_id, product_name, quantity')
      .eq('shop_id', profile.shop_id),
  ])

  // Process stats
  const thisMonthOrders  = thisMonthRes.data ?? []
  const lastMonthOrders  = lastMonthRes.data ?? []
  const last30Orders     = last30DaysRes.data ?? []
  const allItems         = topProductsRes.data ?? []

  const thisMonthCount   = thisMonthOrders.length
  const lastMonthCount   = lastMonthOrders.length
  const countChange      = lastMonthCount > 0
    ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
    : thisMonthCount > 0 ? 100 : 0

  const thisMonthRevenue = thisMonthOrders
    .filter(o => o.status === 'confirmed' || o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total_price ?? 0), 0)

  // Top 3 products by total quantity ordered
  const productTotals: Record<string, { name: string; qty: number }> = {}
  for (const item of allItems) {
    if (!item.product_id) continue
    if (!productTotals[item.product_id]) {
      productTotals[item.product_id] = { name: item.product_name, qty: 0 }
    }
    productTotals[item.product_id].qty += item.quantity ?? 1
  }
  const topProducts = Object.entries(productTotals)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 3)
    .map(([, v]) => v)

  // Bar chart: orders per day over last 30 days
  // Build a map: date string → count
  const dayMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const order of last30Orders) {
    const day = order.created_at?.slice(0, 10)
    if (day && day in dayMap) dayMap[day]++
  }
  const chartData = Object.entries(dayMap).map(([date, count]) => ({ date, count }))
  const maxCount  = Math.max(...chartData.map(d => d.count), 1)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Commandes ce mois</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{thisMonthCount}</p>
          <p className={`text-xs mt-1 font-medium ${countChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {countChange >= 0 ? '+' : ''}{countChange}% vs mois dernier
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">CA confirmé ce mois</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {thisMonthRevenue.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-400 mt-1">FCFA</p>
        </div>
      </div>

      {/* Top 3 produits */}
      <div className="rounded-xl bg-white border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Top 3 produits commandés</p>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune commande pour l'instant.</p>
        ) : (
          <ol className="space-y-2">
            {topProducts.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-[var(--color-primary)]">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-800 truncate">{p.name}</span>
                <span className="text-xs font-semibold text-gray-500">{p.qty} cmdé{p.qty > 1 ? 's' : ''}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Bar chart — last 30 days */}
      <div className="rounded-xl bg-white border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-900 mb-4">Commandes — 30 derniers jours</p>
        <div className="flex items-end gap-[2px] h-24">
          {chartData.map(({ date, count }) => (
            <div
              key={date}
              title={`${date}: ${count}`}
              className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${Math.max((count / maxCount) * 100, count > 0 ? 8 : 2)}%`,
                backgroundColor: count > 0 ? 'var(--color-primary)' : '#E5E7EB',
                opacity: count > 0 ? 1 : 0.5,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">{chartData[0]?.date?.slice(5)}</span>
          <span className="text-[10px] text-gray-400">{chartData[chartData.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>
    </div>
  )
}
```

**Note on `order_items` query**: The `order_items` table may not have a `shop_id` column directly. If not, join via orders:
```typescript
supabase
  .from('order_items')
  .select('product_id, product_name, quantity, orders!inner(shop_id)')
  .eq('orders.shop_id', profile.shop_id)
```
Check the existing schema in `supabase/migrations/001_initial_schema.sql` to confirm the join column.

### Navigation — add "Statistiques" link

File: `src/components/dashboard/Sidebar.tsx`

1. Import `BarChart2` from lucide-react (add to imports).
2. Modify the `navItems` array. The items array is currently a static constant — it must become dynamic based on the shop plan. Change the approach: accept `shop` as a prop (already done) and compute `navItems` inside the component or pass a filtered list.

Current `navItems` is defined as a module-level constant. Move it inside the `Sidebar` component function body and make it conditional on plan:

```typescript
const canSeeAnalytics = shop.plan === 'business' || shop.plan === 'pro'

const navItems: NavItem[] = [
  { href: '/dashboard',            label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/orders',     label: 'Commandes',       icon: ShoppingBag },
  { href: '/dashboard/products',   label: 'Produits',        icon: Package },
  { href: '/dashboard/clients',    label: 'Clients',         icon: UserCircle },
  { href: '/dashboard/revenues',   label: 'Revenus',         icon: Wallet },
  ...(canSeeAnalytics
    ? [{ href: '/dashboard/analytics', label: 'Statistiques', icon: BarChart2 }]
    : [{ href: '/dashboard/analytics', label: 'Statistiques 🔒', icon: BarChart2 }]
  ),
  { href: '/dashboard/settings',   label: 'Paramètres',      icon: Settings },
]
```

Both plan and non-plan users see the link; the page itself handles the locked state for lower plans. This avoids an inconsistent nav. The lock icon suffix on the label is optional — alternatively add a visual badge inline in the nav item rendering.

---

## Improvement 6 — Export CSV des commandes — Plan Pro uniquement

### Plan restriction
Only available to shops where `shop.plan === 'pro'`. Returns 403 for other plans.

### New API route

File: `src/app/api/export/orders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Profile, Shop } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new NextResponse('Non authentifié', { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('profiles').select('shop_id, role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'shop_id' | 'role'> | null

  if (!profile?.shop_id || profile.role !== 'owner') {
    return new NextResponse('Accès non autorisé', { status: 403 })
  }

  const { data: shopData } = await supabase
    .from('shops').select('plan').eq('id', profile.shop_id).single()
  const shop = shopData as Pick<Shop, 'plan'> | null

  if (!shop || shop.plan !== 'pro') {
    return new NextResponse('Réservé au plan Pro', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') // YYYY-MM-DD
  const to   = searchParams.get('to')   // YYYY-MM-DD

  let query = supabase
    .from('orders')
    .select(`
      id,
      created_at,
      status,
      total_price,
      payment_type,
      payment_method,
      delivery_type,
      clients ( first_name, last_name, phone ),
      order_items ( product_name, quantity, unit_price )
    `)
    .eq('shop_id', profile.shop_id)
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`)
  if (to)   query = query.lte('created_at', `${to}T23:59:59.999Z`)

  const { data, error } = await query
  if (error) return new NextResponse('Erreur serveur', { status: 500 })

  const orders = data ?? []

  // Build CSV
  const BOM = '﻿' // UTF-8 BOM for Excel compatibility
  const headers = ['Date', 'Client', 'Téléphone', 'Produits', 'Total (FCFA)', 'Statut', 'Paiement', 'Livraison']
  const rows = orders.map(o => {
    const client = (o.clients as { first_name: string; last_name: string | null; phone: string } | null)
    const items  = (o.order_items as { product_name: string; quantity: number; unit_price: number }[] | null) ?? []
    const productsStr = items.map(i => `${i.product_name} x${i.quantity}`).join(' | ')
    const date = new Date(o.created_at).toLocaleDateString('fr-FR')

    return [
      date,
      client ? `${client.first_name} ${client.last_name ?? ''}`.trim() : '',
      client?.phone ?? '',
      productsStr,
      o.total_price?.toString() ?? '0',
      o.status,
      o.payment_type,
      o.delivery_type,
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`)
  })

  const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="commandes-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}
```

### Frontend — Orders page

File: `src/app/dashboard/orders/page.tsx`

1. The orders page currently does not fetch the shop plan. Add a query at the top to get `shop.plan`:
```typescript
const { data: shopPlanData } = await supabase
  .from('shops').select('plan').eq('id', profile.shop_id).single()
const shopPlan = (shopPlanData as { plan: string } | null)?.plan ?? 'trial'
```

2. In the JSX, in the page header (top of the page, near the title), add the export button ONLY when `shopPlan === 'pro'`:

```tsx
{shopPlan === 'pro' && (
  <a
    href={`/api/export/orders?from=${format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')}&to=${format(now, 'yyyy-MM-dd')}`}
    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
  >
    {/* Download icon from lucide */}
    <Download className="h-3.5 w-3.5" />
    Exporter CSV
  </a>
)}
```

Import `Download` from `lucide-react` (add to the existing lucide import line).
Import `format` from `date-fns` and define `now = new Date()` at the top of the component.

The default export range is the current month. The merchant can manually adjust the URL params for custom ranges if needed.

---

## Improvement 7 — Bouton de partage du lien boutique (WhatsApp) dans le dashboard

### Plan restriction
Available on ALL plans.

### Frontend — ShopLinkCard component

File: `src/components/dashboard/ShopLinkCard.tsx`

The `ShopLinkCard` component currently receives `shopSlug` and `appUrl`. It also needs the shop name for the WhatsApp message.

1. Add `shopName: string` to the `Props` interface:
```typescript
interface Props {
  shopSlug: string
  appUrl: string
  shopName: string
}
```

2. Add `shopName` to the destructured props.

3. Build the WhatsApp share URL:
```typescript
const waShareUrl = `https://wa.me/?text=${encodeURIComponent(`Commande chez ${shopName} : ${url}`)}`
```

4. Add a third button alongside "Copier le lien" and "Voir ton site". Replace the current `flex gap-2` two-button row with a three-button layout (or keep two buttons and replace one), adding:

```tsx
<a
  href={waShareUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#25D366] bg-white py-2 text-xs font-medium text-[#25D366] hover:bg-green-50 transition-colors"
>
  {/* WhatsApp icon — simple SVG */}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
  Partager
</a>
```

The three buttons may need a layout adjustment. Use `flex-col gap-2` or keep `flex gap-2` with three items — choose based on available space. A column layout with three full-width buttons is cleanest on mobile.

### Update ShopLinkCard usage

File: `src/app/dashboard/page.tsx`

Find the `<ShopLinkCard shopSlug={shop.slug} appUrl={APP_URL} />` call and add the `shopName` prop:
```tsx
<ShopLinkCard shopSlug={shop.slug} appUrl={APP_URL} shopName={shop.name} />
```

The `shopData` query on the dashboard page already selects `name` — verify that `shop.name` is available in scope at the point where `ShopLinkCard` is rendered.

---

## Cross-cutting implementation notes

### Types regeneration
After applying migration `010_cover_and_featured.sql`, run:
```bash
npx supabase gen types typescript --local > src/types/database.ts
```
This will add `cover_url`, `is_featured`, `about_text`, and `about_photo_url` to the generated types. Remove the `(shop as any).cover_url` casts and use the typed fields instead.

### Migration file ordering
Create only ONE new migration file for all schema additions in improvements 1, 2, and 4:
```
supabase/migrations/010_cover_and_featured.sql
```
Contents:
```sql
-- Migration 010: Cover image, featured products, about section
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_photo_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
```

### Supabase Storage
The `shop-covers` bucket must be created (see Improvement 1 for the SQL). The `shop-logos` bucket is reused for about photos.

### Environment variables
`NEXT_PUBLIC_APP_URL` must be set in `.env.local` and in Vercel environment variables. It is used for generating product share URLs in Improvement 3. Verify it is already set — check `src/constants/index.ts` for `APP_URL`.

### Plan checks — never trust client-side only
All plan-gated features MUST be verified server-side (in server actions and API routes), not only in the UI. The UI gates are for UX only.

### Lucide icons used across improvements
New icons needed (add to existing imports):
- `BarChart2` — analytics nav item
- `Download` — CSV export button
- `Lock` — locked analytics page

---

## Implementation order (recommended)

1. Apply migration `010_cover_and_featured.sql` and regenerate types.
2. Create `shop-covers` storage bucket.
3. Implement Improvement 7 (WhatsApp share — simplest, no schema changes).
4. Implement Improvement 3 (WhatsApp product share — no schema changes).
5. Implement Improvement 1 (Cover image — schema + action + settings UI + public page).
6. Implement Improvement 2 (Featured product — schema + form UI + public page).
7. Implement Improvement 4 (About section — schema + action + settings UI + public page).
8. Implement Improvement 5 (Analytics page + nav link).
9. Implement Improvement 6 (CSV export route + orders page button).
