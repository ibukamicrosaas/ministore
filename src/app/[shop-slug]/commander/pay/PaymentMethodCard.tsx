'use client'

import { PaymentMethodOption } from '@/lib/payments/payment-methods'

interface Props {
  method: PaymentMethodOption
  selected: boolean
  primaryColor: string
  onClick: () => void
}

export function PaymentMethodCard({ method, selected, primaryColor, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
        selected
          ? 'border-current bg-opacity-5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={selected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}0d` } : {}}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors`}
          style={selected ? { borderColor: primaryColor } : { borderColor: '#d1d5db' }}
        >
          {selected && (
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={method.icon}
              alt={method.label}
              className="w-10 h-10 object-contain"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{method.label}</p>
              <p className="text-sm text-gray-500">Paiement direct via {method.label}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
