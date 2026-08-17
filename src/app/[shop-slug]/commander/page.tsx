import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { OrderForm } from './OrderForm'
import { getShopBasePath } from '@/lib/utils/custom-domain'
import { getHeldPhysicalOrderCount } from '@/lib/orders/held-orders'
import { MAX_HELD_ORDERS } from '@/constants'
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

  // Pas de filtre is_active : le layout est le gardien des boutiques inactives.
  // Une seule requête shops (regroupe les 3 .single() séparées d'avant — §11 de
  // la spec) : status/accept_cash_on_delivery/target_countries n'existent pas
  // forcément sur toutes les instances DB plus anciennes, d'où le typage large
  // et les valeurs par défaut ci-dessous plutôt qu'un select typé strict.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shopData } = await (supabase.from('shops') as any)
    .select('id, name, logo_url, primary_color, city, country, currency, phone_whatsapp, available_days, delivery_options, deposit_percentage, accept_online_payment, delivery_zones, status, accept_cash_on_delivery, target_countries')
    .eq('slug', slug)
    .single()

  if (!shopData) notFound()

  const raw = shopData as unknown as Record<string, unknown>

  // Fermeture du bouton de commande : uniquement pertinent pour une boutique
  // free_orders en 'expired' avec trop de commandes retenues non résolues
  // (§5 de la spec). Nécessite l'admin client : aucune policy RLS ne permet à
  // un visiteur anonyme de compter les commandes d'une boutique.
  let acceptingOrders = true
  if (raw.status === 'expired') {
    const admin = createAdminClient()
    const heldPhysicalCount = await getHeldPhysicalOrderCount(admin, shopData.id)
    if (heldPhysicalCount >= MAX_HELD_ORDERS) acceptingOrders = false
  }

  // accept_cash_on_delivery may not exist yet in older DB instances — default true if missing
  const acceptCashOnDelivery = typeof raw.accept_cash_on_delivery === 'boolean'
    ? raw.accept_cash_on_delivery
    : true

  // target_countries not yet in generated types — fetch separately
  const targetCountriesVal: string[] | null = Array.isArray(raw.target_countries)
    ? raw.target_countries as string[]
    : null

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
    <div className="bg-white">
      <OrderForm
        shopId={shop.id}
        shopSlug={slug}
        shopName={shop.name}
        shopLogoUrl={shop.logo_url}
        shopCity={shop.city ?? null}
        primaryColor="var(--brand)"
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
        acceptingOrders={acceptingOrders}
      />
    </div>
  )
}
