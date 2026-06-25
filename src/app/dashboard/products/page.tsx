import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Plus, Package, Tag, ShoppingCart, AlertTriangle } from 'lucide-react'
import { toggleProductActive } from '@/lib/actions/products'
import { CsvImportButton } from './CsvImportButton'
import { formatPrice } from '@/lib/utils/country-groups'
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
      .select('currency')
      .eq('id', profile.shop_id)
      .single(),
    supabase
      .from('orders')
      .select('id')
      .eq('shop_id', profile.shop_id)
      .not('status', 'eq', 'cancelled'),
  ])

  const currency = ((shopData as { currency?: string | null } | null)?.currency ?? 'XOF') as ShopCurrency

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
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              {/* Section header — léger, sans Card wrapper */}
              <div className="flex items-center justify-between mb-2 px-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </p>
                <span className="text-xs text-gray-400 font-medium">
                  {items.length} produit{items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Liste produits */}
              <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                {items.map((product) => {
                  const primaryPhoto = Array.isArray(product.photos)
                    ? (product.photos as { url: string; is_primary?: boolean }[]).find(p => p.is_primary)?.url
                      ?? (product.photos as { url: string }[])[0]?.url
                    : product.photo_url

                  const sales    = salesMap[product.id] ?? 0
                  const stock    = (product as Product & { stock_count?: number | null }).stock_count
                  const stockLow = stock !== null && stock !== undefined && stock <= 3
                  const stockOut = stock === 0

                  return (
                    <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Photo */}
                      {primaryPhoto ? (
                        <img
                          src={primaryPhoto}
                          alt={product.name}
                          className="h-11 w-11 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 shrink-0">
                          <Package className="h-4.5 w-4.5 text-gray-400" />
                        </div>
                      )}

                      {/* Info */}
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="flex-1 min-w-0 hover:opacity-75 transition-opacity"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                          {!product.is_active && <Badge variant="warning">Inactif</Badge>}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-gray-600">
                            <Tag className="h-3 w-3" />
                            {formatPrice(product.price, currency)}
                          </span>
                          {Array.isArray(product.variants) && product.variants.length > 0 && (
                            <span className="text-gray-400">
                              {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {sales > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <ShoppingCart className="h-3 w-3" />
                              {sales} vendu{sales > 1 ? 's' : ''}
                            </span>
                          )}
                          {stock !== null && stock !== undefined && (
                            <span className={`flex items-center gap-1 ${stockOut ? 'text-red-500' : stockLow ? 'text-orange-500' : 'text-gray-400'}`}>
                              {(stockOut || stockLow) && <AlertTriangle className="h-3 w-3" />}
                              {stockOut ? 'Rupture' : `${stock} en stock`}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Toggle actif/inactif */}
                      <ToggleActiveButton id={product.id} isActive={product.is_active} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

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

function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form
      action={async () => {
        'use server'
        await toggleProductActive(id, !isActive)
      }}
    >
      <button
        type="submit"
        title={isActive ? 'Désactiver' : 'Activer'}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
          isActive ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
            isActive ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </form>
  )
}
