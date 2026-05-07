'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const METHODS = [
  {
    key: 'wave_money',
    label: 'Wave',
    color: '#1DC8FF',
    bg: '#E8F9FF',
    logo: '/logo-payments/wave_1.svg',
  },
  {
    key: 'orange_money',
    label: 'Orange Money',
    color: '#FF7900',
    bg: '#FFF3E8',
    logo: '/logo-payments/om_1.svg',
  },
  {
    key: 'maxit',
    label: 'MaxIt',
    color: '#6B21A8',
    bg: '#F3E8FF',
    logo: '/logo-payments/maxit.webp',
  },
]

interface Props {
  orderId: string
  shopSlug: string
  customerFirstName: string
  customerPhone: string
  amount: number
  primaryColor: string
  isDeposit: boolean
}

export function PaymentMethodSelector({
  orderId,
  shopSlug,
  customerFirstName,
  customerPhone,
  amount,
  isDeposit,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSelect(methodKey: string) {
    if (loading) return
    setLoading(methodKey)

    try {
      const res = await fetch('/api/payments/bictorys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          shopSlug,
          customerFirstName,
          customerPhone,
          paymentType: methodKey,
        }),
      })
      const data = await res.json() as { checkoutUrl?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur de paiement')
        setLoading(null)
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch {
      toast.error('Erreur réseau. Réessaie.')
      setLoading(null)
    }
  }

  async function handleOtherMethods() {
    if (loading) return
    setLoading('other')

    try {
      const res = await fetch('/api/payments/bictorys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          shopSlug,
          customerFirstName,
          customerPhone,
        }),
      })
      const data = await res.json() as { checkoutUrl?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur de paiement')
        setLoading(null)
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch {
      toast.error('Erreur réseau. Réessaie.')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {METHODS.map((method) => {
        const isLoading = loading === method.key
        return (
          <button
            key={method.key}
            onClick={() => handleSelect(method.key)}
            disabled={loading !== null}
            className="w-full flex items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            style={isLoading ? { borderColor: method.color, backgroundColor: method.bg } : { borderColor: '#e5e7eb' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={method.logo}
              alt={method.label}
              className="h-10 w-10 rounded-full object-contain bg-white"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{method.label}</p>
              <p className="text-xs text-gray-500">
                {isDeposit
                  ? `Acompte de ${amount.toLocaleString('fr-FR')} FCFA`
                  : `${amount.toLocaleString('fr-FR')} FCFA`}
              </p>
            </div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: method.color }} />
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                style={{ backgroundColor: method.color }}
              >
                →
              </div>
            )}
          </button>
        )
      })}

      <button
        onClick={handleOtherMethods}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-2 mt-5 py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
      >
        {loading === 'other' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        )}
        Voir les autres solutions de paiement
      </button>
    </div>
  )
}
