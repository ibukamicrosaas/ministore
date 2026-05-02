'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Service } from '@/types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import Image from 'next/image'
import { CreditCard, Store } from 'lucide-react'
import type { BictorysPaymentType, BictorysMethod } from '@/lib/payments/bictorys'

interface Props {
  salonSlug: string
  service: Pick<Service, 'id' | 'name' | 'price'>
  bookingId: string
  depositAmount: number
  date: string
  time: string
  customerFirstName: string
  customerLastName?: string
  customerEmail?: string
  customerPhone?: string
  hasMoneroo: boolean
  hasStripe: boolean
  hasBictorys: boolean
}

type PaymentMethod = BictorysMethod | 'moneroo' | 'stripe' | 'on_site'

const BICTORYS_METHODS: { method: BictorysMethod; label: string; sub: string; logo: string }[] = [
  { method: 'wave_money',   label: 'Wave',         sub: 'Paiement mobile Wave',         logo: '/logo-payments/wave_1.svg' },
  { method: 'orange_money', label: 'Orange Money', sub: 'Paiement mobile Orange Money', logo: '/logo-payments/om_1.svg' },
  { method: 'maxit',        label: 'Maxit',        sub: 'Paiement mobile Maxit',        logo: '/logo-payments/maxit.webp' },
]

function CheckBadge({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="ml-auto h-5 w-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
      <span className="text-white text-xs">✓</span>
    </div>
  )
}

export function PaymentSelector({
  salonSlug, service, bookingId, depositAmount, date, time,
  customerFirstName, customerLastName, customerPhone,
  hasMoneroo, hasStripe, hasBictorys,
}: Props) {
  const router = useRouter()
  const amountToCharge = depositAmount > 0 ? depositAmount : service.price

  const defaultMethod: PaymentMethod = hasBictorys ? 'wave_money' : hasMoneroo ? 'moneroo' : hasStripe ? 'stripe' : 'on_site'
  const [selected, setSelected] = useState<PaymentMethod>(defaultMethod)
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)

    if (selected === 'on_site') {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/confirm-onsite`, { method: 'POST' })
        const data = await res.json() as { success?: boolean; error?: string }
        if (!res.ok || !data.success) {
          toast.error(data.error ?? 'Erreur lors de la confirmation')
          return
        }
        router.push(`/${salonSlug}/book/success?booking_id=${bookingId}`)
      } catch {
        toast.error('Erreur réseau, réessaie.')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const isBictorys = hasBictorys && (selected === 'wave_money' || selected === 'orange_money' || selected === 'maxit')
      const endpoint = isBictorys
        ? '/api/payments/bictorys/create'
        : selected === 'moneroo' ? '/api/payments/moneroo/create'
        : '/api/payments/stripe/create'

      const body = selected === 'stripe'
        ? {
            bookingId, salonSlug, serviceId: service.id,
            serviceName: service.name,
            customerName: `${customerFirstName} ${customerLastName ?? ''}`.trim(),
          }
        : {
            bookingId, salonSlug, serviceId: service.id,
            customerFirstName, customerLastName, customerPhone,
            ...(isBictorys ? { paymentType: selected as BictorysPaymentType } : {}),
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json() as { checkoutUrl?: string; error?: string }

      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error ?? 'Erreur lors de l\'initialisation du paiement')
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      toast.error('Erreur réseau, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const isOnSite = selected === 'on_site'
  const btnLabel = loading ? 'Traitement...' : isOnSite ? 'Confirmer la réservation' : `Payer ${amountToCharge.toLocaleString('fr-FR')} FCFA`

  return (
    <div className="space-y-5">
      {/* Récap */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{service.name}</span>
          <span className="font-semibold text-gray-900">{service.price.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{format(parseISO(date + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })} · {time}</span>
        </div>
        <div className="pt-2 border-t border-gray-100 flex justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {depositAmount > 0 ? 'Acompte à payer maintenant' : 'À payer maintenant'}
          </span>
          <span className="text-lg font-bold text-[var(--color-primary)]">{amountToCharge.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>

      {/* Options de paiement */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">Mode de paiement</p>

        {/* Bictorys — Wave, Orange Money, Maxit */}
        {hasBictorys && BICTORYS_METHODS.map(({ method, label, sub, logo }) => (
          <button
            key={method}
            onClick={() => setSelected(method)}
            className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
              selected === method ? 'border-[var(--color-primary)] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-100 shrink-0 overflow-hidden">
              <Image src={logo} alt={label} width={36} height={36} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
            <CheckBadge active={selected === method} />
          </button>
        ))}

        {/* Moneroo */}
        {hasMoneroo && (
          <button
            onClick={() => setSelected('moneroo')}
            className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
              selected === 'moneroo' ? 'border-[var(--color-primary)] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected === 'moneroo' ? 'bg-[var(--color-primary)]' : 'bg-gray-100'} shrink-0`}>
              <span className={`text-xs font-bold ${selected === 'moneroo' ? 'text-white' : 'text-gray-500'}`}>MM</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Mobile Money</p>
              <p className="text-xs text-gray-500">Wave, Orange Money, MTN, Free...</p>
            </div>
            <CheckBadge active={selected === 'moneroo'} />
          </button>
        )}

        {/* Stripe */}
        {hasStripe && (
          <button
            onClick={() => setSelected('stripe')}
            className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
              selected === 'stripe' ? 'border-[var(--color-primary)] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected === 'stripe' ? 'bg-[var(--color-primary)]' : 'bg-gray-100'} shrink-0`}>
              <CreditCard className={`h-5 w-5 ${selected === 'stripe' ? 'text-white' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Carte bancaire</p>
              <p className="text-xs text-gray-500">Visa, Mastercard</p>
            </div>
            <CheckBadge active={selected === 'stripe'} />
          </button>
        )}

        {/* Payer sur place */}
        <button
          onClick={() => setSelected('on_site')}
          className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
            selected === 'on_site' ? 'border-[var(--color-primary)] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected === 'on_site' ? 'bg-[var(--color-primary)]' : 'bg-gray-100'} shrink-0`}>
            <Store className={`h-5 w-5 ${selected === 'on_site' ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Payer sur place</p>
            <p className="text-xs text-gray-500">Espèces ou mobile money à l'arrivée</p>
          </div>
          <CheckBadge active={selected === 'on_site'} />
        </button>

        {isOnSite && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            💡 Les réservations avec paiement en ligne sont confirmées en priorité.
          </p>
        )}
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white disabled:opacity-60 active:opacity-80 transition-opacity"
      >
        {btnLabel}
      </button>

      {!isOnSite && (
        <p className="text-center text-xs text-gray-400">
          Paiement sécurisé · Remboursable en cas d&apos;annulation dans les délais
        </p>
      )}
    </div>
  )
}
