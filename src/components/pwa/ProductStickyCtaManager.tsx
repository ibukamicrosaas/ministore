'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

interface Props {
  href: string
  color: string
  productId: string
  productName: string
  price: number
  displayPrice: string
  isDigital?: boolean
  /** 'mobile' (défaut) : barre fixe pleine largeur en bas d'écran, lg:hidden.
   * 'desktop' : carte compacte destinée à la colonne galerie sticky (fiche
   * produit desktop, voir REPRISE.md §70) — même état, mêmes événements,
   * seul le rendu change. Sans elle, Commander n'était accessible sur
   * desktop que via le bouton inline, perdu dès qu'on scrolle la colonne
   * infos au-delà — contrairement à mobile qui a toujours eu son repli. */
  variant?: 'mobile' | 'desktop'
}

type VariantEvent = { label: string | null; price: number; href: string; disabled: boolean }

/** Bouton sticky — n'apparaît que quand le bouton inline (VariantSelectorCta) est hors du viewport */
export function ProductStickyCta({ href: initialHref, color, productId, productName, price, displayPrice, isDigital = false, variant = 'mobile' }: Props) {
  // Un seul libellé d'action de bout en bout (§6.6 de SPEC-v2) — même mot que
  // le bouton inline (VariantSelectorCta) et la barre haute : « Je le prends » disparaît.
  const defaultLabel = isDigital ? 'Acheter' : 'Commander'
  const [visible,  setVisible]  = useState(false)
  const [ctaHref,  setCtaHref]  = useState(initialHref)
  const [ctaLabel, setCtaLabel] = useState(defaultLabel)
  const [ctaPrice, setCtaPrice] = useState(price)
  const [disabled, setDisabled] = useState(false)
  const router = useRouter()

  const barRef = useRef<HTMLDivElement>(null)
  const [barHeight, setBarHeight] = useState(0)

  useEffect(() => {
    function onVisibility(e: Event) {
      const detail = (e as CustomEvent<{ visible: boolean }>).detail
      setVisible(!detail.visible)
    }
    function onVariant(e: Event) {
      const d = (e as CustomEvent<VariantEvent>).detail
      setCtaHref(d.href)
      setCtaPrice(d.price)
      setCtaLabel(d.label ? `${defaultLabel} — ${d.label}` : defaultLabel)
      setDisabled(d.disabled)
    }
    window.addEventListener('inline-cta-visibility', onVisibility)
    window.addEventListener('variant-selected',      onVariant)
    return () => {
      window.removeEventListener('inline-cta-visibility', onVisibility)
      window.removeEventListener('variant-selected',      onVariant)
    }
  }, [displayPrice, defaultLabel])

  // Hauteur réelle mesurée, pas devinée (SPEC-v2 §5.5) — au montage, au
  // redimensionnement, et à chaque changement de libellé (une variante
  // sélectionnée peut l'allonger jusqu'à passer sur deux lignes).
  useLayoutEffect(() => {
    function measure() {
      if (barRef.current) setBarHeight(barRef.current.offsetHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [ctaLabel])

  function handleClick() {
    if (disabled) return
    trackMetaEvent('AddToCart', {
      content_ids:  [productId],
      content_name: productName,
      content_type: 'product',
      value:        ctaPrice,
      currency:     'XOF',
    })
    router.push(ctaHref)
  }

  // Carte compacte desktop — même état/événements que la barre mobile,
  // rendu différent. Pas de spacer : elle vit dans le flux normal de la
  // colonne galerie sticky, pas en position fixed.
  if (variant === 'desktop') {
    return (
      <div
        aria-hidden={!visible}
        className={`hidden lg:block mt-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-lg transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          tabIndex={visible ? undefined : -1}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: color }}
        >
          <ShoppingBag className="h-4 w-4" />
          {ctaLabel}
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        ref={barRef}
        aria-hidden={!visible}
        className={`fixed bottom-0 left-0 right-0 px-4 pt-4 bg-gradient-to-t from-white via-white to-transparent max-w-lg mx-auto lg:hidden transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          tabIndex={visible ? undefined : -1}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: color }}
        >
          <ShoppingBag className="h-5 w-5" />
          {ctaLabel}
        </button>
      </div>
      {/* Réserve la place de la barre dans le flux normal — évite qu'elle
          recouvre le contenu en dessous d'elle une fois affichée (bug 2.2). */}
      <div className="lg:hidden" style={{ height: barHeight }} aria-hidden="true" />
    </>
  )
}
