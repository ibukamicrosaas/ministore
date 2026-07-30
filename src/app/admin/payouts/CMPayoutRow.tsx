'use client'

import { useState } from 'react'
import { MarkCMPayoutDoneButton } from './MarkCMPayoutDoneButton'

interface Props {
  payoutId: string
  cmName: string
  country: string
  amount: number
  provider: string
  mobileNumber: string
  requestedAt: string
}

export function CMPayoutRow({ payoutId, cmName, country, amount, provider, mobileNumber, requestedAt }: Props) {
  const [ref, setRef] = useState('')
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{cmName}</p>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 uppercase">
            Country Manager · {country}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {provider.toUpperCase()} · <span className="font-mono">{mobileNumber}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Demandé le {new Date(requestedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-gray-900">{amount.toLocaleString('fr-FR')} F</p>
        <MarkCMPayoutDoneButton
          payoutId={payoutId}
          cmName={cmName}
          reference={ref}
          setReference={setRef}
        />
      </div>
    </div>
  )
}
