import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShoppingBag, Package } from 'lucide-react'
import type { Shop, Product, ProductPhoto, ProductVariant } from '@/types'
import type { Metadata } from 'next'
import { getVideoEmbedUrl } from '@/lib/utils/video'

type Props = { params: Promise<{ 'shop-slug': string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase.from('products').select('name, description').eq('id', id).single()
  if (!data) return {}
  const p = data as Pick<Product, 'name' | 'description'>
  return { title: p.name, description: p.description ?? undefined }
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
      {/* Hero photo — full bleed */}
      <div className="relative">
        {embedUrl ? (
          <div className="relative w-full overflow-hidden bg-black" style={{ paddingBottom: '100%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              title={`Vidéo — ${product.name}`}
            />
          </div>
        ) : primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={product.name}
            className={`w-full object-cover ${isPortrait ? 'aspect-[3/4]' : 'aspect-square'}`}
            style={{ maxHeight: 480 }}
          />
        ) : (
          <div className="flex w-full aspect-square items-center justify-center bg-gray-100">
            <Package className="h-20 w-20 text-gray-300" />
          </div>
        )}

        {/* Floating back button */}
        <Link
          href={`/${slug}`}
          className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white hover:bg-black/50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {shop.name}
        </Link>
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide bg-white">
          {photos.map((photo, i) => (
            <img
              key={i}
              src={photo.url}
              alt={`${product.name} ${i + 1}`}
              className="h-16 w-16 shrink-0 rounded-xl object-cover border-2"
              style={{ borderColor: photo.is_primary ? color : 'transparent' }}
            />
          ))}
        </div>
      )}

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
        <Link
          href={`/${slug}/commander?product=${product.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          <ShoppingBag className="h-5 w-5" />
          Commander ce produit
        </Link>
      </div>
    </div>
  )
}
