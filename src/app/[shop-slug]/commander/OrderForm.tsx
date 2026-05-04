'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ProductVariant } from '@/types'

interface ProductOption {
  id: string
  name: string
  price: number
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
  primaryColor: string
  products: ProductOption[]
  deliveryDates: { value: string; label: string }[]
  deliveryOptions: { home_delivery: boolean; store_pickup: boolean }
  shopDepositPct: number
  preselectedProductId: string | null
}

export function OrderForm({
  shopId, shopSlug, shopName, primaryColor, products,
  deliveryDates, deliveryOptions, shopDepositPct, preselectedProductId,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const makeItem = (productId?: string): OrderItem => ({
    product_id: productId ?? products[0]?.id ?? '',
    variant_label: null,
    quantity: 1,
  })

  const [items, setItems]             = useState<OrderItem[]>([makeItem(preselectedProductId ?? undefined)])
  const [deliveryDate, setDeliveryDate] = useState(deliveryDates[0]?.value ?? '')
  const [firstName, setFirstName]     = useState('')
  const [phone, setPhone]             = useState('')
  const [sameWa, setSameWa]           = useState(true)
  const [whatsapp, setWhatsapp]       = useState('')
  const [deliveryType, setDeliveryType] = useState<'home_delivery' | 'store_pickup'>(
    deliveryOptions.home_delivery ? 'home_delivery' : 'store_pickup'
  )
  const [address, setAddress]         = useState('')
  const [notes, setNotes]             = useState('')
  const [paymentType, setPaymentType] = useState<'online' | 'on_delivery'>('on_delivery')

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

  const total   = computeTotal()
  const deposit = paymentType === 'online' ? computeDeposit() : 0
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
          product_id:   it.product_id,
          product_name: p.name,
          variant_label: it.variant_label ?? null,
          unit_price:   price,
          quantity:     it.quantity,
        }
      }),
      delivery_date:    deliveryDate || null,
      delivery_type:    deliveryType,
      delivery_address: deliveryType === 'home_delivery' ? address.trim() : null,
      client_first_name: firstName.trim(),
      client_phone:     phone.trim(),
      client_whatsapp:  sameWa ? phone.trim() : whatsapp.trim() || phone.trim(),
      notes:            notes.trim() || null,
      payment_type:     paymentType === 'online'
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

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] bg-white'

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-32 space-y-5 mt-4">

      {/* Articles */}
      <section>
        <p className="text-sm font-semibold text-gray-900 mb-3">Articles</p>
        <div className="space-y-3">
          {items.map((item, i) => {
            const p = getProduct(item.product_id)
            return (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Article {i + 1}</p>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Produit *</label>
                  <div className="relative">
                    <select
                      value={item.product_id}
                      onChange={e => updateItem(i, { product_id: e.target.value })}
                      className={`${inputCls} appearance-none pr-10`}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {p?.variants && p.variants.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Variante</label>
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
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantité</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateItem(i, { quantity: Math.max(1, item.quantity - 1) })}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-lg font-bold text-gray-600 hover:bg-gray-100"
                    >−</button>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItem(i, { quantity: Math.min(5, item.quantity + 1) })}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-lg font-bold text-gray-600 hover:bg-gray-100"
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
            className="mt-3 flex items-center gap-2 text-sm font-medium"
            style={{ color: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            Ajouter un article
          </button>
        )}
      </section>

      <div className="border-t border-gray-100" />

      {/* Date souhaitée */}
      {deliveryDates.length > 0 && (
        <section>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Date de livraison *</label>
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
      )}

      <div className="border-t border-gray-100" />

      {/* Infos client */}
      <section className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Vos coordonnées</p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Fatou Diallo" required className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone *</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+221 77 000 00 00" required className={inputCls} />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="same-wa"
            checked={sameWa}
            onChange={e => setSameWa(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: primaryColor }}
          />
          <label htmlFor="same-wa" className="text-sm text-gray-700">Même numéro pour WhatsApp</label>
        </div>
        {!sameWa && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
            <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+221 77 000 00 00" className={inputCls} />
          </div>
        )}
      </section>

      <div className="border-t border-gray-100" />

      {/* Mode de réception */}
      {(deliveryOptions.home_delivery || deliveryOptions.store_pickup) && (
        <section>
          <p className="text-sm font-semibold text-gray-900 mb-2">Mode de réception *</p>
          <div className="space-y-2">
            {deliveryOptions.home_delivery && (
              <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${deliveryType === 'home_delivery' ? 'border-[var(--color-primary)] bg-sky-50' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="delivery" value="home_delivery" checked={deliveryType === 'home_delivery'} onChange={() => setDeliveryType('home_delivery')} className="sr-only" />
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${deliveryType === 'home_delivery' ? 'border-[var(--color-primary)]' : 'border-gray-300'}`} style={deliveryType === 'home_delivery' ? { borderColor: primaryColor } : {}}>
                  {deliveryType === 'home_delivery' && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
                </div>
                <span className="text-sm font-medium text-gray-900">Livraison à domicile</span>
              </label>
            )}
            {deliveryOptions.store_pickup && (
              <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${deliveryType === 'store_pickup' ? 'border-[var(--color-primary)] bg-sky-50' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="delivery" value="store_pickup" checked={deliveryType === 'store_pickup'} onChange={() => setDeliveryType('store_pickup')} className="sr-only" />
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${deliveryType === 'store_pickup' ? 'border-[var(--color-primary)]' : 'border-gray-300'}`} style={deliveryType === 'store_pickup' ? { borderColor: primaryColor } : {}}>
                  {deliveryType === 'store_pickup' && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
                </div>
                <span className="text-sm font-medium text-gray-900">Retrait en boutique</span>
              </label>
            )}
          </div>

          {deliveryType === 'home_delivery' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Adresse de livraison *</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                placeholder="Quartier, rue, repère..."
                className={`${inputCls} resize-none`}
              />
            </div>
          )}
        </section>
      )}

      {/* Notes */}
      <section>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Notes (optionnel)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Allergies, instructions particulières..."
          className={`${inputCls} resize-none`}
        />
      </section>

      <div className="border-t border-gray-100" />

      {/* Mode de paiement */}
      <section>
        <p className="text-sm font-semibold text-gray-900 mb-2">Mode de paiement *</p>
        <div className="space-y-2">
          <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${paymentType === 'online' ? 'border-[var(--color-primary)] bg-sky-50' : 'border-gray-200 bg-white'}`}>
            <input type="radio" name="payment" value="online" checked={paymentType === 'online'} onChange={() => setPaymentType('online')} className="sr-only" />
            <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${paymentType === 'online' ? '' : 'border-gray-300'}`} style={paymentType === 'online' ? { borderColor: primaryColor } : {}}>
              {paymentType === 'online' && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Payer maintenant</p>
              <p className="text-xs text-gray-500">Wave, Orange Money, Maxit</p>
              {paymentType === 'online' && hasDeposit && (
                <p className="text-xs font-semibold mt-0.5" style={{ color: primaryColor }}>
                  Acompte à payer : {deposit.toLocaleString('fr-FR')} FCFA
                </p>
              )}
              {paymentType === 'online' && !hasDeposit && total > 0 && (
                <p className="text-xs font-semibold mt-0.5" style={{ color: primaryColor }}>
                  Total à payer : {total.toLocaleString('fr-FR')} FCFA
                </p>
              )}
            </div>
          </label>

          <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${paymentType === 'on_delivery' ? 'border-[var(--color-primary)] bg-sky-50' : 'border-gray-200 bg-white'}`}>
            <input type="radio" name="payment" value="on_delivery" checked={paymentType === 'on_delivery'} onChange={() => setPaymentType('on_delivery')} className="sr-only" />
            <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${paymentType === 'on_delivery' ? '' : 'border-gray-300'}`} style={paymentType === 'on_delivery' ? { borderColor: primaryColor } : {}}>
              {paymentType === 'on_delivery' && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {deliveryType === 'home_delivery' ? 'Payer à la livraison' : 'Payer en boutique'}
              </p>
              <p className="text-xs text-gray-500">Vous payez à la réception</p>
            </div>
          </label>
        </div>
      </section>

      {/* Total + Confirmer (fixé en bas) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 bg-gradient-to-t from-gray-50 to-transparent space-y-2">
        {total > 0 && (
          <div className="flex items-center justify-between text-sm font-semibold text-gray-900 px-1">
            <span>Total</span>
            <span>{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          {submitting ? 'Envoi en cours...' : 'Confirmer la commande'}
        </button>
      </div>
    </form>
  )
}
