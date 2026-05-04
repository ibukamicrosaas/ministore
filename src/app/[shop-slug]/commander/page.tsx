import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderForm } from './OrderForm'
import type { Shop, Product, ProductVariant } from '@/types'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ product?: string }>
}

export const metadata = { title: 'Commander' }

export default async function CommanderPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { product: preselectedProductId } = await searchParams

  const supabase = await createServerClient()

  const { data: shopData } = await supabase
    .from('shops')
    .select('id, name, primary_color, phone_whatsapp, available_days, delivery_options, deposit_percentage')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!shopData) notFound()

  const shop = shopData as Pick<Shop,
    'id' | 'name' | 'primary_color' | 'phone_whatsapp' |
    'available_days' | 'delivery_options' | 'deposit_percentage'
  >

  const { data: productsData } = await supabase
    .from('products')
    .select('id, name, price, photos, photo_url, variants, deposit_percentage, category')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const products = (productsData ?? []) as (Pick<Product,
    'id' | 'name' | 'price' | 'photos' | 'photo_url' | 'variants' | 'deposit_percentage' | 'category'
  >)[]

  // Générer les dates disponibles sur 14 jours
  const availableDays = Array.isArray(shop.available_days) ? shop.available_days as string[] : []
  const DAY_MAP: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }

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

  return (
    <div className="max-w-lg mx-auto">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900">Passer commande</h1>
        <p className="text-sm text-gray-500 mt-0.5">Chez {shop.name}</p>
      </div>

      <OrderForm
        shopId={shop.id}
        shopSlug={slug}
        shopName={shop.name}
        primaryColor={shop.primary_color ?? '#0EA5E9'}
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          variants: (p.variants as ProductVariant[] | null) ?? null,
          deposit_percentage: p.deposit_percentage,
        }))}
        deliveryDates={dates}
        deliveryOptions={deliveryOptions}
        shopDepositPct={shop.deposit_percentage ?? 0}
        preselectedProductId={preselectedProductId ?? null}
      />
    </div>
  )
}
