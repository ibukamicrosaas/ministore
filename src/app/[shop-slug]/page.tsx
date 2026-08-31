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
  const { data } = await supabase
    .from('shops')
    .select('name, description, logo_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .neq('status', 'draft')
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
    .select('id, name, description, logo_url, primary_color, city, address, phone_whatsapp, available_days, delivery_options, delivery_zones, country, accept_cash_on_delivery, bictorys_secret_key, stripe_connect_enabled, plan, currency, cover_image_url, about_photo_url, business_category, badges, social_links, opening_hours, product_layout, trial_model, verification_status')
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

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .or('stock_count.is.null,stock_count.gt.0')
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
