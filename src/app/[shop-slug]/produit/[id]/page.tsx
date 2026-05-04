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

  const variants    = product.variants as ProductVariant[] | null
  const videoUrl    = (product as Product & { video_url?: string | null }).video_url ?? null
  const embedUrl    = videoUrl ? getVideoEmbedUrl(videoUrl) : null

  const displayPrice = variants && variants.length > 0
    ? `À partir de ${Math.min(...variants.map(v => v.price)).toLocaleString('fr-FR')} FCFA`
    : `${product.price.toLocaleString('fr-FR')} FCFA`

  return (
    <div className="max-w-lg mx-auto">
      {/* Back */}
      <div className="px-4 pt-4">
        <Link
          href={`/${slug}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {shop.name}
        </Link>
      </div>

      {/* Vidéo du produit */}
      {embedUrl && (
        <div className="mt-3 px-4">
          <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-sm" style={{ paddingBottom: '177.78%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              title={`Vidéo — ${product.name}`}
            />
          </div>
        </div>
      )}

      {/* Galerie photos */}
      {!embedUrl && photos.length > 0 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
          {photos.map((photo, i) => (
            <img
              key={i}
              src={photo.url}
              alt={`${product.name} ${i + 1}`}
              className="h-72 w-64 shrink-0 snap-center rounded-2xl object-cover shadow-sm"
            />
          ))}
        </div>
      ) : !embedUrl ? (
        <div className="mt-3 mx-4 flex h-64 items-center justify-center rounded-2xl bg-gray-100">
          <Package className="h-14 w-14 text-gray-300" />
        </div>
      ) : photos.length > 0 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
          {photos.map((photo, i) => (
            <img
              key={i}
              src={photo.url}
              alt={`${product.name} ${i + 1}`}
              className="h-24 w-24 shrink-0 snap-center rounded-xl object-cover shadow-sm"
            />
          ))}
        </div>
      ) : null}

      {/* Infos */}
      <div className="px-4 mt-5 pb-32">
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

        {/* Prix */}
        {variants && variants.length > 0 ? (
          <div className="mt-3 space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
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
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}
      </div>

      {/* CTA fixé en bas */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-gray-50 to-transparent max-w-lg mx-auto">
        <Link
          href={`/${slug}/commander?product=${product.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          <ShoppingBag className="h-5 w-5" />
          Commander ce produit
        </Link>
      </div>
    </div>
  )
}
