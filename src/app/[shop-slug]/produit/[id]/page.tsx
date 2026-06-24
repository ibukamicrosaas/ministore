import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'
import type { Shop, Product, ProductPhoto, ProductVariant } from '@/types'
import { ShareButton } from '@/components/pwa/ShareButton'
import { PixelViewContent, ProductCtaButton } from './ProductPixelEvents'
import { StockAlertForm } from '@/components/pwa/StockAlertForm'
import { APP_URL } from '@/constants'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { getShopBasePath } from '@/lib/utils/custom-domain'

export const revalidate = 60
import type { Metadata } from 'next'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import { ProductGallery } from '@/components/pwa/ProductGallery'

type Props = { params: Promise<{ 'shop-slug': string; id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function fetchShopAndProduct(shopSlug: string, id: string) {
  const supabase = await createServerClient()

  const shopRes = await supabase
    .from('shops')
    .select('id, name, primary_color, plan, currency')
    .eq('slug', shopSlug)
    .single()

  if (!shopRes.data) return { shop: null, product: null }

  const shopId = shopRes.data.id
  const isUUID = UUID_REGEX.test(id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = supabase.from('products') as any
  const productRes = isUUID
    ? await table.select('*').eq('id', id).eq('shop_id', shopId).eq('is_active', true).single()
    : await table.select('*').eq('slug', id).eq('shop_id', shopId).eq('is_active', true).single()

  return { shop: shopRes.data, product: (productRes.data ?? null) as (Product & { slug?: string | null }) | null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'shop-slug': shopSlug, id } = await params
  const { shop, product } = await fetchShopAndProduct(shopSlug, id)

  if (!product || !shop) return {}

  const p         = product as Product & { slug?: string | null; meta_title?: string | null; meta_description?: string | null }
  const photos    = Array.isArray(p.photos) ? (p.photos as unknown as ProductPhoto[]) : []
  const primary   = photos.find(ph => ph.is_primary)?.url ?? photos[0]?.url ?? p.photo_url ?? null
  const canonical = `${APP_URL}/${shopSlug}/produit/${p.slug ?? id}`
  const title     = p.meta_title || p.name
  const desc      = p.meta_description || p.description || `${p.name} — ${shop.name}`
  const ogImage   = primary
    ? { url: primary, width: 800, height: 800, alt: p.name }
    : { url: `${APP_URL}/og-ministore.png`, width: 1200, height: 630, alt: p.name }

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      siteName: shop.name,
      images: [ogImage],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImage.url],
    },
  }
}

// Rendu enrichi de la description pour les boutiques Pro.
function renderProDescription(text: string) {
  const IMAGE_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = IMAGE_REGEX.exec(text)) !== null) {
    const [full, alt, url] = match
    if (match.index > last) {
      const chunk = text.slice(last, match.index).trim()
      if (chunk) {
        parts.push(
          <p key={last} className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{chunk}</p>
        )
      }
    }
    parts.push(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={match.index}
        src={url}
        alt={alt || 'Image'}
        className="w-full rounded-2xl object-cover my-3"
        loading="lazy"
      />
    )
    last = match.index + full.length
  }

  const tail = text.slice(last).trim()
  if (tail) {
    parts.push(
      <p key={last} className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{tail}</p>
    )
  }

  return <div className="space-y-1">{parts}</div>
}

export default async function ProductDetailPage({ params }: Props) {
  const { 'shop-slug': shopSlug, id } = await params
  const { shop: shopData, product: productData } = await fetchShopAndProduct(shopSlug, id)

  if (!shopData || !productData) notFound()

  const shop    = shopData as Pick<Shop, 'id' | 'name' | 'primary_color'> & { plan?: string; currency?: string | null }
  const product = productData as Product & { slug?: string | null }

  // 308 permanent redirect: UUID in URL but product now has a slug
  if (UUID_REGEX.test(id) && product.slug) {
    permanentRedirect(`/${shopSlug}/produit/${product.slug}`)
  }

  const soldOut       = product.stock_count === 0
  const color         = shop.primary_color ?? '#0EA5E9'
  const currency      = (shop.currency ?? 'XOF') as ShopCurrency
  const deliveryDelay = (product as Product & { delivery_delay?: string | null }).delivery_delay ?? null

  const rawPhotos = Array.isArray(product.photos) && (product.photos as unknown as ProductPhoto[]).length > 0
    ? (product.photos as unknown as ProductPhoto[])
    : product.photo_url
    ? [{ url: product.photo_url, is_primary: true }]
    : []
  // La photo principale doit toujours apparaître en premier dans la galerie
  const photos = [...rawPhotos].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  const primaryPhoto = photos.find(p => p.is_primary)?.url ?? photos[0]?.url ?? null
  const variants     = product.variants as ProductVariant[] | null
  const videoUrl     = (product as Product & { video_url?: string | null }).video_url ?? null
  const embedUrl     = videoUrl ? getVideoEmbedUrl(videoUrl) : null
  const isPortrait   = (product as Product & { image_ratio?: string | null }).image_ratio === 'portrait'

  const displayPrice = variants && variants.length > 0
    ? `À partir de ${formatPrice(Math.min(...variants.map(v => v.price)), currency)}`
    : formatPrice(product.price, currency)

  const basePath = await getShopBasePath(shopSlug)

  // Compteur de ventes — preuve sociale (server-side, admin client)
  const admin = createAdminClient()
  const { count: rawSalesCount } = await admin
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', product.id)
  const salesCount = rawSalesCount ?? 0

  const publicUrl = `${APP_URL}/${shopSlug}/produit/${product.slug ?? product.id}`

  // JSON-LD : Product schema pour le SEO Google Shopping
  const minPrice = variants?.length ? Math.min(...variants.map(v => v.price)) : product.price
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: primaryPhoto ?? undefined,
    url: publicUrl,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: minPrice,
      priceCurrency: currency,
      availability: soldOut
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: publicUrl,
      seller: { '@type': 'Organization', name: shop.name },
    },
  }

  return (
    <div className="max-w-lg mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PixelViewContent
        productId={product.id}
        productName={product.name}
        price={product.price}
      />
      {/* Galerie */}
      <div className="relative">
        <ProductGallery
          photos={photos}
          videoEmbedUrl={embedUrl}
          productName={product.name}
          primaryColor={color}
          isPortrait={isPortrait}
        />

        <Link
          href={basePath || '/'}
          className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white hover:bg-black/50 transition-colors z-10"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {shop.name}
        </Link>

        <div className="absolute top-4 right-4 z-10">
          <ShareButton
            url={publicUrl}
            title={product.name}
            text={product.description ?? `${product.name} — ${displayPrice}`}
            primaryColor={color}
          />
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white px-5 pt-5 pb-36">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>

        {salesCount >= 3 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${color}15`, color }}>
            🔥 {salesCount} personnes ont déjà commandé
          </div>
        )}

        {variants && variants.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Variantes & prix</p>
            {variants.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: `${color}12` }}
              >
                <span className="text-sm font-medium text-gray-800">{v.label}</span>
                <span className="text-sm font-bold" style={{ color }}>{formatPrice(v.price, currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-2xl font-bold" style={{ color }}>{displayPrice}</p>
        )}

        {deliveryDelay && (
          <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: `${color}12` }}>
            <Clock className="h-4 w-4 shrink-0" style={{ color }} />
            <p className="text-sm font-medium text-gray-700">
              Livraison estimée : <span className="font-bold" style={{ color }}>{deliveryDelay}</span>
            </p>
          </div>
        )}

        {product.description && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Description</p>
            {shop.plan === 'pro'
              ? renderProDescription(product.description)
              : <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            }
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent max-w-lg mx-auto">
        {soldOut ? (
          <div className="space-y-2">
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-gray-400 bg-gray-100 cursor-not-allowed">
              Rupture de stock
            </div>
            <StockAlertForm productId={product.id} primaryColor={color} />
          </div>
        ) : (
          <ProductCtaButton
            href={`${basePath}/commander?product=${product.id}`}
            color={color}
            productId={product.id}
            productName={product.name}
            price={product.price}
            displayPrice={displayPrice}
          />
        )}
      </div>
    </div>
  )
}
