import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShoppingBag } from 'lucide-react'
import type { Shop, Product, ProductPhoto, ProductVariant } from '@/types'
import { ShareButton } from '@/components/pwa/ShareButton'
import { APP_URL } from '@/constants'

export const revalidate = 60
import type { Metadata } from 'next'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import { ProductGallery } from '@/components/pwa/ProductGallery'

type Props = { params: Promise<{ 'shop-slug': string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'shop-slug': slug, id } = await params
  const supabase = await createServerClient()

  const [productRes, shopRes] = await Promise.all([
    supabase.from('products').select('name, description, photo_url, photos').eq('id', id).single(),
    supabase.from('shops').select('name').eq('slug', slug).single(),
  ])

  if (!productRes.data) return {}
  const p        = productRes.data as Pick<Product, 'name' | 'description' | 'photo_url' | 'photos'>
  const shopName = (shopRes.data as { name: string } | null)?.name ?? ''

  const photos      = Array.isArray(p.photos) ? (p.photos as unknown as ProductPhoto[]) : []
  const primaryPhoto = photos.find(ph => ph.is_primary)?.url ?? photos[0]?.url ?? p.photo_url ?? null

  const url  = `${APP_URL}/${slug}/produit/${id}`
  const desc = p.description ?? `${p.name}${shopName ? ` — ${shopName}` : ''}`
  const ogImage = primaryPhoto
    ? { url: primaryPhoto, width: 800, height: 800, alt: p.name }
    : { url: `${APP_URL}/og-ministore.png`, width: 1200, height: 630, alt: p.name }

  return {
    title: p.name,
    description: desc,
    openGraph: {
      title: p.name,
      description: desc,
      url,
      siteName: shopName,
      images: [ogImage],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: p.name,
      description: desc,
      images: [ogImage.url],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { 'shop-slug': slug, id } = await params
  const supabase = await createServerClient()

  const [shopRes, productRes] = await Promise.all([
    supabase.from('shops').select('id, name, primary_color').eq('slug', slug).eq('is_active', true).single(),
    supabase.from('products').select('*').eq('id', id).eq('is_active', true).single(),
  ])

  if (!shopRes.data || !productRes.data) notFound()

  const shop    = shopRes.data as Pick<Shop, 'id' | 'name' | 'primary_color'>
  const product = productRes.data as Product
  const soldOut = product.stock_count === 0
  const color   = shop.primary_color ?? '#0EA5E9'

  const photos = Array.isArray(product.photos) && (product.photos as unknown as ProductPhoto[]).length > 0
    ? (product.photos as unknown as ProductPhoto[])
    : product.photo_url
    ? [{ url: product.photo_url, is_primary: true }]
    : []

  const primaryPhoto = photos.find(p => p.is_primary)?.url ?? photos[0]?.url ?? null
  const variants     = product.variants as ProductVariant[] | null
  const videoUrl     = (product as Product & { video_url?: string | null }).video_url ?? null
  const embedUrl     = videoUrl ? getVideoEmbedUrl(videoUrl) : null
  const isPortrait   = (product as Product & { image_ratio?: string | null }).image_ratio === 'portrait'

  const displayPrice = variants && variants.length > 0
    ? `À partir de ${Math.min(...variants.map(v => v.price)).toLocaleString('fr-FR')} FCFA`
    : `${product.price.toLocaleString('fr-FR')} FCFA`

  return (
    <div className="max-w-lg mx-auto">
      {/* Galerie — photos + modal vidéo */}
      <div className="relative">
        <ProductGallery
          photos={photos}
          videoEmbedUrl={embedUrl}
          productName={product.name}
          primaryColor={color}
          isPortrait={isPortrait}
        />

        {/* Floating back button */}
        <Link
          href={`/${slug}`}
          className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white hover:bg-black/50 transition-colors z-10"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {shop.name}
        </Link>

        {/* Share button */}
        <div className="absolute top-4 right-4 z-10">
          <ShareButton
            url={`${APP_URL}/${slug}/produit/${product.id}`}
            title={product.name}
            text={product.description ?? `${product.name} — ${displayPrice}`}
            primaryColor={color}
          />
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white px-5 pt-5 pb-36">
        {/* Name + price */}
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>

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
                <span className="text-sm font-bold" style={{ color }}>{v.price.toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-2xl font-bold" style={{ color }}>{displayPrice}</p>
        )}

        {/* Description */}
        {product.description && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* Category badge */}
        {product.category && (
          <div className="mt-4">
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent max-w-lg mx-auto">
        {soldOut ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-gray-400 bg-gray-100 cursor-not-allowed">
            Rupture de stock
          </div>
        ) : (
          <Link
            href={`/${slug}/commander?product=${product.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <ShoppingBag className="h-5 w-5" />
            Je le prends
          </Link>
        )}
      </div>
    </div>
  )
}
