'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ChevronDown, ChevronLeft, Package, MapPin, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ProductVariant } from '@/types'

interface ProductOption {
  id: string
  name: string
  price: number
  photo: string | null
  variants: ProductVariant[] | null
  deposit_percentage: number | null
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
  primaryColor: string
  products: ProductOption[]
  deliveryDates: { value: string; label: string }[]
  deliveryOptions: { home_delivery: boolean; store_pickup: boolean }
  shopDepositPct: number
  acceptOnlinePayment: boolean
  preselectedProductId: string | null
}

export function OrderForm({
  shopId, shopSlug, shopName, shopLogoUrl, shopCity, primaryColor, products,
  deliveryDates, deliveryOptions, shopDepositPct, acceptOnlinePayment, preselectedProductId,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const makeItem = (productId?: string): OrderItem => ({
    product_id: productId ?? products[0]?.id ?? '',
    variant_label: null,
    quantity: 1,
  })

  const [items, setItems]               = useState<OrderItem[]>([makeItem(preselectedProductId ?? undefined)])
  const [deliveryDate, setDeliveryDate] = useState(deliveryDates[0]?.value ?? '')
  const [firstName, setFirstName]       = useState('')
  const [phone, setPhone]               = useState('')
  const [sameWa, setSameWa]             = useState(true)
  const [whatsapp, setWhatsapp]         = useState('')
  const [deliveryType, setDeliveryType] = useState<'home_delivery' | 'store_pickup'>(
    deliveryOptions.home_delivery ? 'home_delivery' : 'store_pickup'
  )
  const [address, setAddress]           = useState('')
  const [notes, setNotes]               = useState('')
  const [paymentType, setPaymentType]   = useState<'online' | 'on_delivery'>(
    acceptOnlinePayment ? 'on_delivery' : 'on_delivery'
  )

  function getProduct(id: string) { return products.find(p => p.id === id) }

  function updateItem(index: number, patch: Partial<OrderItem>) {
    setItems(prev => prev.map((it, i) => {
      if (i !== index) return it
      const updated = { ...it, ...patch }
      if (patch.product_id) updated.variant_label = null
      return updated
    }))
  }

  function addItem() {
    if (items.length >= 5) { toast.error('Maximum 5 articles par commande.'); return }
    setItems(prev => [...prev, makeItem()])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function computeTotal() {
    return items.reduce((sum, it) => {
      const p = getProduct(it.product_id)
      if (!p) return sum
      let price = p.price
      if (it.variant_label && p.variants) {
        const v = p.variants.find(v => v.label === it.variant_label)
        if (v) price = v.price
      }
      return sum + price * it.quantity
    }, 0)
  }

  function computeDeposit() {
    return items.reduce((sum, it) => {
      const p = getProduct(it.product_id)
      if (!p) return sum
      const pct = p.deposit_percentage != null ? p.deposit_percentage : shopDepositPct
      if (pct === 0) return sum
      let price = p.price
      if (it.variant_label && p.variants) {
        const v = p.variants.find(v => v.label === it.variant_label)
        if (v) price = v.price
      }
      return sum + Math.floor(price * it.quantity * pct / 100)
    }, 0)
  }

  const total      = computeTotal()
  const deposit    = paymentType === 'online' ? computeDeposit() : 0
  const hasDeposit = deposit > 0 && deposit < total

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) { toast.error('Votre nom est obligatoire.'); return }
    if (!phone.trim()) { toast.error('Votre téléphone est obligatoire.'); return }
    if (deliveryType === 'home_delivery' && !address.trim()) {
      toast.error("L'adresse de livraison est obligatoire."); return
    }

    const body = {
      shopId,
      items: items.map(it => {
        const p = getProduct(it.product_id)!
        let price = p.price
        if (it.variant_label && p.variants) {
          const v = p.variants.find(v => v.label === it.variant_label)
          if (v) price = v.price
        }
        return {
          product_id:    it.product_id,
          product_name:  p.name,
          variant_label: it.variant_label ?? null,
          unit_price:    price,
          quantity:      it.quantity,
        }
      }),
      delivery_date:     deliveryDate || null,
      delivery_type:     deliveryType,
      delivery_address:  deliveryType === 'home_delivery' ? address.trim() : null,
      client_first_name: firstName.trim(),
      client_phone:      phone.trim(),
      client_whatsapp:   sameWa ? phone.trim() : whatsapp.trim() || phone.trim(),
      notes:             notes.trim() || null,
      payment_type:      paymentType === 'online'
        ? (hasDeposit ? 'online_deposit' : 'online_full')
        : deliveryType === 'home_delivery' ? 'on_delivery' : 'on_site',
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { orderId?: string; redirect?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Une erreur est survenue.')
        return
      }

      if (data.redirect === 'pay' && data.orderId) {
        router.push(`/${shopSlug}/commander/pay?order_id=${data.orderId}`)
      } else {
        router.push(`/${shopSlug}/commander/success?order_id=${data.orderId}`)
      }
    } catch {
      toast.error('Erreur réseau. Réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-300 bg-white'

  const SectionLabel = ({ n, label }: { n: number; label: string }) => (
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

  const RadioCard = ({ checked, children }: { checked: boolean; children: React.ReactNode }) => (
    <div className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${checked ? '' : 'border-gray-200 bg-white'}`}
      style={checked ? { borderColor: primaryColor, backgroundColor: `${primaryColor}0d` } : {}}>
      <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center`}
        style={checked ? { borderColor: primaryColor } : { borderColor: '#d1d5db' }}>
        {checked && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
      </div>
      {children}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="pb-32">

      {/* Shop header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
        <Link href={`/${shopSlug}`} className="text-gray-400 hover:text-gray-600 shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {shopLogoUrl ? (
          <img src={shopLogoUrl} alt={shopName} className="h-10 w-10 rounded-xl object-cover shrink-0" />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            {shopName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{shopName}</p>
          {shopCity && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" /> {shopCity}
            </p>
          )}
        </div>
        <p className="ml-auto text-xs font-semibold text-gray-500">Commander</p>
      </div>

      <div className="px-4 pt-5 space-y-6">

        {/* Section 1 — Articles */}
        <section>
          <SectionLabel n={1} label="Vos articles" />
          <div className="space-y-3">
            {items.map((item, i) => {
              const p = getProduct(item.product_id)
              return (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Article {i + 1}</p>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Product selector with thumbnail */}
                  <div className="flex items-center gap-3">
                    {p?.photo ? (
                      <img src={p.photo} alt={p.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 relative">
                      <select
                        value={item.product_id}
                        onChange={e => updateItem(i, { product_id: e.target.value })}
                        className={`${inputCls} appearance-none pr-10 py-2.5`}
                      >
                        {products.map(prod => (
                          <option key={prod.id} value={prod.id}>{prod.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {p?.variants && p.variants.length > 0 && (
                    <div className="relative">
                      <select
                        value={item.variant_label ?? ''}
                        onChange={e => updateItem(i, { variant_label: e.target.value || null })}
                        className={`${inputCls} appearance-none pr-10`}
                      >
                        <option value="">— Choisir une variante —</option>
                        {p.variants.map((v, vi) => (
                          <option key={vi} value={v.label}>{v.label} — {v.price.toLocaleString('fr-FR')} FCFA</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Quantité</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateItem(i, { quantity: Math.max(1, item.quantity - 1) })}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-bold hover:bg-gray-100"
                      >−</button>
                      <span className="text-sm font-bold text-gray-900 w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItem(i, { quantity: Math.min(5, item.quantity + 1) })}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-bold hover:bg-gray-100"
                      >+</button>
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

        {/* Section 2 — Date */}
        {deliveryDates.length > 0 && (
          <>
            <section>
              <SectionLabel n={2} label="Date souhaitée" />
              <div className="relative">
                <select
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  {deliveryDates.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </section>
            <div className="border-t border-gray-100" />
          </>
        )}

        {/* Section 3 — Coordonnées */}
        <section>
          <SectionLabel n={3} label="Vos coordonnées" />
          <div className="space-y-3">
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Nom complet *"
              required
              className={inputCls}
            />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Téléphone *"
              required
              className={inputCls}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="same-wa"
                checked={sameWa}
                onChange={e => setSameWa(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-sm text-gray-700">Même numéro pour WhatsApp</span>
            </label>
            {!sameWa && (
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="Numéro WhatsApp"
                className={inputCls}
              />
            )}
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Section 4 — Livraison */}
        {(deliveryOptions.home_delivery || deliveryOptions.store_pickup) && (
          <>
            <section>
              <SectionLabel n={4} label="Mode de réception" />
              <div className="space-y-2">
                {deliveryOptions.home_delivery && (
                  <label className="block cursor-pointer" onClick={() => setDeliveryType('home_delivery')}>
                    <RadioCard checked={deliveryType === 'home_delivery'}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Livraison à domicile</p>
                        <p className="text-xs text-gray-500">Livré chez vous</p>
                      </div>
                    </RadioCard>
                  </label>
                )}
                {deliveryOptions.store_pickup && (
                  <label className="block cursor-pointer" onClick={() => setDeliveryType('store_pickup')}>
                    <RadioCard checked={deliveryType === 'store_pickup'}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Retrait en boutique</p>
                        <p className="text-xs text-gray-500">Récupérez votre commande</p>
                      </div>
                    </RadioCard>
                  </label>
                )}
              </div>

              {deliveryType === 'home_delivery' && (
                <div className="mt-3">
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={2}
                    placeholder="Adresse de livraison * (quartier, rue, repère...)"
                    className={`${inputCls} resize-none`}
                  />
                </div>
              )}
            </section>
            <div className="border-t border-gray-100" />
          </>
        )}

        {/* Section 5 — Notes */}
        <section>
          <SectionLabel n={5} label="Notes (optionnel)" />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Allergies, instructions particulières..."
            className={`${inputCls} resize-none`}
          />
        </section>

        <div className="border-t border-gray-100" />

        {/* Section 6 — Paiement */}
        <section>
          <SectionLabel n={6} label="Mode de paiement" />
          <div className="space-y-2">
            {acceptOnlinePayment && (
              <label className="block cursor-pointer" onClick={() => setPaymentType('online')}>
                <RadioCard checked={paymentType === 'online'}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Payer maintenant</p>
                    <p className="text-xs text-gray-500">Wave, Orange Money, Maxit</p>
                    {paymentType === 'online' && hasDeposit && (
                      <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                        Acompte : {deposit.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                    {paymentType === 'online' && !hasDeposit && total > 0 && (
                      <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                        Total : {total.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>
                </RadioCard>
              </label>
            )}

            <label className="block cursor-pointer" onClick={() => setPaymentType('on_delivery')}>
              <RadioCard checked={paymentType === 'on_delivery'}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {deliveryType === 'home_delivery' ? 'Payer à la livraison' : 'Payer en boutique'}
                  </p>
                  <p className="text-xs text-gray-500">Vous payez à la réception</p>
                </div>
              </RadioCard>
            </label>
          </div>
        </section>

      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-8 pt-3 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent space-y-2">
        {total > 0 && (
          <div className="flex items-center justify-between text-sm font-bold text-gray-900 px-1">
            <span>Total commande</span>
            <span>{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingBag className="h-5 w-5" />
          {submitting ? 'Envoi en cours...' : 'Confirmer la commande'}
        </button>
      </div>
    </form>
  )
}
