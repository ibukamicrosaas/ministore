import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { VitrineProductPage } from '@/components/vitrine/VitrineProductPage'
import type { Shop, Product } from '@/types'
import { APP_URL } from '@/constants'
import { safeJsonLdString } from '@/lib/utils/json-ld'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import type { Metadata } from 'next'
import { withEffectiveVariants } from '@/lib/products/effective-variants'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string; id: string }> }

// Aucune directive metadata.robots existante sur preview/[slug]/page.tsx non
// plus (signalé au tour précédent, pas corrigé ici — hors périmètre) ; ajoutée
// ici par hygiène puisque c'est un fichier neuf.
export const metadata: Metadata = { robots: { index: false, follow: false } }

async function loadShopAndProductForOwner(slug: string, id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawShop } = await (supabase as any)
    .from('shops')
    .select('id, name, description, logo_url, primary_color, city, address, phone_whatsapp, available_days, delivery_options, delivery_zones, country, target_countries, accept_cash_on_delivery, accept_online_payment, stripe_connect_enabled, plan, currency, cover_image_url, social_links, product_layout, is_active')
    .eq('slug', slug)
    .single()

  if (!rawShop) notFound()
  // Même vérification de propriété que preview/[slug]/page.tsx:49 — un
  // propriétaire ne peut prévisualiser que sa propre boutique.
  if (rawShop.id !== profile.shop_id) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product } = await (supabase as any)
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('shop_id', rawShop.id)
    .single()

  if (!product) notFound()

  const admin = createAdminClient()
  const { data: related } = await admin
    .from('products')
    .select('*')
    .eq('shop_id', rawShop.id)
    .eq('is_active', true)
    .neq('id', product.id)
    .or('stock_count.is.null,stock_count.gt.0')
    .order('display_order', { ascending: true })
    .limit(4)

  // Même garde-fou que Classique (produit/[id]/page.tsx:216-217) : le prix barré
  // n'est pas affiché pour un produit avec variantes (son prix dépend de la
  // variante choisie). Lecture seule, n'écrit rien en base.
  const [productWithVariants] = await withEffectiveVariants(admin, [product])

  return { shop: rawShop as Shop, product: productWithVariants as Product & { slug?: string | null }, related: (related ?? []) as Product[] }
}

export default async function PreviewProductPage({ params }: Props) {
  const { slug, id } = await params
  const { shop, product, related } = await loadShopAndProductForOwner(slug, id)

  const currency = ((shop as unknown as { currency?: string }).currency ?? 'XOF') as ShopCurrency
  const publicUrl = `${APP_URL}/${slug}/produit/${product.slug ?? product.id}`

  // JSON-LD Product — repris à l'identique de src/app/[shop-slug]/produit/[id]/page.tsx:260-276
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.photo_url ?? undefined,
    url: publicUrl,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: currency,
      availability: product.stock_count === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: publicUrl,
      seller: { '@type': 'Organization', name: shop.name },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }} />
      <link rel="canonical" href={publicUrl} />

      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Eye className="h-4 w-4 shrink-0" />
          Mode prévisualisation (Vitrine) — seul vous pouvez voir cette page
        </div>
        <Link href={`/preview/${slug}`} className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          Retour à la boutique
        </Link>
      </div>

      <VitrineProductPage
        shop={shop}
        product={product}
        relatedProducts={related}
        shopSlug={slug}
        basePath={`/preview/${slug}`}
        homeHref={`/preview/${slug}?vitrine=1`}
        previewMode
      />
    </div>
  )
}
