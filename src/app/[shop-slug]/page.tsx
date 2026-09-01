import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ShopHomeLayout } from '@/components/pwa/ShopHomeLayout'
import type { Shop, Product } from '@/types'
import { APP_URL } from '@/constants'
import { getShopBasePath } from '@/lib/utils/custom-domain'
import { VisitBeacon } from './VisitBeacon'

export const revalidate = 60
import type { Metadata } from 'next'

type Props = { params: Promise<{ 'shop-slug': string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('shops') as any)
    .select('name, description, logo_url, cover_image_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .neq('status', 'draft')
    .single()
  if (!data) return {}

  const shop = data as Pick<Shop, 'name' | 'description' | 'logo_url'> & { cover_image_url?: string | null }
  const url  = `${APP_URL}/${slug}`
  const desc = shop.description ?? `Boutique ${shop.name} — commandez en ligne`
  // Couverture d'abord, à défaut le logo, à défaut une image générée avec le
  // nom de la boutique (SPEC-v2 §10.2) — plus un repli statique générique
  // identique pour toutes les boutiques sans logo ni couverture.
  const ogImage = shop.cover_image_url
    ? { url: shop.cover_image_url, width: 1200, height: 630, alt: shop.name }
    : shop.logo_url
    ? { url: shop.logo_url, width: 400, height: 400, alt: shop.name }
    : { url: `${APP_URL}/api/share/shop-card?slug=${slug}`, width: 1080, height: 1080, alt: shop.name }

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
      // Petite carte seulement pour le cas logo-seul (carré 400×400) — couverture et repli généré sont des images larges.
      card: (!shop.cover_image_url && shop.logo_url) ? 'summary' : 'summary_large_image',
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
    .select('id, name, description, logo_url, primary_color, city, address, phone_whatsapp, available_days, delivery_options, delivery_zones, country, accept_cash_on_delivery, bictorys_secret_key, stripe_connect_enabled, plan, currency, cover_image_url, about_photo_url, business_category, badges, social_links, opening_hours, product_layout, trial_model, verification_status, grid_image_ratio')
    .eq('slug', slug)
    .neq('status', 'draft')
    .single()

  if (!shopData) notFound()
  const shop = shopData as unknown as Shop & {
    currency?: string | null
    product_layout?: 'list' | 'grid' | null
    social_links?: Record<string, string> | null
    business_category?: string | null
    cover_image_url?: string | null
    opening_hours?: string | null
  }

  // Les produits en rupture (stock_count = 0) restent sur la vitrine — décision
  // produit explicite (Lot B, 2026-09-01) — plutôt qu'invisibles comme avant.
  // Chaque carte gère déjà l'affichage rupture (pastille, CTA remplacé par le
  // formulaire d'alerte sur la fiche produit) ; seul le filtre "Disponible
  // tout de suite" en dépendait pour avoir un effet réel.
  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  const products = (productsData ?? []) as Product[]
  const basePath = await getShopBasePath(slug)

  return (
    <>
      {shop.trial_model === 'free_orders' && <VisitBeacon shopId={shop.id} />}
      <ShopHomeLayout shop={shop} products={products} shopSlug={slug} basePath={basePath} />
    </>
  )
}
