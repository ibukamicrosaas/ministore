import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderForm } from './OrderForm'
import { getShopBasePath } from '@/lib/utils/custom-domain'
import type { Shop, Product, ProductVariant, ProductPhoto, DeliveryZone, QuantityDiscount } from '@/types'
import type { ShopCurrency } from '@/lib/utils/country-groups'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ product?: string; variant?: string; qty?: string }>
}

export const metadata = { title: 'Commander' }

export default async function CommanderPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { product: preselectedProductId, variant: preselectedVariant, qty: qtyParam } = await searchParams
  const preselectedQuantity = qtyParam ? Math.max(1, parseInt(qtyParam, 10) || 1) : 1

  const supabase = await createServerClient()

  // Pas de filtre is_active : le layout est le gardien des boutiques inactives
  const { data: shopData } = await supabase
    .from('shops')
    .select('id, name, logo_url, primary_color, city, country, currency, phone_whatsapp, available_days, delivery_options, deposit_percentage, accept_online_payment, delivery_zones')
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

  // target_countries not yet in generated types — fetch separately
  let targetCountriesVal: string[] | null = null
  const { data: tcData } = await supabase
    .from('shops')
    .select('target_countries' as never)
    .eq('id', shopData.id)
    .single()
  if (tcData) {
    const raw = (tcData as unknown as Record<string, unknown>).target_countries
    if (Array.isArray(raw)) targetCountriesVal = raw as string[]
  }

  const shop = shopData as Pick<Shop,
    'id' | 'name' | 'logo_url' | 'primary_color' | 'city' | 'country' | 'phone_whatsapp' |
    'available_days' | 'delivery_options' | 'deposit_percentage' | 'accept_online_payment' |
    'delivery_zones'
  > & { currency?: string | null }

  // Détecter si le produit présélectionné est digital
  const { data: productTypeData } = preselectedProductId
    ? await supabase.from('products').select('product_type' as never).eq('id', preselectedProductId).single()
    : { data: null }
  const isDigital = (productTypeData as { product_type?: string } | null)?.product_type === 'digital'

  const { data: productsData } = await supabase
    .from('products')
    .select('id, name, price, photos, photo_url, variants, deposit_percentage, category, stock_count, customization_enabled, customization_label, quantity_discounts' as never)
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const products = (productsData ?? []) as unknown as (Pick<Product,
    'id' | 'name' | 'price' | 'photos' | 'photo_url' | 'variants' | 'deposit_percentage' | 'category' | 'stock_count'
  > & { customization_enabled?: boolean; customization_label?: string | null; quantity_discounts?: QuantityDiscount[] | null })[]

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
    <div className="max-w-lg mx-auto bg-white">
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
          customization_enabled: p.customization_enabled ?? false,
          customization_label: p.customization_label ?? null,
          quantity_discounts: (p.quantity_discounts as QuantityDiscount[] | null) ?? null,
        }))}

        deliveryOptions={deliveryOptions}
        shopDepositPct={shop.deposit_percentage ?? 0}
        shopCountry={shop.country ?? 'SN'}
        shopCurrency={(shop.currency ?? 'XOF') as ShopCurrency}
        acceptOnlinePayment={shop.accept_online_payment ?? true}
        acceptCashOnDelivery={acceptCashOnDelivery}
        deliveryZones={Array.isArray(shop.delivery_zones) ? (shop.delivery_zones as unknown as DeliveryZone[]) : []}
        targetCountries={targetCountriesVal}
        preselectedProductId={preselectedProductId ?? null}
        preselectedVariant={preselectedVariant ?? null}
        preselectedQuantity={preselectedQuantity}
        basePath={await getShopBasePath(slug)}
        isDigital={isDigital}
      />
    </div>
  )
}
