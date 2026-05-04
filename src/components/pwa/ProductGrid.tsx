'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutList, LayoutGrid, MessageCircle, Package, Tag } from 'lucide-react'
import type { Product, ProductPhoto, ProductVariant } from '@/types'

interface ProductGridProps {
  products: Product[]
  shopSlug: string
  primaryColor: string
}

function getPrimaryPhoto(product: Product): string | null {
  if (Array.isArray(product.photos) && (product.photos as unknown as ProductPhoto[]).length > 0) {
    const photos = product.photos as unknown as ProductPhoto[]
    return photos.find(p => p.is_primary)?.url ?? photos[0]?.url ?? null
  }
  return product.photo_url
}

function getPrice(product: Product): string {
  const variants = product.variants as ProductVariant[] | null
  if (variants && variants.length > 0) {
    const prices = variants.map(v => v.price).filter(p => p > 0)
    if (prices.length > 0) {
      const min = Math.min(...prices)
      return `À partir de ${min.toLocaleString('fr-FR')} FCFA`
    }
  }
  return `${product.price.toLocaleString('fr-FR')} FCFA`
}

function ProductCardList({ product, shopSlug, primaryColor }: { product: Product; shopSlug: string; primaryColor: string }) {
  const photo = getPrimaryPhoto(product)
  const price = getPrice(product)

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
      {photo ? (
        <img src={photo} alt={product.name} className="h-20 w-20 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 shrink-0">
          <Package className="h-7 w-7 text-gray-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-bold" style={{ color: primaryColor }}>{price}</span>
          <Link
            href={`/${shopSlug}/commander?product=${product.id}`}
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Commander
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProductCardGrid({ product, shopSlug, primaryColor }: { product: Product; shopSlug: string; primaryColor: string }) {
  const photo = getPrimaryPhoto(product)
  const price = getPrice(product)

  return (
    <Link href={`/${shopSlug}/produit/${product.id}`} className="group">
      <div className="rounded-2xl bg-white overflow-hidden shadow-sm">
        {photo ? (
          <img src={photo} alt={product.name} className="aspect-square w-full object-cover" />
        ) : (
          <div className="aspect-square flex items-center justify-center bg-gray-100">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
        )}
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
          <p className="mt-0.5 text-xs font-bold truncate" style={{ color: primaryColor }}>{price}</p>
        </div>
      </div>
    </Link>
  )
}

export function ProductGrid({ products, shopSlug, primaryColor }: ProductGridProps) {
  const [view, setView] = useState<'list' | 'grid'>('list')

  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category ?? ''
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const categories = Object.keys(byCategory)
  const hasCategories = categories.length > 1 || (categories.length === 1 && categories[0] !== '')

  return (
    <div>
      {/* Toggle liste/grille */}
      <div className="flex items-center justify-end px-4 py-2 gap-2">
        <button
          onClick={() => setView('list')}
          className={`rounded-lg p-2 transition-colors ${view === 'list' ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
          style={view === 'list' ? { color: primaryColor } : {}}
          title="Vue liste"
        >
          <LayoutList className="h-5 w-5" />
        </button>
        <button
          onClick={() => setView('grid')}
          className={`rounded-lg p-2 transition-colors ${view === 'grid' ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
          style={view === 'grid' ? { color: primaryColor } : {}}
          title="Vue grille"
        >
          <LayoutGrid className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pb-6 space-y-6">
        {categories.map(category => (
          <div key={category}>
            {hasCategories && category && (
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{category}</p>
              </div>
            )}
            {view === 'list' ? (
              <div className="space-y-3">
                {byCategory[category].map(p => (
                  <ProductCardList key={p.id} product={p} shopSlug={shopSlug} primaryColor={primaryColor} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {byCategory[category].map(p => (
                  <ProductCardGrid key={p.id} product={p} shopSlug={shopSlug} primaryColor={primaryColor} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
