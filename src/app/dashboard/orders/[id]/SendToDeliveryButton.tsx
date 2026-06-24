'use client'

import { useState } from 'react'
import { Truck, X, Send } from 'lucide-react'
import { APP_URL } from '@/constants'

interface OrderItem {
  product_name: string
  variant_label: string | null
  quantity: number
}

interface Props {
  shopSlug: string
  deliveryToken: string
  clientName: string
  clientPhone: string
  deliveryAddress: string | null
  deliveryZone: string | null
  items: OrderItem[]
  paymentType: string
  totalPrice: number
  currency: string
  orderId: string
}

export function SendToDeliveryButton({
  shopSlug,
  deliveryToken,
  clientName,
  clientPhone,
  deliveryAddress,
  deliveryZone,
  items,
  paymentType,
  totalPrice,
  currency,
  orderId,
}: Props) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')

  const deliveryUrl = `${APP_URL}/${shopSlug}/livraison/${deliveryToken}`
  const orderRef    = `#${orderId.slice(0, 8).toUpperCase()}`

  const isCashOnDelivery = paymentType === 'on_delivery'
  const priceFormatted   = totalPrice.toLocaleString('fr-FR') + ' ' + currency

  function buildMessage(): string {
    const itemLines = items
      .map(it => `• ${it.product_name}${it.variant_label ? ` (${it.variant_label})` : ''}${it.quantity > 1 ? ` ×${it.quantity}` : ''}`)
      .join('\n')

    const locationLine = deliveryAddress
      ? `📍 ${deliveryAddress}${deliveryZone ? ` — ${deliveryZone}` : ''}`
      : deliveryZone ? `📍 Zone : ${deliveryZone}` : ''

    return [
      `🛵 *Livraison à effectuer — ${orderRef}*`,
      '',
      `👤 *${clientName}*`,
      `📞 ${clientPhone}`,
      locationLine,
      '',
      `📦 *Articles :*`,
      itemLines,
      '',
      isCashOnDelivery ? `💰 *Montant à percevoir : ${priceFormatted}*` : null,
      '',
      `🔗 Fiche de livraison (confirme quand c'est fait) :`,
      deliveryUrl,
    ].filter(l => l !== null).join('\n')
  }

  function handleSend() {
    const cleaned = phone.replace(/\D/g, '')
    if (!cleaned) return
    const msg = buildMessage()
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
    setPhone('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <Truck className="h-3.5 w-3.5" />
        Envoyer au livreur
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                  <Truck className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Envoyer au livreur</p>
                  <p className="text-[11px] text-gray-500">Commande {orderRef}</p>
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); setPhone('') }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Aperçu du message */}
            <div className="mb-4 max-h-52 overflow-y-auto rounded-xl bg-[#1B2B33] p-3">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Aperçu</p>
              <div className="space-y-0.5 text-[13px] text-white/90 leading-relaxed">
                {buildMessage().split('\n').map((line, i) => {
                  if (line === '') return <div key={i} className="h-1.5" />
                  const parts = line.split(/\*([^*]+)\*/g)
                  return (
                    <div key={i}>
                      {parts.map((part, j) =>
                        j % 2 === 1
                          ? <span key={j} className="font-bold text-white">{part}</span>
                          : <span key={j}>{part}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Saisie du numéro */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Numéro WhatsApp du livreur
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                autoComplete="tel"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setPhone('') }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={!phone.replace(/\D/g, '')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#20bb5a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
                Envoyer sur WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
