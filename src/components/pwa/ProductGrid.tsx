'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutList, LayoutGrid, Search, Package, Star, Tag, X } from 'lucide-react'
import type { Product, ProductPhoto, ProductVariant } from '@/types'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { displayName } from '@/lib/utils/display-name'

interface ProductGridProps {
  products: Product[]
  shopSlug: string
  primaryColor: string
  currency?: ShopCurrency
  defaultView?: 'list' | 'grid'
  /** Réglage boutique (§4.7) — plus un choix par produit. Repli 'square' tant
   * que le marchand n'a pas encore modifié ce réglage (défaut colonne DB). */
  imageRatio?: 'square' | 'portrait'
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
// Au-delà de 30 % du catalogue actif "récent", le badge ne distingue plus
// personne — il disparaît pour tout le monde plutôt que de perdre son sens.
const NEW_BADGE_MAX_SHARE = 0.3

function isNew(product: Product): boolean {
  const createdAt = (product as Product & { created_at?: string }).created_at
  if (!createdAt) return false
  return Date.now() - new Date(createdAt).getTime() < FOURTEEN_DAYS_MS
}


function getPrimaryPhoto(product: Product): string | null {
  if (Array.isArray(product.photos) && (product.photos as unknown as ProductPhoto[]).length > 0) {
    const photos = product.photos as unknown as ProductPhoto[]
    return photos.find(p => p.is_primary)?.url ?? photos[0]?.url ?? null
  }
  return product.photo_url
}

function getPrice(product: Product, currency: ShopCurrency): string {
  const variants = product.variants as ProductVariant[] | null
  if (variants && variants.length > 0) {
    const prices = variants.map(v => v.price).filter(p => p > 0)
    if (prices.length > 0) {
      const min = Math.min(...prices)
      return `À partir de ${formatPrice(min, currency)}`
    }
  }
  return formatPrice(product.price, currency)
}

function FeaturedCard({ product, shopSlug, primaryColor, currency, showNewBadge, imageRatio }: { product: Product; shopSlug: string; primaryColor: string; currency: ShopCurrency; showNewBadge: boolean; imageRatio: 'square' | 'portrait' }) {
  const photo = getPrimaryPhoto(product)
  const price = getPrice(product, currency)
  const isPortrait = imageRatio === 'portrait'
  const soldOut = product.stock_count === 0
  const newProduct = showNewBadge && isNew(product)

  return (
    <Link href={`/${shopSlug}/produit/${product.id}`} className={`shrink-0 w-44 group ${soldOut ? 'opacity-60' : ''}`}>
      <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="relative">
          {photo ? (
            <div className={`relative w-full ${isPortrait ? 'aspect-[3/4]' : 'aspect-square'}`}>
              <Image
                src={photo}
                alt={product.name}
                fill
                sizes="176px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className={`flex items-center justify-center bg-gray-100 ${isPortrait ? 'aspect-[3/4]' : 'aspect-square'}`}>
              <Package className="h-8 w-8 text-gray-300" />
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-[9px] font-bold text-white text-center leading-tight px-1">RUPTURE</span>
            </div>
          )}
          {newProduct && !soldOut && (
            <span className="absolute top-1.5 left-1.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
              NOUVEAU
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-semibold text-gray-900 line-clamp-2">{displayName(product.name)}</p>
          <p className={`mt-0.5 text-xs font-bold truncate ${soldOut ? 'text-gray-400' : ''}`} style={soldOut ? {} : { color: primaryColor }}>{soldOut ? 'Rupture de stock' : price}</p>
        </div>
      </div>
    </Link>
  )
}

function ProductCardList({ product, shopSlug, primaryColor, currency, showNewBadge, imageRatio }: { product: Product; shopSlug: string; primaryColor: string; currency: ShopCurrency; showNewBadge: boolean; imageRatio: 'square' | 'portrait' }) {
  const photo = getPrimaryPhoto(product)
  const price = getPrice(product, currency)
  const isPortrait = imageRatio === 'portrait'
  // Hauteur fixe pour aligner toute la liste, largeur dérivée du ratio 3:4
  // en portrait — même principe que la bande de vignettes de ProductGallery.tsx.
  const imageWidth = isPortrait ? 54 : 72
  const soldOut = product.stock_count === 0
  const lowStock = product.stock_count !== null && product.stock_count > 0 && product.stock_count <= 3
  const newProduct = showNewBadge && isNew(product)

  return (
    <Link
      href={`/${shopSlug}/produit/${product.id}`}
      className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform ${soldOut ? 'opacity-60' : ''}`}
    >
      <div className="relative shrink-0">
        {photo ? (
          <div className="relative rounded-xl overflow-hidden" style={{ height: 72, width: imageWidth }}>
            <Image
              src={photo}
              alt={product.name}
              fill
              sizes={`${imageWidth}px`}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl bg-gray-100" style={{ height: 72, width: imageWidth }}>
            <Package className="h-6 w-6 text-gray-300" />
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
            <span className="text-[9px] font-bold text-white text-center leading-tight px-1">RUPTURE</span>
          </div>
        )}
        {newProduct && !soldOut && (
          <span className="absolute -top-1 -right-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
            NEW
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{displayName(product.name)}</p>
        {product.description && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description.replace(/!\[[^\]]*\]\([^)]+\)\s*/g, '').trim()}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className={`text-sm font-bold ${soldOut ? 'text-gray-400' : ''}`} style={soldOut ? {} : { color: primaryColor }}>{price}</span>
            {lowStock && (
              <p className="text-[10px] text-amber-500 font-medium">Plus que {product.stock_count} dispo</p>
            )}
          </div>
          {soldOut ? (
            <span className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-400">
              Rupture
            </span>
          ) : (
            <span
              className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Voir →
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function ProductCardGrid({ product, shopSlug, primaryColor, currency, showNewBadge, imageRatio }: { product: Product; shopSlug: string; primaryColor: string; currency: ShopCurrency; showNewBadge: boolean; imageRatio: 'square' | 'portrait' }) {
  const photo = getPrimaryPhoto(product)
  const price = getPrice(product, currency)
  const aspectClass = imageRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square'
  const soldOut = product.stock_count === 0
  const lowStock = product.stock_count !== null && product.stock_count > 0 && product.stock_count <= 3
  const newProduct = showNewBadge && isNew(product)

  return (
    <Link href={`/${shopSlug}/produit/${product.id}`} className={`group ${soldOut ? 'opacity-60' : ''}`}>
      <div className="rounded-2xl bg-white overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
        <div className={`relative ${aspectClass}`}>
          {photo ? (
            <Image
              src={photo}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 200px, 300px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-[9px] font-bold text-white text-center leading-tight px-1">RUPTURE</span>
            </div>
          )}
          {newProduct && !soldOut && (
            <span className="absolute top-1.5 left-1.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
              NOUVEAU
            </span>
          )}
          {lowStock && (
            <span className="absolute top-1.5 right-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
              Dernières pièces
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{displayName(product.name)}</p>
          <p className={`mt-0.5 text-xs font-bold truncate ${soldOut ? 'text-gray-400' : ''}`} style={soldOut ? {} : { color: primaryColor }}>{soldOut ? 'Rupture de stock' : price}</p>
          {lowStock && (
            <p className="text-[10px] text-amber-500 font-medium">Plus que {product.stock_count} dispo</p>
          )}
        </div>
      </div>
    </Link>
  )
}

// Filtres curatés (§4.6) — clés internes, jamais affichées, ne peuvent pas
// entrer en collision avec un nom de catégorie réel.
const FILTER_DISPO   = '__dispo__'
const FILTER_BUDGET  = '__budget__'
// Part la plus basse du catalogue considérée "petit budget" — dérivée du
// catalogue de CHAQUE boutique, jamais d'un seuil en dur : un chiffre fixe
// (ex. "10 000 FCFA") n'a aucun sens dès qu'une boutique facture en EUR/CAD.
const BUDGET_PERCENTILE = 0.33
const BUDGET_MIN_PRODUCTS = 5

export function ProductGrid({ products, shopSlug, primaryColor, currency = 'XOF', defaultView = 'list', imageRatio = 'square' }: ProductGridProps) {
  const [view, setView] = useState<'list' | 'grid'>(defaultView)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const featured = useMemo(
    () => products.filter(p => (p as Product & { is_featured?: boolean | null }).is_featured),
    [products]
  )

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category ?? '').filter(Boolean)))
    return cats
  }, [products])

  // "Disponible tout de suite" — n'apparaît que s'il existe au moins un
  // produit en rupture, sinon le filtre ne distinguerait jamais rien (Règle B).
  const hasSoldOut = useMemo(() => products.some(p => p.stock_count === 0), [products])

  // "Petit budget" — percentile du catalogue actif de cette boutique précise,
  // masqué si le catalogue est trop petit pour qu'un percentile ait un sens,
  // ou si le seuil calculé ne sépare rien de rien (tous au-dessus ou en dessous).
  const budgetThreshold = useMemo(() => {
    if (products.length < BUDGET_MIN_PRODUCTS) return null
    const prices = products.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b)
    if (prices.length < BUDGET_MIN_PRODUCTS) return null
    const threshold = prices[Math.floor(prices.length * BUDGET_PERCENTILE)]
    const below = products.filter(p => p.price > 0 && p.price <= threshold).length
    if (below === 0 || below === prices.length) return null
    return threshold
  }, [products])

  const filtered = useMemo(() => {
    let result = products
    if (activeFilter === FILTER_DISPO) {
      result = result.filter(p => p.stock_count === null || p.stock_count > 0)
    } else if (activeFilter === FILTER_BUDGET && budgetThreshold !== null) {
      result = result.filter(p => p.price > 0 && p.price <= budgetThreshold)
    } else if (activeFilter) {
      result = result.filter(p => p.category === activeFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [products, activeFilter, budgetThreshold, search])

  const byCategory = useMemo(() => {
    return filtered.reduce<Record<string, Product[]>>((acc, p) => {
      const cat = p.category ?? ''
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(p)
      return acc
    }, {})
  }, [filtered])

  const catKeys = Object.keys(byCategory)
  const hasCategories = catKeys.length > 1 || (catKeys.length === 1 && catKeys[0] !== '')

  const isFiltered = search.trim() !== '' || activeFilter !== null

  // Badge NOUVEAU : deux conditions cumulatives — produit <14j (isNew) ET part
  // du catalogue actif "récent" sous le plafond, sinon il ne distingue plus
  // personne et disparaît pour tout le monde.
  const showNewBadge = useMemo(() => {
    if (products.length === 0) return false
    const newCount = products.filter(isNew).length
    return newCount / products.length <= NEW_BADGE_MAX_SHARE
  }, [products])

  return (
    <div>
      {/* Produits en vedette */}
      {featured.length > 0 && !isFiltered && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Coups de cœur</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {featured.map(p => (
              <FeaturedCard key={p.id} product={p} shopSlug={shopSlug} primaryColor={primaryColor} currency={currency} showNewBadge={showNewBadge} imageRatio={imageRatio} />
            ))}
          </div>
        </div>
      )}

      {/* En-tête catalogue (maquette) — nombre de produits, avant la recherche */}
      <div className="flex items-baseline gap-3 px-4 pt-4">
        <h2 className="text-lg font-bold text-gray-900">Le catalogue</h2>
        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
          {products.length} produit{products.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Barre de recherche — ancre de la barre supérieure fixe mobile (scroll-mt pour ne pas passer sous elle) */}
      <div id="product-search" className="px-4 pt-3 pb-2 scroll-mt-14">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-gray-300 placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtres catégories + toggle vue */}
      <div className="flex items-center gap-2 px-4 py-2">
        {(categories.length > 0 || hasSoldOut || budgetThreshold !== null) && (
          <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide pb-0.5">
            <button
              onClick={() => setActiveFilter(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeFilter === null
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeFilter === null ? { backgroundColor: primaryColor } : {}}
            >
              Tout
            </button>
            {hasSoldOut && (
              <button
                onClick={() => setActiveFilter(activeFilter === FILTER_DISPO ? null : FILTER_DISPO)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeFilter === FILTER_DISPO
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeFilter === FILTER_DISPO ? { backgroundColor: primaryColor } : {}}
              >
                Disponible tout de suite
              </button>
            )}
            {budgetThreshold !== null && (
              <button
                onClick={() => setActiveFilter(activeFilter === FILTER_BUDGET ? null : FILTER_BUDGET)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeFilter === FILTER_BUDGET
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeFilter === FILTER_BUDGET ? { backgroundColor: primaryColor } : {}}
              >
                Petit budget
              </button>
            )}
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeFilter === cat
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeFilter === cat ? { backgroundColor: primaryColor } : {}}
              >
                {displayName(cat)}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            onClick={() => setView('list')}
            className={`rounded-lg p-1.5 transition-colors ${view === 'list' ? '' : 'text-gray-400 hover:text-gray-600'}`}
            style={view === 'list' ? { color: primaryColor } : {}}
            title="Vue liste"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`rounded-lg p-1.5 transition-colors ${view === 'grid' ? '' : 'text-gray-400 hover:text-gray-600'}`}
            style={view === 'grid' ? { color: primaryColor } : {}}
            title="Vue grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className="px-4 pb-6 space-y-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Aucun produit trouvé</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-2 text-xs font-medium" style={{ color: primaryColor }}>
                Effacer la recherche
              </button>
            )}
          </div>
        ) : catKeys.map(category => (
          <div key={category}>
            {hasCategories && category && (
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-3 w-3 text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{displayName(category)}</p>
              </div>
            )}
            {view === 'list' ? (
              <div className="space-y-2.5">
                {byCategory[category].map(p => (
                  <ProductCardList key={p.id} product={p} shopSlug={shopSlug} primaryColor={primaryColor} currency={currency} showNewBadge={showNewBadge} imageRatio={imageRatio} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {byCategory[category].map(p => (
                  <ProductCardGrid key={p.id} product={p} shopSlug={shopSlug} primaryColor={primaryColor} currency={currency} showNewBadge={showNewBadge} imageRatio={imageRatio} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
