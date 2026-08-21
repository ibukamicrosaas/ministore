'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

interface Variant {
  label: string
  price: number
}

interface Props {
  baseHref: string
  color: string
  productId: string
  productName: string
  variants: Variant[]
  minPrice: number
  currency: ShopCurrency
  isDigital?: boolean
  stockCount?: number | null
}

export function VariantSelectorCta({
  baseHref, color, productId, productName, variants, minPrice, currency, isDigital = false, stockCount,
}: Props) {
  const [selected, setSelected] = useState<Variant | null>(null)
  const [quantity, setQuantity]  = useState(1)
  const ref    = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const maxQty = stockCount != null ? Math.min(stockCount, 10) : 10

  const buildHref = (sel: Variant | null, qty: number) => {
    let h = baseHref
    if (sel) h += `&variant=${encodeURIComponent(sel.label)}`
    if (!isDigital) h += `&qty=${qty}`
    return h
  }

  // Notifie le sticky CTA de l'état inline
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(new CustomEvent('inline-cta-visibility', { detail: { visible: entry.isIntersecting } }))
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Propage variante + quantité au sticky CTA
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('variant-selected', {
        detail: {
          label:    selected?.label ?? null,
          price:    selected?.price ?? minPrice,
          href:     buildHref(selected, quantity),
          disabled: variants.length > 0 && !selected,
        },
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, quantity, baseHref, minPrice, variants.length])

  const allSamePrice = variants.every(v => v.price === variants[0]?.price)
  const href = buildHref(selected, quantity)

  function handleClick() {
    if (variants.length > 0 && !selected) return
    trackMetaEvent('AddToCart', {
      content_ids:  [productId],
      content_name: productName,
      content_type: 'product',
      value:        selected?.price ?? minPrice,
      currency:     'XOF',
    })
    router.push(href)
  }

  // Un seul libellé d'action de bout en bout (§6.6 de SPEC-v2) : « Commander »
  // ici, sur la barre haute, et à l'ouverture du tunnel — « Je le prends » disparaît.
  const ctaPrefix = isDigital ? 'Acheter' : 'Commander'
  const ctaLabel  = variants.length === 0 || selected ? ctaPrefix : 'Choisir une variante'
  const ctaDisabled = variants.length > 0 && !selected

  return (
    <div className="mt-4 space-y-3">
      {/* Chips variantes */}
      {variants.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {selected ? `Variante : ${selected.label}` : 'Choisir une variante'}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
              const isSelected = selected?.label === v.label
              const showPrice  = !allSamePrice
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : v)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold border transition-all"
                  style={isSelected ? {
                    backgroundColor: color, borderColor: color, color: '#fff',
                  } : {
                    backgroundColor: `color-mix(in srgb, ${color} 5%, white)`, borderColor: `color-mix(in srgb, ${color} 19%, white)`, color: '#374151',
                  }}
                >
                  {v.label}
                  {showPrice && (
                    <span className={`ml-1.5 font-bold ${isSelected ? 'text-white/80' : ''}`}
                      style={!isSelected ? { color } : undefined}>
                      {formatPrice(v.price, currency)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sélecteur de quantité — uniquement pour les produits physiques */}
      {!isDigital && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Quantité</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Diminuer la quantité"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-gray-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Augmenter la quantité"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CTA inline */}
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={ctaDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: color }}
      >
        <ShoppingBag className="h-5 w-5" />
        {ctaLabel}
      </button>
    </div>
  )
}
