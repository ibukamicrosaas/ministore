'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PaymentMethodCard } from './PaymentMethodCard'
import {
  PAYMENT_METHODS_BY_COUNTRY,
  getCountryFromPhone,
} from '@/lib/payments/payment-methods'

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
  customerPhone,
  primaryColor,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const country = getCountryFromPhone(customerPhone)
  const methods = country ? PAYMENT_METHODS_BY_COUNTRY[country] : []

  async function handleSelectMethod(methodId: string) {
    setLoading(true)
    router.push(
      `/${shopSlug}/commander/checkout?order_id=${orderId}&method=${methodId}`
    )
  }

  if (!country || methods.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">
          Impossible de détecter votre pays. Veuillez contacter le vendeur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleSelectMethod(method.id)}
            disabled={loading}
            className="w-full opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaymentMethodCard
              method={method}
              selected={false}
              primaryColor={primaryColor}
              onClick={() => {}}
            />
          </button>
        ))}
      </div>

      <p className="text-xs text-center text-gray-500">
        🔒 Vos données sont sécurisées. Vous serez redirigé vers la page de paiement.
      </p>
    </div>
  )
}
