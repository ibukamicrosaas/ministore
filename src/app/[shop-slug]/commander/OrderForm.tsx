'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ChevronDown, ChevronLeft, Package, MapPin, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ProductVariant, DeliveryZone } from '@/types'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'

const COUNTRIES = [
  // Afrique
  { code: 'SN', flag: '🇸🇳', dial: '+221', name: 'Sénégal' },
  { code: 'CI', flag: '🇨🇮', dial: '+225', name: "Côte d'Ivoire" },
  { code: 'TG', flag: '🇹🇬', dial: '+228', name: 'Togo' },
  { code: 'BJ', flag: '🇧🇯', dial: '+229', name: 'Bénin' },
  { code: 'BF', flag: '🇧🇫', dial: '+226', name: 'Burkina Faso' },
  { code: 'ML', flag: '🇲🇱', dial: '+223', name: 'Mali' },
  // Europe & Canada
  { code: 'FR', flag: '🇫🇷', dial: '+33',  name: 'France' },
  { code: 'BE', flag: '🇧🇪', dial: '+32',  name: 'Belgique' },
  { code: 'LU', flag: '🇱🇺', dial: '+352', name: 'Luxembourg' },
  { code: 'CH', flag: '🇨🇭', dial: '+41',  name: 'Suisse' },
  { code: 'CA', flag: '🇨🇦', dial: '+1',   name: 'Canada' },
]

const PHONE_PLACEHOLDERS: Record<string, string> = {
  '+221': '77 000 00 00',    // SN — 8 chiffres
  '+225': '07 00 00 00 00',  // CI — 10 chiffres
  '+228': '90 00 00 00',     // TG — 8 chiffres
  '+229': '97 00 00 00',     // BJ — 8 chiffres
  '+226': '70 00 00 00',     // BF — 8 chiffres
  '+223': '70 00 00 00',     // ML — 8 chiffres
  '+33':  '6 00 00 00 00',   // FR — mobile 9 chiffres
  '+32':  '470 00 00 00',    // BE — mobile 9 chiffres
  '+352': '621 000 000',     // LU — mobile
  '+41':  '76 000 00 00',    // CH — mobile 9 chiffres
  '+1':   '514 000 0000',    // CA — 10 chiffres
}

function SectionLabel({
  n,
  label,
  primaryColor,
}: {
  n: number
  label: string
  primaryColor: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {n}
      </div>
      <p className="text-sm font-bold text-gray-900">{label}</p>
    </div>
  )
}

function RadioCard({
  checked,
  primaryColor,
  children,
}: {
  checked: boolean
  primaryColor: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
        checked ? '' : 'border-gray-200 bg-white'
      }`}
      style={checked ? { borderColor: primaryColor, backgroundColor: `${primaryColor}0d` } : {}}
    >
      <div
        className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center"
        style={checked ? { borderColor: primaryColor } : { borderColor: '#d1d5db' }}
      >
        {checked && (
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
        )}
      </div>
      {children}
    </div>
  )
}

function PhoneInput({
  value,
  onChange,
  dialCode,
  onDialChange,
  placeholder,
  countries,
}: {
  value: string
  onChange: (v: string) => void
  dialCode: string
  onDialChange: (d: string) => void
  placeholder: string
  countries: typeof COUNTRIES
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const selected = countries.find((c) => c.dial === dialCode) ?? countries[0]

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-gray-300">
      <div className="relative shrink-0 border-r border-gray-200" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-full items-center gap-1.5 bg-gray-50 px-3 text-sm font-medium text-gray-700 rounded-l-xl"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span>{selected.dial}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {countries.map((c) => {
              const isSelected = c.dial === dialCode
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onDialChange(c.dial); setOpen(false) }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-gray-50 font-semibold' : ''
                  }`}
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="flex-1 text-left text-gray-800">{c.name}</span>
                  <span className="font-mono text-xs text-gray-500">{c.dial}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
      />
    </div>
  )
}

interface ProductOption {
  id: string
  name: string
  price: number
  photo: string | null
  variants: ProductVariant[] | null
  deposit_percentage: number | null
  stock_count: number | null
  customization_enabled: boolean
  customization_label: string | null
}

interface OrderItem {
  product_id: string
  variant_label: string | null
  quantity: number
  customization_note: string
}

interface Props {
  shopId: string
  shopSlug: string
  shopName: string
  shopLogoUrl: string | null
  shopCity: string | null
  shopCountry: string
  shopCurrency: ShopCurrency
  primaryColor: string
  products: ProductOption[]
  deliveryDates: { value: string; label: string }[]
  deliveryOptions: { home_delivery: boolean; store_pickup: boolean }
  shopDepositPct: number
  acceptOnlinePayment: boolean
  acceptCashOnDelivery: boolean
  deliveryZones: DeliveryZone[]
  targetCountries: string[] | null
  preselectedProductId: string | null
}

export function OrderForm({
  shopId,
  shopSlug,
  shopName,
  shopLogoUrl,
  shopCity,
  shopCountry,
  shopCurrency,
  primaryColor,
  products,
  deliveryDates,
  deliveryOptions,
  shopDepositPct,
  acceptOnlinePayment,
  acceptCashOnDelivery,
  deliveryZones,
  targetCountries,
  preselectedProductId,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    firstName?: string
    phone?: string
    address?: string
  }>({})

  // Filtrer les pays selon les marchés cibles de la boutique
  const availableCountries = targetCountries && targetCountries.length > 0
    ? COUNTRIES.filter(c => targetCountries.includes(c.code))
    : COUNTRIES

  const defaultDial = (availableCountries.find((c) => c.code === shopCountry) ?? availableCountries[0])?.dial ?? '+221'
  const CART_KEY    = `tekki_cart_${shopId}`

  const makeItem = (productId?: string): OrderItem => ({
    product_id: productId ?? products[0]?.id ?? '',
    variant_label: null,
    quantity: 1,
    customization_note: '',
  })

  type SavedCart = { items?: OrderItem[]; firstName?: string; phoneNum?: string; phoneDial?: string; address?: string; _ts?: number }

  // Fonctions panier — appelées dans des handlers (événements), jamais pendant le render
  function saveCart(patch: Partial<SavedCart>) {
    try {
      const raw  = localStorage.getItem(CART_KEY)
      const prev = raw ? (JSON.parse(raw) as SavedCart) : {}
      localStorage.setItem(CART_KEY, JSON.stringify({ ...prev, ...patch, _ts: Date.now() }))
    } catch {}
  }

  function clearCart() {
    try { localStorage.removeItem(CART_KEY) } catch {}
  }

  // Lazy initializer : s'exécute une seule fois à l'init, jamais pendant un re-render
  const [saved] = useState<SavedCart>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (!raw) return {}
      const data = JSON.parse(raw) as SavedCart
      const ts   = typeof data._ts === 'number' ? data._ts : 0
      if (Date.now() - ts > 24 * 60 * 60 * 1000) { localStorage.removeItem(CART_KEY); return {} }
      return data
    } catch { return {} }
  })

  const [items, setItems] = useState<OrderItem[]>(
    saved.items?.length ? saved.items : [makeItem(preselectedProductId ?? undefined)]
  )

  // InitiateCheckout : déclenché une seule fois à l'ouverture du formulaire
  useEffect(() => {
    trackMetaEvent('InitiateCheckout')
  }, [])
  const [deliveryDate, setDeliveryDate] = useState(deliveryDates[0]?.value ?? '')
  const [firstName, setFirstName] = useState(saved.firstName ?? '')
  const [phoneDial, setPhoneDial] = useState(saved.phoneDial ?? defaultDial)
  const [phoneNum, setPhoneNum] = useState(saved.phoneNum ?? '')
  const [sameWa, setSameWa] = useState(true)
  const [waDial, setWaDial] = useState(defaultDial)
  const [waNum, setWaNum] = useState('')
  const [deliveryType, setDeliveryType] = useState<'home_delivery' | 'store_pickup'>(
    deliveryOptions.home_delivery ? 'home_delivery' : 'store_pickup',
  )
  const [selectedZoneId, setSelectedZoneId] = useState<string>(deliveryZones[0]?.id ?? '')
  const [showAllZones, setShowAllZones]     = useState(false)
  const ZONES_VISIBLE = 5
  const [address, setAddress] = useState(saved.address ?? '')
  const [notes, setNotes] = useState('')
  // Si le cash à la livraison est désactivé, forcer le paiement en ligne
  const [paymentType, setPaymentType] = useState<'online' | 'on_delivery'>(
    acceptCashOnDelivery ? 'on_delivery' : 'online'
  )
  // Code promo
  const [promoCode, setPromoCode]         = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoStatus, setPromoStatus]     = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [promoError, setPromoError]       = useState('')

  async function applyPromoCode() {
    const trimmed = promoCode.trim().toUpperCase()
    if (!trimmed) return
    setPromoStatus('checking')
    try {
      const res  = await fetch(`/api/shops/check-promo?shopId=${shopId}&code=${encodeURIComponent(trimmed)}`)
      const data = await res.json() as { valid: boolean; discount_pct?: number; error?: string }
      if (data.valid && data.discount_pct) {
        setPromoDiscount(data.discount_pct)
        setPromoStatus('valid')
        setPromoError('')
      } else {
        setPromoDiscount(0)
        setPromoStatus('invalid')
        setPromoError(data.error ?? 'Code invalide')
      }
    } catch {
      setPromoStatus('invalid')
      setPromoError('Erreur réseau')
    }
  }

  function getProduct(id: string) {
    return products.find((p) => p.id === id)
  }

  function updateItem(index: number, patch: Partial<OrderItem>) {
    setItems((prev) => {
      const next = prev.map((it, i) => {
        if (i !== index) return it
        const updated = { ...it, ...patch }
        if (patch.product_id) updated.variant_label = null
        return updated
      })
      saveCart({ items: next })
      return next
    })
  }

  function addItem() {
    if (items.length >= 5) {
      toast.error('Maximum 5 articles par commande.')
      return
    }
    setItems((prev) => [...prev, makeItem()])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId) ?? null
  const deliveryPrice = (deliveryType === 'home_delivery' && deliveryZones.length > 0 && selectedZone)
    ? selectedZone.price
    : 0

  function computeTotal() {
    const itemsTotal = items.reduce((sum, it) => {
      const p = getProduct(it.product_id)
      if (!p) return sum
      let price = p.price
      if (it.variant_label && p.variants) {
        const v = p.variants.find((v) => v.label === it.variant_label)
        if (v) price = v.price
      }
      return sum + price * it.quantity
    }, 0)
    return itemsTotal + deliveryPrice
  }

  function computeDeposit() {
    const rawDeposit = items.reduce((sum, it) => {
      const p = getProduct(it.product_id)
      if (!p) return sum
      const pct = p.deposit_percentage != null ? p.deposit_percentage : shopDepositPct
      if (pct === 0) return sum
      let price = p.price
      if (it.variant_label && p.variants) {
        const v = p.variants.find((v) => v.label === it.variant_label)
        if (v) price = v.price
      }
      return sum + Math.floor((price * it.quantity * pct) / 100)
    }, 0)
    // Appliquer la remise promo à l'acompte (cohérent avec le serveur)
    return promoDiscount > 0 ? Math.floor(rawDeposit * (100 - promoDiscount) / 100) : rawDeposit
  }

  const itemsSubtotal  = items.reduce((sum, it) => {
    const p = getProduct(it.product_id)
    if (!p) return sum
    let price = p.price
    if (it.variant_label && p.variants) {
      const v = p.variants.find(v => v.label === it.variant_label)
      if (v) price = v.price
    }
    return sum + price * it.quantity
  }, 0)
  const promoAmount    = promoDiscount > 0 ? Math.floor(itemsSubtotal * promoDiscount / 100) : 0
  const total          = itemsSubtotal - promoAmount + deliveryPrice
  const subtotal       = itemsSubtotal + deliveryPrice  // pour l'affichage du sous-total si besoin
  void subtotal
  const deposit = paymentType === 'online' ? computeDeposit() : 0
  const hasDeposit = deposit > 0 && deposit < total

  const fullPhone = `${phoneDial}${phoneNum}`
  const fullWhatsapp = sameWa ? fullPhone : `${waDial}${waNum}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: typeof errors = {}
    if (!firstName.trim()) newErrors.firstName = 'Votre nom est obligatoire.'
    if (!phoneNum.trim())  newErrors.phone     = 'Votre téléphone est obligatoire.'
    if (deliveryType === 'home_delivery' && !address.trim())
      newErrors.address = "L'adresse de livraison est obligatoire."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    for (const it of items) {
      const p = getProduct(it.product_id)
      if (p?.stock_count === 0) {
        toast.error(`${p.name} est en rupture de stock.`)
        return
      }
      if (p?.stock_count != null && it.quantity > p.stock_count) {
        toast.error(`Stock insuffisant pour ${p.name} (max ${p.stock_count}).`)
        return
      }
      if (p?.customization_enabled && !it.customization_note.trim()) {
        const label = p.customization_label || 'personnalisation'
        toast.error(`Veuillez saisir le texte de ${label.toLowerCase()} pour "${p.name}".`)
        return
      }
    }

    const body = {
      shopId,
      items: items.map((it) => {
        const p = getProduct(it.product_id)!
        let price = p.price
        if (it.variant_label && p.variants) {
          const v = p.variants.find((v) => v.label === it.variant_label)
          if (v) price = v.price
        }
        return {
          product_id: it.product_id,
          product_name: p.name,
          variant_label: it.variant_label ?? null,
          unit_price: price,
          quantity: it.quantity,
          customization_note: it.customization_note.trim() || null,
        }
      }),
      delivery_date: deliveryDate || null,
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'home_delivery' ? address.trim() : null,
      client_first_name: firstName.trim(),
      client_phone: fullPhone,
      client_whatsapp: fullWhatsapp,
      notes: notes.trim() || null,
      delivery_zone_name: (deliveryType === 'home_delivery' && selectedZone) ? selectedZone.name : null,
      delivery_price: deliveryPrice,
      promo_code: promoStatus === 'valid' ? promoCode.trim().toUpperCase() : null,
      payment_type:
        paymentType === 'online'
          ? hasDeposit
            ? 'online_deposit'
            : 'online_full'
          : deliveryType === 'home_delivery'
            ? 'on_delivery'
            : 'on_site',
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { orderId?: string; clientToken?: string; redirect?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Une erreur est survenue.')
        return
      }

      // Commande créée avec succès → effacer le panier sauvegardé
      clearCart()

      if (data.redirect === 'pay' && data.orderId) {
        router.push(`/${shopSlug}/commander/pay?order_id=${data.orderId}&token=${data.clientToken ?? ''}`)
      } else {
        router.push(`/${shopSlug}/commander/success?order_id=${data.orderId}&token=${data.clientToken ?? ''}`)
      }
    } catch {
      toast.error('Erreur réseau. Réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-300 bg-white'

  return (
    <form onSubmit={handleSubmit} className="pb-32">
      {/* Shop header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
        <Link href={`/${shopSlug}`} className="shrink-0 text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {shopLogoUrl ? (
          <img src={shopLogoUrl} alt={shopName} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {shopName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{shopName}</p>
          {shopCity && (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-2.5 w-2.5" /> {shopCity}
            </p>
          )}
        </div>
        <p className="ml-auto shrink-0 text-xs font-semibold text-gray-500">Commander</p>
      </div>

      <div className="space-y-6 px-4 pt-5">
        {/* 1 — Articles */}
        <section>
          <SectionLabel n={1} label="Votre commande" primaryColor={primaryColor} />
          <div className="space-y-3">
            {items.map((item, i) => {
              const p = getProduct(item.product_id)
              return (
                <div key={i} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Article {i + 1}
                    </p>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {p?.photo ? (
                      <img
                        src={p.photo}
                        alt={p.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <div className="relative flex-1">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(i, { product_id: e.target.value })}
                        className={`${inputCls} appearance-none py-2.5 pr-10`}
                      >
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id} disabled={prod.stock_count === 0}>
                            {prod.name}{prod.stock_count === 0 ? ' — Rupture' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  {p?.stock_count === 0 && (
                    <p className="text-xs font-semibold text-red-500">Ce produit est en rupture de stock.</p>
                  )}

                  {p?.variants && p.variants.length > 0 && (
                    <div className="relative">
                      <select
                        value={item.variant_label ?? ''}
                        onChange={(e) => updateItem(i, { variant_label: e.target.value || null })}
                        className={`${inputCls} appearance-none pr-10`}
                      >
                        <option value="">— Choisir une variante —</option>
                        {p.variants.map((v, vi) => (
                          <option key={vi} value={v.label}>
                            {v.label} — {formatPrice(v.price, shopCurrency)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  )}

                  {p?.customization_enabled && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {p.customization_label || 'Personnalisation'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.customization_note}
                        onChange={(e) => updateItem(i, { customization_note: e.target.value })}
                        placeholder={p.customization_label ? `Ex : votre ${p.customization_label.toLowerCase()}` : 'Votre texte de personnalisation'}
                        maxLength={200}
                        className={inputCls}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Quantité</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateItem(i, { quantity: Math.max(1, item.quantity - 1) })}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxQty = p?.stock_count != null ? Math.min(p.stock_count, 5) : 5
                          updateItem(i, { quantity: Math.min(maxQty, item.quantity + 1) })
                        }}
                        disabled={p?.stock_count != null && item.quantity >= Math.min(p.stock_count, 5)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {items.length < 5 && (
            <button
              type="button"
              onClick={addItem}
              className="mt-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: primaryColor }}
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </button>
          )}
        </section>

        <div className="border-t border-gray-100" />

        {/* 2 — Date */}
        {deliveryDates.length > 0 && (
          <>
            <section>
              <SectionLabel n={2} label="Date de livraison" primaryColor={primaryColor} />
              <div className="relative">
                <select
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  {deliveryDates.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </section>
            <div className="border-t border-gray-100" />
          </>
        )}

        {/* 3 — Coordonnées */}
        <section>
          <SectionLabel n={3} label="Vos coordonnées" primaryColor={primaryColor} />
          <div className="space-y-3">
            <div>
              <input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (errors.firstName) setErrors(p => ({ ...p, firstName: undefined }))
                  saveCart({ firstName: e.target.value })
                }}
                placeholder="Nom complet *"
                className={`${inputCls} ${errors.firstName ? 'border-red-400 focus:border-red-400' : ''}`}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Téléphone *</label>
              <PhoneInput
                value={phoneNum}
                onChange={(v) => {
                  setPhoneNum(v)
                  if (errors.phone) setErrors(p => ({ ...p, phone: undefined }))
                  saveCart({ phoneNum: v })
                }}
                dialCode={phoneDial}
                onDialChange={(d) => { setPhoneDial(d); saveCart({ phoneDial: d }) }}
                placeholder={PHONE_PLACEHOLDERS[phoneDial] ?? '00 00 00 00'}
                countries={availableCountries}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                id="same-wa"
                checked={sameWa}
                onChange={(e) => setSameWa(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-sm text-gray-700">Même numéro pour WhatsApp</span>
            </label>
            {!sameWa && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">WhatsApp</label>
                <PhoneInput
                  value={waNum}
                  onChange={setWaNum}
                  dialCode={waDial}
                  onDialChange={setWaDial}
                  placeholder={PHONE_PLACEHOLDERS[waDial] ?? '00 00 00 00'}
                  countries={availableCountries}
                />
              </div>
            )}
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* 4 — Livraison */}
        {(deliveryOptions.home_delivery || deliveryOptions.store_pickup) && (
          <>
            <section>
              <SectionLabel n={4} label="Mode de réception" primaryColor={primaryColor} />
              <div className="space-y-2">
                {deliveryOptions.home_delivery && (
                  <label
                    className="block cursor-pointer"
                    onClick={() => setDeliveryType('home_delivery')}
                  >
                    <RadioCard checked={deliveryType === 'home_delivery'} primaryColor={primaryColor}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Livraison à domicile</p>
                        <p className="text-xs text-gray-500">Livré chez vous</p>
                      </div>
                    </RadioCard>
                  </label>
                )}
                {deliveryOptions.store_pickup && (
                  <label
                    className="block cursor-pointer"
                    onClick={() => setDeliveryType('store_pickup')}
                  >
                    <RadioCard checked={deliveryType === 'store_pickup'} primaryColor={primaryColor}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Retrait en boutique</p>
                        <p className="text-xs text-gray-500">Récupérez votre commande</p>
                      </div>
                    </RadioCard>
                  </label>
                )}
              </div>
              {deliveryType === 'home_delivery' && (
                <div className="mt-3 space-y-2">
                  {deliveryZones.length > 0 && (
                    <div className="space-y-2">
                      {(showAllZones ? deliveryZones : deliveryZones.slice(0, ZONES_VISIBLE)).map((z) => (
                        <label
                          key={z.id}
                          className="block cursor-pointer"
                          onClick={() => setSelectedZoneId(z.id)}
                        >
                          <RadioCard checked={selectedZoneId === z.id} primaryColor={primaryColor}>
                            <div className="flex w-full items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">{z.name}</p>
                              <p
                                className="text-sm font-bold shrink-0"
                                style={{ color: selectedZoneId === z.id ? primaryColor : '#6b7280' }}
                              >
                                {z.price > 0 ? formatPrice(z.price, shopCurrency) : 'Gratuit'}
                              </p>
                            </div>
                          </RadioCard>
                        </label>
                      ))}
                      {deliveryZones.length > ZONES_VISIBLE && (
                        <button
                          type="button"
                          onClick={() => setShowAllZones(v => !v)}
                          className="mt-1 text-xs font-semibold"
                          style={{ color: primaryColor }}
                        >
                          {showAllZones
                            ? 'Voir moins'
                            : `Voir ${deliveryZones.length - ZONES_VISIBLE} zone${deliveryZones.length - ZONES_VISIBLE > 1 ? 's' : ''} de plus`}
                        </button>
                      )}
                    </div>
                  )}
                  <div>
                    <textarea
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value)
                        if (errors.address) setErrors(p => ({ ...p, address: undefined }))
                        saveCart({ address: e.target.value })
                      }}
                      rows={2}
                      placeholder="Adresse de livraison * (quartier, rue, repère...)"
                      className={`${inputCls} resize-none ${errors.address ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                    {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                  </div>
                </div>
              )}
            </section>
            <div className="border-t border-gray-100" />
          </>
        )}

        {/* 5 — Notes */}
        <section>
          <SectionLabel n={5} label="Notes (optionnel)" primaryColor={primaryColor} />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Allergies, instructions particulières..."
            className={`${inputCls} resize-none`}
          />
        </section>

        <div className="border-t border-gray-100" />

        {/* 6 — Code promo */}
        <section>
          <SectionLabel n={6} label="Code promo (optionnel)" primaryColor={primaryColor} />
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={e => {
                setPromoCode(e.target.value.toUpperCase())
                if (promoStatus !== 'idle') { setPromoStatus('idle'); setPromoDiscount(0) }
              }}
              onKeyDown={e => e.key === 'Enter' && applyPromoCode()}
              placeholder="Ex : SOLDES15"
              maxLength={30}
              className={`${inputCls} flex-1 font-mono uppercase ${
                promoStatus === 'valid'   ? 'border-green-400' :
                promoStatus === 'invalid' ? 'border-red-400'   : ''
              }`}
              autoCapitalize="characters"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={applyPromoCode}
              disabled={!promoCode.trim() || promoStatus === 'checking'}
              className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              {promoStatus === 'checking' ? '...' : 'Appliquer'}
            </button>
          </div>
          {promoStatus === 'valid' && (
            <p className="mt-1 text-xs text-green-600 font-medium">
              ✓ Code valide — {promoDiscount}% de réduction ({formatPrice(promoAmount, shopCurrency)})
            </p>
          )}
          {promoStatus === 'invalid' && (
            <p className="mt-1 text-xs text-red-500">{promoError}</p>
          )}
        </section>

        <div className="border-t border-gray-100" />

        {/* 7 — Paiement */}
        <section>
          <SectionLabel n={7} label="Mode de paiement" primaryColor={primaryColor} />
          <div className="space-y-2">
            {acceptOnlinePayment && (
              <label className="block cursor-pointer" onClick={() => setPaymentType('online')}>
                <RadioCard checked={paymentType === 'online'} primaryColor={primaryColor}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Payer maintenant</p>
                    <p className="text-xs text-gray-500">Wave, Orange Money, Maxit</p>
                    {paymentType === 'online' && hasDeposit && (
                      <p className="mt-1 text-xs font-bold" style={{ color: primaryColor }}>
                        Acompte : {formatPrice(deposit, shopCurrency)}
                      </p>
                    )}
                    {paymentType === 'online' && !hasDeposit && total > 0 && (
                      <p className="mt-1 text-xs font-bold" style={{ color: primaryColor }}>
                        Total : {formatPrice(total, shopCurrency)}
                      </p>
                    )}
                  </div>
                </RadioCard>
              </label>
            )}
            {acceptCashOnDelivery && (
              <label className="block cursor-pointer" onClick={() => setPaymentType('on_delivery')}>
                <RadioCard checked={paymentType === 'on_delivery'} primaryColor={primaryColor}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {deliveryType === 'home_delivery' ? 'Payer à la livraison' : 'Payer en boutique'}
                    </p>
                    <p className="text-xs text-gray-500">Vous payez à la réception</p>
                  </div>
                </RadioCard>
              </label>
            )}
          </div>
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto space-y-2 bg-white border-t border-gray-100 px-4 pb-8 pt-3 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        {total > 0 && (
          <div className="space-y-0.5 px-1">
            {deliveryPrice > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Livraison ({selectedZone?.name})</span>
                <span>+{formatPrice(deliveryPrice, shopCurrency)}</span>
              </div>
            )}
            {promoAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-green-600 font-medium">
                <span>Réduction ({promoDiscount}%)</span>
                <span>-{formatPrice(promoAmount, shopCurrency)}</span>
              </div>
            )}
            {hasDeposit && paymentType === 'online' ? (
              <>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Total commande</span>
                  <span>{formatPrice(total, shopCurrency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>Acompte à payer maintenant</span>
                  <span>{formatPrice(deposit, shopCurrency)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                <span>Total commande</span>
                <span>{formatPrice(total, shopCurrency)}</span>
              </div>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingBag className="h-5 w-5" />
          {submitting ? 'Envoi en cours...' : 'Confirmer la commande'}
        </button>
      </div>
    </form>
  )
}
