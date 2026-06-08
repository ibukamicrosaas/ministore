'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentMethodCard } from './PaymentMethodCard'
import {
  PAYMENT_METHODS_BY_COUNTRY,
  getCountryFromPhone,
  type PaymentMethod,
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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)

  // Détecter le pays à partir du numéro de téléphone
  const country = getCountryFromPhone(customerPhone)
  const methods = country ? PAYMENT_METHODS_BY_COUNTRY[country] : []

  // Sélectionner la première méthode par défaut
  if (!selectedMethod && methods.length > 0) {
    setSelectedMethod(methods[0].id as PaymentMethod)
  }

  async function handleContinue() {
    if (!selectedMethod) return

    setLoading(true)
    try {
      // Rediriger vers la page de checkout avec la méthode sélectionnée
      router.push(
        `/${shopSlug}/commander/checkout?order_id=${orderId}&method=${selectedMethod}`
      )
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!country || methods.length === 0) {
    // Fallback: afficher un message d'erreur
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
      {/* Méthodes de paiement */}
      <div className="space-y-3">
        {methods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            selected={selectedMethod === method.id}
            primaryColor={primaryColor}
            onClick={() => setSelectedMethod(method.id as PaymentMethod)}
          />
        ))}
      </div>

      {/* Bouton continuer */}
      <button
        onClick={handleContinue}
        disabled={!selectedMethod || loading}
        className="w-full py-3 px-4 rounded-2xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: primaryColor,
          opacity: !selectedMethod || loading ? 0.5 : 1,
        }}
      >
        {loading ? 'Chargement...' : 'Continuer'}
      </button>

      {/* Info de sécurité */}
      <p className="text-xs text-center text-gray-500">
        🔒 Vos données sont sécurisées. Vous serez redirigé vers la page de paiement.
      </p>
    </div>
  )
}
