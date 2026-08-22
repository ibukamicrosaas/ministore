import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Plus, Package } from 'lucide-react'
import { CsvImportButton } from './CsvImportButton'
import { ProductOrderList } from './ProductOrderList'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import type { Product, Profile } from '@/types'

export const metadata = { title: 'Produits — TekkiShop' }

export default async function ProductsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'shop_id'> | null
  if (!profile?.shop_id) redirect('/onboarding')

  const [{ data, error }, { data: shopData }, { data: ordersData }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('shop_id', profile.shop_id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('shops')
      .select('slug, currency')
      .eq('id', profile.shop_id)
      .single(),
    supabase
      .from('orders')
      .select('id')
      .eq('shop_id', profile.shop_id)
      .not('status', 'eq', 'cancelled'),
  ])

  const shopMeta = shopData as { slug?: string | null; currency?: string | null } | null
  const currency  = (shopMeta?.currency ?? 'XOF') as ShopCurrency
  const shopSlug  = shopMeta?.slug ?? ''

  if (error) return <ErrorState message="Impossible de charger les produits." />

  const products = (data ?? []) as Product[]

  // Agrégation des ventes par produit
  const salesMap: Record<string, number> = {}
  const orderIds = (ordersData ?? []).map(o => o.id)
  if (orderIds.length > 0) {
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .in('order_id', orderIds)
    for (const item of itemsData ?? []) {
      const pid = (item as { product_id: string; quantity: number }).product_id
      const qty = (item as { product_id: string; quantity: number }).quantity
      salesMap[pid] = (salesMap[pid] ?? 0) + qty
    }
  }

  const byCategory = products.reduce<Record<string, Product[]>>((acc, product) => {
    const cat = product.category ?? 'Autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(product)
    return acc
  }, {})

  return (
    <div className="space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produits</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {products.length} produit{products.length > 1 ? 's' : ''} configuré{products.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CsvImportButton />
          <Link href="/dashboard/products/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </Link>
        </div>
      </div>

      {!products.length ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
          <EmptyState
            icon={Package}
            title="Aucun produit configuré"
            description="Ajoute tes produits pour que tes clients puissent passer commande."
            action={
              <Link href="/dashboard/products/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Ajouter un produit
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          <ProductOrderList
            byCategory={byCategory as Record<string, (Product & { stock_count?: number | null })[]>}
            salesMap={salesMap}
            currency={currency}
            shopSlug={shopSlug}
          />

          {/* Bouton ajout bas de page */}
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 p-4 hover:border-[var(--color-primary)] hover:bg-sky-50 transition-colors"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 shrink-0">
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Ajouter un produit</p>
              <p className="text-xs text-gray-400">Alimentaire, vêtements, artisanat...</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

