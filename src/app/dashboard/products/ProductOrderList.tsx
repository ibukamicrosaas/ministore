'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import {
  Package, Tag, ShoppingCart, AlertTriangle,
  ArrowUp, ArrowDown, Check, X, ListOrdered,
} from 'lucide-react'
import { reorderProducts, toggleProductActive } from '@/lib/actions/products'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import { ShareWhatsAppButton } from '@/components/dashboard/ShareWhatsAppButton'
import { APP_URL } from '@/constants'

type ProductRow = Product & { stock_count?: number | null; sales: number }
type CategoryGroup = { name: string; products: ProductRow[] }

interface Props {
  byCategory: Record<string, (Product & { stock_count?: number | null })[]>
  salesMap: Record<string, number>
  currency: ShopCurrency
  shopSlug: string
}

function buildCategories(
  byCategory: Props['byCategory'],
  salesMap: Record<string, number>,
): CategoryGroup[] {
  return Object.entries(byCategory).map(([name, products]) => ({
    name,
    products: products.map(p => ({ ...p, sales: salesMap[p.id] ?? 0 })),
  }))
}

export function ProductOrderList({ byCategory, salesMap, currency, shopSlug }: Props) {
  const [categories, setCategories] = useState<CategoryGroup[]>(() =>
    buildCategories(byCategory, salesMap),
  )
  const [reorderMode, setReorderMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  function moveCategory(index: number, dir: -1 | 1) {
    const next = [...categories]
    const swap = index + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setCategories(next)
  }

  function moveProduct(catIdx: number, prodIdx: number, dir: -1 | 1) {
    const next = categories.map(c => ({ ...c, products: [...c.products] }))
    const prods = next[catIdx].products
    const swap = prodIdx + dir
    if (swap < 0 || swap >= prods.length) return
    ;[prods[prodIdx], prods[swap]] = [prods[swap], prods[prodIdx]]
    setCategories(next)
  }

  async function saveOrder() {
    setSaving(true)
    const allIds = categories.flatMap(c => c.products.map(p => p.id))
    const result = await reorderProducts(allIds)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Ordre sauvegardé ✓')
      setReorderMode(false)
    }
  }

  function cancelReorder() {
    setCategories(buildCategories(byCategory, salesMap))
    setReorderMode(false)
  }

  function handleToggle(productId: string, currentActive: boolean) {
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        products: cat.products.map(p =>
          p.id === productId ? { ...p, is_active: !currentActive } : p,
        ),
      })),
    )
    startTransition(async () => {
      await toggleProductActive(productId, !currentActive)
    })
  }

  const totalProducts = categories.reduce((s, c) => s + c.products.length, 0)

  return (
    <div className="space-y-5">
      {/* Barre de mode réorganisation */}
      {reorderMode ? (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5">
          <ListOrdered className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="flex-1 text-xs font-medium text-amber-700">
            Utilisez les flèches pour réorganiser catégories et produits.
          </p>
          <button
            onClick={saveOrder}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          <button
            onClick={cancelReorder}
            disabled={saving}
            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
            Annuler
          </button>
        </div>
      ) : (
        totalProducts > 1 && (
          <div className="flex justify-end">
            <button
              onClick={() => setReorderMode(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              Réorganiser
            </button>
          </div>
        )
      )}

      {categories.map((cat, catIdx) => (
        <div key={cat.name}>
          {/* En-tête catégorie */}
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex items-center gap-1.5">
              {reorderMode && (
                <div className="flex gap-0.5">
                  <button
                    onClick={() => moveCategory(catIdx, -1)}
                    disabled={catIdx === 0}
                    className="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-25 transition-colors"
                    title="Monter la catégorie"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => moveCategory(catIdx, 1)}
                    disabled={catIdx === categories.length - 1}
                    className="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-25 transition-colors"
                    title="Descendre la catégorie"
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
              </p>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {cat.products.length} produit{cat.products.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Liste produits */}
          <div className={`rounded-2xl border bg-white divide-y divide-gray-100 overflow-hidden transition-colors ${reorderMode ? 'border-amber-200' : 'border-gray-200'}`}>
            {cat.products.map((product, prodIdx) => {
              const primaryPhoto = Array.isArray(product.photos)
                ? (product.photos as { url: string; is_primary?: boolean }[]).find(p => p.is_primary)?.url
                  ?? (product.photos as { url: string }[])[0]?.url
                : product.photo_url

              const stock    = product.stock_count
              const stockLow = stock !== null && stock !== undefined && stock <= 3
              const stockOut = stock === 0

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 px-4 py-3 ${reorderMode ? 'bg-amber-50/30' : ''}`}
                >
                  {/* Flèches produit */}
                  {reorderMode && (
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveProduct(catIdx, prodIdx, -1)}
                        disabled={prodIdx === 0}
                        className="rounded p-0.5 hover:bg-amber-100 disabled:opacity-25 transition-colors"
                        title="Monter"
                      >
                        <ArrowUp className="h-3 w-3 text-amber-600" />
                      </button>
                      <button
                        onClick={() => moveProduct(catIdx, prodIdx, 1)}
                        disabled={prodIdx === cat.products.length - 1}
                        className="rounded p-0.5 hover:bg-amber-100 disabled:opacity-25 transition-colors"
                        title="Descendre"
                      >
                        <ArrowDown className="h-3 w-3 text-amber-600" />
                      </button>
                    </div>
                  )}

                  {/* Photo */}
                  {primaryPhoto ? (
                    <img
                      src={primaryPhoto}
                      alt={product.name}
                      className="h-11 w-11 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 shrink-0">
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                  )}

                  {/* Infos */}
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
                      {Array.isArray(product.variants) && (product.variants as unknown[]).length > 0 && (
                        <span>
                          {(product.variants as unknown[]).length} variante{(product.variants as unknown[]).length > 1 ? 's' : ''}
                        </span>
                      )}
                      {product.sales > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <ShoppingCart className="h-3 w-3" />
                          {product.sales} vendu{product.sales > 1 ? 's' : ''}
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

                  {/* Bouton WhatsApp + Toggle — masqués en mode réorganisation */}
                  {!reorderMode && (
                    <>
                      <ShareWhatsAppButton
                        variant="icon"
                        message={`🛍️ *${product.name}*\n${formatPrice(product.price, currency)}\n\nDisponible maintenant, commandez ici 👉 ${APP_URL}/${shopSlug}/produit/${product.id}`}
                      />
                      <button
                        onClick={() => handleToggle(product.id, product.is_active)}
                        title={product.is_active ? 'Désactiver' : 'Activer'}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          product.is_active ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                            product.is_active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
