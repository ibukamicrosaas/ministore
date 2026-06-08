'use client'

import { useRouter } from 'next/navigation'

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
}: Props) {
  const router = useRouter()

  function handleCheckout() {
    router.push(`/${shopSlug}/checkout?order_id=${orderId}`)
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleCheckout}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Continuer vers le paiement
      </button>

      <p className="text-xs text-center text-gray-500">
        La meilleure méthode de paiement sera sélectionnée en fonction de votre numéro de téléphone.
      </p>
    </div>
  )
}
