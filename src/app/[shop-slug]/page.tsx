import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MessageCircle, MapPin, ShoppingBag } from 'lucide-react'
import { ProductGrid } from '@/components/pwa/ProductGrid'
import { ShareButton } from '@/components/pwa/ShareButton'
import { ShopBusinessLayout } from '@/components/pwa/ShopBusinessLayout'
import type { Shop, Product } from '@/types'
import { APP_URL } from '@/constants'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { getShopBasePath } from '@/lib/utils/custom-domain'

export const revalidate = 60
import type { Metadata } from 'next'

type Props = { params: Promise<{ 'shop-slug': string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('shops')
    .select('name, description, logo_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (!data) return {}

  const shop = data as Pick<Shop, 'name' | 'description' | 'logo_url'>
  const url  = `${APP_URL}/${slug}`
  const desc = shop.description ?? `Boutique ${shop.name} — commandez en ligne`
  const ogImage = shop.logo_url
    ? { url: shop.logo_url, width: 400, height: 400, alt: shop.name }
    : { url: `${APP_URL}/og-ministore.png`, width: 1200, height: 630, alt: shop.name }

  return {
    title: shop.name,
    description: desc,
    openGraph: {
      title: shop.name,
      description: desc,
      url,
      siteName: shop.name,
      images: [ogImage],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: shop.logo_url ? 'summary' : 'summary_large_image',
      title: shop.name,
      description: desc,
      images: [ogImage.url],
    },
  }
}

export default async function ShopPage({ params }: Props) {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerClient()

  const { data: shopData } = await supabase
    .from('shops')
    .select('id, name, description, logo_url, primary_color, city, address, phone_whatsapp, available_days, delivery_options, plan, currency, cover_image_url, about_photo_url, business_category, badges, social_links, product_layout')
    .eq('slug', slug)
    .single()

  if (!shopData) notFound()
  const shop     = shopData as unknown as Shop & { currency?: string | null; product_layout?: 'list' | 'grid' | null }
  const color    = shop.primary_color ?? '#0EA5E9'
  const currency = (shop.currency ?? 'XOF') as ShopCurrency

  if (shop.plan === 'pro') {
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .or('stock_count.is.null,stock_count.gt.0')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    const products = (productsData ?? []) as Product[]
    return <ShopBusinessLayout shop={shop} products={products} shopSlug={slug} />
  }

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .or('stock_count.is.null,stock_count.gt.0')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  const products = (productsData ?? []) as Product[]

  const waLink = shop.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`
    : null
  const basePath = await getShopBasePath(slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description ?? undefined,
    url: `${APP_URL}/${slug}`,
    logo: shop.logo_url ?? undefined,
    image: shop.logo_url ?? undefined,
    telephone: shop.phone_whatsapp ?? undefined,
    address: shop.address ? {
      '@type': 'PostalAddress',
      streetAddress: shop.address,
      addressLocality: shop.city ?? undefined,
    } : undefined,
    hasOfferCatalog: products.length > 0 ? {
      '@type': 'OfferCatalog',
      name: `Produits ${shop.name}`,
      numberOfItems: products.length,
    } : undefined,
  }

  return (
    <div className="max-w-lg mx-auto lg:max-w-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Desktop sticky nav ── */}
      <div className="hidden lg:flex sticky top-0 z-50 items-center bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="w-full max-w-6xl mx-auto px-12 h-14 flex items-center gap-3">
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logo_url} alt={shop.name} className="h-7 w-7 rounded-lg object-cover shrink-0" />
          ) : (
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-bold text-sm text-gray-900 truncate">{shop.name}</span>
          {(shop.address || shop.city) && (
            <span className="text-xs text-gray-400 shrink-0">· {shop.address?.trim() || shop.city}</span>
          )}
          <div className="flex-1" />
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              Contact
            </a>
          )}
          <a
            href={`${basePath}/commander`}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <ShoppingBag className="h-4 w-4" />
            Commander
          </a>
        </div>
      </div>

      {/* ── Header ── */}
      <header style={{ backgroundColor: color }} className="relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full opacity-10 bg-white" />

        <div className="relative px-5 pt-10 pb-6 lg:max-w-6xl lg:mx-auto lg:px-12 lg:py-10">
          <div className="absolute top-4 right-4 lg:right-0 z-10">
            <ShareButton
              url={`${APP_URL}/${slug}`}
              title={shop.name}
              text={shop.description ?? `Découvrez ${shop.name} — commandez en ligne`}
              primaryColor={color}
            />
          </div>

          <div className="flex items-end gap-4">
            <div className="shrink-0">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg ring-4 ring-white/20"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-white text-3xl font-bold shadow-lg ring-4 ring-white/20">
                  {shop.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold text-white leading-tight truncate lg:text-3xl">{shop.name}</h1>
              {(shop.address || shop.city) && (
                <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {shop.address?.trim() || shop.city}
                </p>
              )}
            </div>
          </div>

          {shop.description && (
            <p className="mt-3 text-sm text-white/90 leading-relaxed line-clamp-2 lg:line-clamp-none lg:mt-4 lg:text-base lg:max-w-2xl">
              {shop.description}
            </p>
          )}

          <div className="mt-4 flex gap-2 lg:mt-6 lg:max-w-xs">
            <a
              href={`${basePath}/commander`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-white shadow-md transition-opacity hover:opacity-90"
              style={{ color }}
            >
              <ShoppingBag className="h-4 w-4" />
              Commander
            </a>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Contact
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Catalogue ── */}
      <div className="bg-gray-50 min-h-[calc(100vh-260px)]">
        <div className="lg:max-w-6xl lg:mx-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <ShoppingBag className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">Aucun produit disponible pour le moment.</p>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#25D366]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Nous contacter
                </a>
              )}
            </div>
          ) : (
            <ProductGrid
              products={products}
              shopSlug={slug}
              primaryColor={color}
              currency={currency}
              defaultView={shop.product_layout ?? 'list'}
            />
          )}
        </div>
      </div>
    </div>
  )
}
