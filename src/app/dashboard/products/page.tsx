import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Plus, Package, Tag } from 'lucide-react'
import { toggleProductActive } from '@/lib/actions/products'
import { CsvImportButton } from './CsvImportButton'
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

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', profile.shop_id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return <ErrorState message="Impossible de charger les produits." />

  const products = (data ?? []) as Product[]

  const byCategory = products.reduce<Record<string, Product[]>>((acc, product) => {
    const cat = product.category ?? 'Autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(product)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produits</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {products.length} produit{products.length > 1 ? 's' : ''} configuré{products.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        <Card>
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
        </Card>
      ) : (
        <>
          {Object.entries(byCategory).map(([category, items]) => (
            <Card key={category} padding="none">
              <CardHeader
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                description={`${items.length} produit${items.length > 1 ? 's' : ''}`}
                className="px-4 pt-4 pb-3 border-b border-gray-100"
              />
              <div className="divide-y divide-gray-100">
                {items.map((product) => {
                  const primaryPhoto = Array.isArray(product.photos)
                    ? (product.photos as { url: string; is_primary?: boolean }[]).find(p => p.is_primary)?.url
                      ?? (product.photos as { url: string }[])[0]?.url
                    : product.photo_url

                  return (
                    <div key={product.id} className="flex items-center gap-4 px-4 py-3">
                      {primaryPhoto ? (
                        <img
                          src={primaryPhoto}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 shrink-0">
                          <Package className="h-5 w-5 text-[var(--color-primary)]" />
                        </div>
                      )}

                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="flex-1 min-w-0 hover:opacity-75 transition-opacity"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          {!product.is_active && <Badge variant="warning">Inactif</Badge>}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {product.price.toLocaleString('fr-FR')} FCFA
                          </span>
                          {Array.isArray(product.variants) && product.variants.length > 0 && (
                            <span className="text-gray-400">{product.variants.length} variante{product.variants.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </Link>

                      <ToggleActiveButton id={product.id} isActive={product.is_active} />
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}

          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-4 rounded-xl border border-dashed border-gray-300 p-4 hover:border-[var(--color-primary)] hover:bg-sky-50 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 shrink-0">
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ajouter un produit</p>
              <p className="text-xs text-gray-500">Alimentaire, vêtements, artisanat...</p>
            </div>
          </Link>
        </>
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
