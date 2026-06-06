import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderForm } from './OrderForm'
import type { Shop, Product, ProductVariant, ProductPhoto, DeliveryZone } from '@/types'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ product?: string }>
}

export const metadata = { title: 'Commander' }

export default async function CommanderPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { product: preselectedProductId } = await searchParams

  const supabase = await createServerClient()

  // Pas de filtre is_active : le layout est le gardien des boutiques inactives
  const { data: shopData } = await supabase
    .from('shops')
    .select('id, name, logo_url, primary_color, city, country, phone_whatsapp, available_days, delivery_options, deposit_percentage, accept_online_payment, delivery_zones')
    .eq('slug', slug)
    .single()

  if (!shopData) notFound()

  // accept_cash_on_delivery may not exist yet in older DB instances — default true if missing
  let acceptCashOnDelivery = true
  const { data: cashData } = await supabase
    .from('shops')
    .select('accept_cash_on_delivery')
    .eq('id', shopData.id)
    .single()
  if (cashData && typeof (cashData as Record<string, unknown>).accept_cash_on_delivery === 'boolean') {
    acceptCashOnDelivery = (cashData as Record<string, unknown>).accept_cash_on_delivery as boolean
  }

  const shop = shopData as Pick<Shop,
    'id' | 'name' | 'logo_url' | 'primary_color' | 'city' | 'country' | 'phone_whatsapp' |
    'available_days' | 'delivery_options' | 'deposit_percentage' | 'accept_online_payment' |
    'delivery_zones'
  >

  const { data: productsData } = await supabase
    .from('products')
    .select('id, name, price, photos, photo_url, variants, deposit_percentage, category, stock_count')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const products = (productsData ?? []) as (Pick<Product,
    'id' | 'name' | 'price' | 'photos' | 'photo_url' | 'variants' | 'deposit_percentage' | 'category' | 'stock_count'
  >)[]

  // Générer les dates disponibles sur 14 jours
  const availableDays = Array.isArray(shop.available_days) ? shop.available_days as string[] : []

  const dates: { value: string; label: string }[] = []
  const today = new Date()
  const todayDayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][today.getDay()]
  if (availableDays.length === 0 || availableDays.includes(todayDayName)) {
    dates.push({ value: today.toISOString().slice(0, 10), label: "Aujourd'hui" })
  }
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][d.getDay()]
    if (availableDays.length === 0 || availableDays.includes(dayName)) {
      dates.push({
        value: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      })
    }
  }

  const deliveryOptions = (shop.delivery_options ?? { home_delivery: true, store_pickup: true }) as {
    home_delivery: boolean
    store_pickup: boolean
  }

  function getThumb(p: typeof products[0]): string | null {
    if (Array.isArray(p.photos) && (p.photos as unknown as ProductPhoto[]).length > 0) {
      const photos = p.photos as unknown as ProductPhoto[]
      return photos.find(ph => ph.is_primary)?.url ?? photos[0]?.url ?? null
    }
    return p.photo_url
  }

  return (
    <div className="max-w-lg mx-auto">
      <OrderForm
        shopId={shop.id}
        shopSlug={slug}
        shopName={shop.name}
        shopLogoUrl={shop.logo_url}
        shopCity={shop.city ?? null}
        primaryColor={shop.primary_color ?? '#0EA5E9'}
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          photo: getThumb(p),
          variants: (p.variants as ProductVariant[] | null) ?? null,
          deposit_percentage: p.deposit_percentage,
          stock_count: p.stock_count ?? null,
        }))}
        deliveryDates={dates}
        deliveryOptions={deliveryOptions}
        shopDepositPct={shop.deposit_percentage ?? 0}
        shopCountry={shop.country ?? 'SN'}
        acceptOnlinePayment={shop.accept_online_payment ?? true}
        acceptCashOnDelivery={acceptCashOnDelivery}
        deliveryZones={Array.isArray(shop.delivery_zones) ? (shop.delivery_zones as unknown as DeliveryZone[]) : []}
        preselectedProductId={preselectedProductId ?? null}
      />
    </div>
  )
}
