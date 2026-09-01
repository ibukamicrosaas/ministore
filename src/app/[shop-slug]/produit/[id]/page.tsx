import React from 'react'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, ShoppingBag, Star, ShieldCheck, Banknote, Package, Truck, Wallet } from 'lucide-react'
import type { Shop, Product, ProductPhoto, ProductVariant } from '@/types'
import { ShareButton } from '@/components/pwa/ShareButton'
import { PixelViewContent } from './ProductPixelEvents'
import { ProductStickyCta } from '@/components/pwa/ProductStickyCtaManager'
import { VariantSelectorCta } from './VariantSelectorCta'
import { StockAlertForm } from '@/components/pwa/StockAlertForm'
import { APP_URL } from '@/constants'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { getShopBasePath } from '@/lib/utils/custom-domain'
import { PAYMENT_METHODS_BY_COUNTRY } from '@/lib/payments/payment-methods'
import type { BictorysCountry } from '@/lib/payments/payment-methods'
import { hasRichDescription } from '@/lib/plan-features'
import { displayName } from '@/lib/utils/display-name'

export const revalidate = 60
import type { Metadata } from 'next'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import { ProductGallery } from '@/components/pwa/ProductGallery'
import { ReviewsList } from '@/components/pwa/ReviewsList'

type Props = { params: Promise<{ 'shop-slug': string; id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function fetchShopAndProduct(shopSlug: string, id: string) {
  const supabase = await createServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shopRes = await (supabase.from('shops') as any)
    .select('id, name, primary_color, plan, currency, country, accept_cash_on_delivery, bictorys_secret_key, stripe_connect_enabled, logo_url, grid_image_ratio, city, address, delivery_zones, phone_whatsapp')
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
  // Prix et boutique garantis dans l'aperçu de partage (SPEC-v2 §10.2) — sauf
  // si le marchand a explicitement défini un meta_description, respecté tel quel.
  const priceLabel = formatPrice(p.price, (shop.currency ?? 'XOF') as ShopCurrency)
  const desc      = p.meta_description || `${priceLabel} — Disponible chez ${shop.name}`
  const ogImage   = primary
    ? { url: primary, width: 800, height: 800, alt: p.name }
    : { url: `${APP_URL}/api/share/product-card?id=${p.id}`, width: 1080, height: 1080, alt: p.name }

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

  const shop    = shopData as Pick<Shop, 'id' | 'name' | 'primary_color' | 'logo_url' | 'city' | 'address' | 'phone_whatsapp'> & {
    plan?: string; currency?: string | null
    country?: string | null
    accept_cash_on_delivery?: boolean | null
    bictorys_secret_key?: string | null
    stripe_connect_enabled?: boolean | null
    grid_image_ratio?: 'square' | 'portrait' | null
    delivery_zones?: unknown
  }
  const product = productData as Product & { slug?: string | null }

  // 308 permanent redirect: UUID in URL but product now has a slug
  if (UUID_REGEX.test(id) && product.slug) {
    permanentRedirect(`/${shopSlug}/produit/${product.slug}`)
  }

  const soldOut       = product.stock_count === 0
  const color         = 'var(--brand)'
  const currency      = (shop.currency ?? 'XOF') as ShopCurrency
  const deliveryDelay = (product as Product & { delivery_delay?: string | null }).delivery_delay ?? null
  const isDigital     = (product as Product & { product_type?: string | null }).product_type === 'digital'
  const digitalFileName = (product as Product & { digital_file_name?: string | null }).digital_file_name ?? null
  const digitalFileSize = (product as Product & { digital_file_size?: number | null }).digital_file_size ?? null

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
  const isPortrait   = shop.grid_image_ratio === 'portrait'

  const displayPrice = variants && variants.length > 0
    ? `À partir de ${formatPrice(Math.min(...variants.map(v => v.price)), currency)}`
    : formatPrice(product.price, currency)

  const basePath = await getShopBasePath(shopSlug)

  // Compteur de ventes — preuve sociale (server-side, admin client)
  const admin = createAdminClient()
  const [{ count: rawSalesCount }, relatedResult, reviewsResult] = await Promise.all([
    admin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', product.id),
    createServerClient().then(sb =>
      sb.from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('is_active', true)
        .neq('id', product.id)
        .or('stock_count.is.null,stock_count.gt.0')
        .order('display_order', { ascending: true })
        .limit(4)
    ),
    admin
      .from('product_reviews' as never)
      .select('id, rating, comment, client_name, created_at')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: { id: string; rating: number; comment: string | null; client_name: string; created_at: string }[] | null }>,
  ])
  const salesCount      = rawSalesCount ?? 0
  const relatedProducts = (relatedResult.data ?? []) as Product[]

  const reviews     = reviewsResult.data ?? []
  const reviewCount = reviews.length
  const reviewAvg   = reviewCount > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : 0

  // Méthodes de paiement pour affichage discret sous le CTA
  const shopCountry = shop.country as BictorysCountry | null
  const onlineMethods = shopCountry && PAYMENT_METHODS_BY_COUNTRY[shopCountry]
    ? PAYMENT_METHODS_BY_COUNTRY[shopCountry]
    : []
  const hasOnlinePayment = onlineMethods.length > 0 || shop.bictorys_secret_key || shop.stripe_connect_enabled
  const acceptCash = shop.accept_cash_on_delivery ?? true

  // Bloc « Avant de commander » (§5.4) — mêmes sources que la bande de faits
  // de la page d'accueil, mais détaillées : les vraies zones et tarifs, pas
  // juste « tarif calculé selon ta zone ». Retour/échange absent, aucun champ
  // en base pour cette politique (voir REPRISE.md §51/§54).
  const deliveryZones = Array.isArray(shop.delivery_zones)
    ? (shop.delivery_zones as { id: string; name: string; price: number }[])
    : []
  const hasBeforeOrderBlock = deliveryZones.length > 0 || hasOnlinePayment || acceptCash

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
    <div className="max-w-lg mx-auto lg:max-w-none bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PixelViewContent
        productId={product.id}
        productName={product.name}
        price={product.price}
      />

      {/* ── Desktop sticky nav ── */}
      <div className="hidden lg:flex sticky top-0 z-50 items-center bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="w-full max-w-6xl mx-auto px-12 h-14 flex items-center gap-2">
          <Link href={basePath || '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logo_url} alt={shop.name} className="h-7 w-7 rounded-md object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                {shop.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-sm text-gray-900">{shop.name}</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-500 truncate flex-1">{product.name}</span>
          <a
            href={`${basePath}/commander?product=${product.id}`}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <ShoppingBag className="h-4 w-4" />
            Commander
          </a>
        </div>
      </div>

      {/* ── Contenu : 2 colonnes sur desktop ── */}
      <div className="lg:max-w-6xl lg:mx-auto lg:px-12 lg:py-8">
        <div className="lg:flex lg:gap-10 lg:items-start">

          {/* ── Colonne gauche : galerie ── */}
          <div className="lg:w-[480px] lg:shrink-0 lg:sticky lg:top-20">
            <div className="relative">
              <ProductGallery
                photos={photos}
                videoEmbedUrl={embedUrl}
                productName={product.name}
                primaryColor={color}
                isPortrait={isPortrait}
              />

              {/* Bouton retour boutique — mobile uniquement */}
              <Link
                href={basePath || '/'}
                className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white hover:bg-black/50 transition-colors z-10 lg:hidden"
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
          </div>

          {/* ── Colonne droite : infos produit ── */}
          <div className="bg-white px-5 pt-5 pb-24 lg:flex-1 lg:px-0 lg:pt-2 lg:pb-12 lg:min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{displayName(product.name)}</h1>

        {/* Badge produit digital */}
        {isDigital && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2 w-fit">
            <div>
              <p className="text-xs font-semibold text-violet-700">Produit digital</p>
              {digitalFileName && (
                <p className="text-[10px] text-violet-500">
                  {digitalFileName}
                  {digitalFileSize && ` · ${digitalFileSize > 1024 * 1024 ? `${(digitalFileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(digitalFileSize / 1024)} KB`}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Avis agrégat */}
        {reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  className="h-3.5 w-3.5"
                  fill={s <= Math.round(reviewAvg) ? '#F59E0B' : 'none'}
                  stroke={s <= Math.round(reviewAvg) ? '#F59E0B' : '#D1D5DB'}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-700">{reviewAvg}</span>
            <span className="text-xs text-gray-400">({reviewCount} avis)</span>
          </div>
        )}

        {/* Seuil à 30 (§5.7 de SPEC-v2) : en dessous, le signal joue contre le vendeur plutôt que pour lui. */}
        {salesCount >= 30 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'color-mix(in srgb, var(--brand) 8%, white)', color }}>
            {salesCount} personnes ont déjà commandé
          </div>
        )}

        {!variants?.length && (
          <div className="mt-3 flex items-baseline gap-3">
            <p className="text-2xl font-bold text-gray-900">{displayPrice}</p>
            {(() => {
              const op = (product as Product & { original_price?: number | null }).original_price
              return op && op > product.price ? (
                <p className="text-base text-gray-400 line-through">{formatPrice(op, currency)}</p>
              ) : null
            })()}
          </div>
        )}

        {/* Puces d'état — stock, livraison (§5.2 point 3). "Prix fixe" de la
            maquette non repris : aucun champ en base pour cette notion, pas
            inventé. */}
        <div className="mt-3 flex flex-wrap gap-2">
          {!soldOut && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              En stock
            </span>
          )}
          {deliveryDelay && !isDigital && (
            <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
              Livrée sous {deliveryDelay}
            </span>
          )}
        </div>

        {/* Mentions du vendeur — champs libres, jamais confondus avec un fait plateforme
            vérifié (§5.6 de SPEC-v2) : pas de coche, pas de couleur de validation. */}
        {(() => {
          const b = (product as Product & { badges?: string[] | null }).badges ?? []
          const filled = b.filter(Boolean)
          return filled.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Le vendeur précise</p>
              <div className="grid grid-cols-2 gap-1.5">
                {filled.map((badge, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600"
                  >
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          ) : null
        })()}

        {deliveryDelay && !isDigital && (
          <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'color-mix(in srgb, var(--brand) 7%, white)' }}>
            <Clock className="h-4 w-4 shrink-0" style={{ color }} />
            <p className="text-sm font-medium text-gray-700">
              Livraison estimée : <span className="font-bold" style={{ color }}>{deliveryDelay}</span>
            </p>
          </div>
        )}

        {/* Indicateur de stock faible */}
        {!soldOut && product.stock_count !== null && product.stock_count > 0 && product.stock_count <= 5 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
            Plus que {product.stock_count} disponible{product.stock_count > 1 ? 's' : ''}
          </div>
        )}

        {!soldOut && (
          <div className="mt-4">
            <VariantSelectorCta
              baseHref={`${basePath}/commander?product=${product.id}`}
              color={color}
              productId={product.id}
              productName={product.name}
              variants={variants ?? []}
              minPrice={minPrice}
              currency={currency}
              isDigital={isDigital}
            />
            {/* Méthodes de paiement — discret, informatif */}
            {(hasOnlinePayment || acceptCash) && (
              <div className="mt-3 flex items-start gap-2 opacity-80">
                <ShieldCheck className="h-4 w-4 shrink-0 text-gray-400 mt-1" />
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-xs text-gray-500 mb-1">Paiement accepté :</span>
                  {onlineMethods.map(m => (
                    <div key={m.id} className="flex flex-col items-center gap-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.icon} alt={m.label} className="h-5 object-contain" />
                      <span className="text-[9px] text-gray-400 leading-none">{m.label.split(' ')[0]}</span>
                    </div>
                  ))}
                  {(shop.bictorys_secret_key || shop.stripe_connect_enabled) && onlineMethods.length === 0 && (
                    <>
                      <div className="flex flex-col items-center gap-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-payments/visa.svg" alt="Visa" className="h-5 object-contain" />
                        <span className="text-[9px] text-gray-400 leading-none">Visa</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-payments/Mastercard-Logo.wine.svg" alt="Mastercard" className="h-5 object-contain" />
                        <span className="text-[9px] text-gray-400 leading-none">Mastercard</span>
                      </div>
                    </>
                  )}
                  {acceptCash && (
                    <div className="flex flex-col items-center gap-0.5">
                      <Banknote className="h-5 w-5 text-gray-400" />
                      <span className="text-[9px] text-gray-400 leading-none">Cash</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Poser une question — WhatsApp direct au marchand, distinct du partage */}
        {shop.phone_whatsapp && (
          <a
            href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, j'ai une question sur ce produit : ${product.name} — ${publicUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Poser une question sur ce produit
          </a>
        )}

        {/* Partage WhatsApp — visible sous le CTA */}
        {!soldOut && !isDigital && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${product.name} — ${displayPrice}\n${publicUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Partager ce produit
          </a>
        )}

        {/* Avant de commander (§5.4) — mêmes sources que la bande de faits de
            l'accueil, détaillées : zones et tarifs réels, moyens de paiement
            déjà calculés plus haut sur cette page. Disparaît entièrement si
            rien à montrer (Règle B). */}
        {hasBeforeOrderBlock && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Avant de commander</p>
            {deliveryZones.length > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5">
                <Truck className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">Livraison</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {deliveryZones.map(z => `${z.name.trim()} — ${formatPrice(z.price, currency)}`).join(' · ')}
                  </p>
                </div>
              </div>
            )}
            {(hasOnlinePayment || acceptCash) && (
              <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5">
                <Wallet className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">Paiement</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[
                      ...onlineMethods.map(m => m.label),
                      ...(onlineMethods.length === 0 && hasOnlinePayment ? ['Carte bancaire'] : []),
                      ...(acceptCash ? ['Paiement à la livraison'] : []),
                    ].join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {product.description && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            {hasRichDescription(shop.plan)
              ? renderProDescription(product.description)
              : <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            }
          </div>
        )}

        {/* ── Section avis ── */}
        {reviews.length > 0 && (
          <ReviewsList reviews={reviews} reviewAvg={reviewAvg} reviewCount={reviewCount} />
        )}
          </div>
        </div>{/* fin lg:flex */}

        {/* ── Vous aimerez aussi — pleine largeur du container ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-100 px-5 lg:px-0 lg:mt-10 lg:pt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Vous aimerez aussi</p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
              {relatedProducts.map(rp => {
                const rpPhotos = Array.isArray(rp.photos) && (rp.photos as unknown as ProductPhoto[]).length > 0
                  ? (rp.photos as unknown as ProductPhoto[])
                  : rp.photo_url ? [{ url: rp.photo_url, is_primary: true }] : []
                const rpPhoto    = rpPhotos.find(p => p.is_primary)?.url ?? rpPhotos[0]?.url ?? null
                const rpVariants = rp.variants as ProductVariant[] | null
                const rpPrice    = rpVariants?.length
                  ? `À partir de ${formatPrice(Math.min(...rpVariants.map(v => v.price)), currency)}`
                  : formatPrice(rp.price, currency)
                const rpSlug = (rp as Product & { slug?: string | null }).slug
                const rpHref = `${basePath}/produit/${rpSlug ?? rp.id}`
                return (
                  <a key={rp.id} href={rpHref} className="shrink-0 w-32 lg:w-auto group">
                    <div className="relative w-32 h-32 lg:w-full lg:h-48 rounded-xl overflow-hidden bg-gray-100">
                      {rpPhoto ? (
                        <Image
                          src={rpPhoto}
                          alt={rp.name}
                          fill
                          sizes="(max-width: 1024px) 128px, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          quality={80}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-800 line-clamp-2 leading-tight">{rp.name}</p>
                    <p className="mt-0.5 text-xs font-bold" style={{ color }}>{rpPrice}</p>
                    <p className="mt-1 text-[10px] font-semibold" style={{ color: 'color-mix(in srgb, var(--brand) 60%, white)' }}>Voir →</p>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>{/* fin lg:max-w-6xl */}

      {/* Sticky CTA — rupture de stock (mobile only) */}
      {soldOut && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent max-w-lg mx-auto lg:hidden">
          <div className="space-y-2">
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-gray-400 bg-gray-100 cursor-not-allowed">
              Rupture de stock
            </div>
            <StockAlertForm productId={product.id} primaryColor={color} />
          </div>
        </div>
      )}

      {/* Sticky CTA — n'apparaît que quand le bouton inline est hors du viewport */}
      {!soldOut && (
        <ProductStickyCta
          href={`${basePath}/commander?product=${product.id}`}
          color={color}
          productId={product.id}
          productName={product.name}
          price={product.price}
          displayPrice={displayPrice}
          isDigital={isDigital}
        />
      )}
    </div>
  )
}
