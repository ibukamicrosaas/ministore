'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

interface Variant {
  label: string
  price: number
}

interface Props {
  baseHref: string   // ex: /boutique/commander?product=xxx (sans &variant=...)
  color: string
  productId: string
  productName: string
  variants: Variant[]
  minPrice: number
  currency: ShopCurrency
}

export function VariantSelectorCta({
  baseHref, color, productId, productName, variants, minPrice, currency,
}: Props) {
  const [selected, setSelected] = useState<Variant | null>(null)
  const ref    = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  // Notifie le sticky CTA de l'état inline et de la variante sélectionnée
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(
          new CustomEvent('inline-cta-visibility', { detail: { visible: entry.isIntersecting } })
        )
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Propage la variante sélectionnée au sticky CTA
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('variant-selected', {
        detail: {
          label:    selected?.label ?? null,
          price:    selected?.price ?? minPrice,
          href:     selected ? `${baseHref}&variant=${encodeURIComponent(selected.label)}` : baseHref,
          disabled: variants.length > 0 && !selected,
        },
      })
    )
  }, [selected, baseHref, minPrice, variants.length])

  const allSamePrice = variants.every(v => v.price === variants[0]?.price)
  const href = selected
    ? `${baseHref}&variant=${encodeURIComponent(selected.label)}`
    : baseHref

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

  const ctaLabel = variants.length === 0
    ? `Je le prends — ${formatPrice(minPrice, currency)}`
    : selected
      ? `Je le prends — ${formatPrice(selected.price, currency)}`
      : 'Choisir une variante'

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
                    backgroundColor: color,
                    borderColor:     color,
                    color:           '#fff',
                  } : {
                    backgroundColor: `${color}0D`,
                    borderColor:     `${color}30`,
                    color:           '#374151',
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
