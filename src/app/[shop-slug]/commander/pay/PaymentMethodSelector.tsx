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
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <circle cx="20" cy="20" r="20" fill="#1DC8FF" />
        <path d="M10 22 Q15 14 20 22 Q25 30 30 22" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    key: 'orange_money',
    label: 'Orange Money',
    color: '#FF7900',
    bg: '#FFF3E8',
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <circle cx="20" cy="20" r="20" fill="#FF7900" />
        <circle cx="20" cy="20" r="9" stroke="white" strokeWidth="3.5" fill="none" />
      </svg>
    ),
  },
  {
    key: 'maxit',
    label: 'Free Money',
    color: '#6B21A8',
    bg: '#F3E8FF',
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <circle cx="20" cy="20" r="20" fill="#6B21A8" />
        <text x="20" y="25" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">M</text>
      </svg>
    ),
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
  primaryColor,
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
            {method.logo}
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{method.label}</p>
              <p className="text-xs text-gray-500">
                {isDeposit ? `Acompte de ${amount.toLocaleString('fr-FR')} FCFA` : `${amount.toLocaleString('fr-FR')} FCFA`}
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

      <a
        href={`/${shopSlug}/commander`}
        className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-4"
      >
        Retour à la boutique
      </a>
    </div>
  )
}
