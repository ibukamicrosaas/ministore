'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ChevronDown, ChevronLeft, Package, MapPin, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ProductVariant, DeliveryZone } from '@/types'

const COUNTRIES = [
  { code: 'SN', flag: '🇸🇳', dial: '+221', name: 'Sénégal' },
  { code: 'CI', flag: '🇨🇮', dial: '+225', name: "Côte d'Ivoire" },
  { code: 'TG', flag: '🇹🇬', dial: '+228', name: 'Togo' },
  { code: 'BJ', flag: '🇧🇯', dial: '+229', name: 'Bénin' },
  { code: 'BF', flag: '🇧🇫', dial: '+226', name: 'Burkina Faso' },
]

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
}: {
  value: string
  onChange: (v: string) => void
  dialCode: string
  onDialChange: (d: string) => void
  placeholder: string
}) {
  const selected = COUNTRIES.find((c) => c.dial === dialCode) ?? COUNTRIES[0]
  return (
    <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-gray-300">
      <div className="relative shrink-0 border-r border-gray-200">
        <select
          value={dialCode}
          onChange={(e) => onDialChange(e.target.value)}
          className="h-full appearance-none bg-gray-50 pl-8 pr-6 text-sm font-medium text-gray-700 outline-none cursor-pointer"
          style={{ minWidth: 90 }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.dial}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base select-none">
          {selected.flag}
        </span>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
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
}

interface OrderItem {
  product_id: string
  variant_label: string | null
  quantity: number
}

interface Props {
  shopId: string
  shopSlug: string
  shopName: string
  shopLogoUrl: string | null
  shopCity: string | null
  shopCountry: string
  primaryColor: string
  products: ProductOption[]
  deliveryDates: { value: string; label: string }[]
  deliveryOptions: { home_delivery: boolean; store_pickup: boolean }
  shopDepositPct: number
  acceptOnlinePayment: boolean
  acceptCashOnDelivery: boolean
  deliveryZones: DeliveryZone[]
  preselectedProductId: string | null
}

export function OrderForm({
  shopId,
  shopSlug,
  shopName,
  shopLogoUrl,
  shopCity,
  shopCountry,
  primaryColor,
  products,
  deliveryDates,
  deliveryOptions,
  shopDepositPct,
  acceptOnlinePayment,
  acceptCashOnDelivery,
  deliveryZones,
  preselectedProductId,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    firstName?: string
    phone?: string
    address?: string
  }>({})

  const defaultDial = COUNTRIES.find((c) => c.code === shopCountry)?.dial ?? '+221'
  const CART_KEY    = `tekki_cart_${shopId}`

  const makeItem = (productId?: string): OrderItem => ({
    product_id: productId ?? products[0]?.id ?? '',
    variant_label: null,
    quantity: 1,
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
    return items.reduce((sum, it) => {
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
  }

  const subtotal       = computeTotal()
  const promoAmount    = promoDiscount > 0 ? Math.floor(subtotal * promoDiscount / 100) : 0
  const total          = subtotal - promoAmount
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
                            {v.label} — {v.price.toLocaleString('fr-FR')} FCFA
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                placeholder="77 000 00 00"
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
                  placeholder="77 000 00 00"
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
                    <div className="relative">
                      <select
                        value={selectedZoneId}
                        onChange={(e) => setSelectedZoneId(e.target.value)}
                        className={`${inputCls} appearance-none pr-10`}
                      >
                        {deliveryZones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}{z.price > 0 ? ` — ${z.price.toLocaleString('fr-FR')} FCFA` : ' — Gratuit'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              ✓ Code valide — {promoDiscount}% de réduction ({promoAmount.toLocaleString('fr-FR')} FCFA)
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
                        Acompte : {deposit.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                    {paymentType === 'online' && !hasDeposit && total > 0 && (
                      <p className="mt-1 text-xs font-bold" style={{ color: primaryColor }}>
                        Total : {total.toLocaleString('fr-FR')} FCFA
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
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto space-y-2 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent px-4 pb-8 pt-3">
        {total > 0 && (
          <div className="space-y-0.5 px-1">
            {deliveryPrice > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Livraison ({selectedZone?.name})</span>
                <span>+{deliveryPrice.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            {promoAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-green-600 font-medium">
                <span>Réduction ({promoDiscount}%)</span>
                <span>-{promoAmount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold text-gray-900">
              <span>Total commande</span>
              <span>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
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
