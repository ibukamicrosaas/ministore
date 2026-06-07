'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'

export function PaymentSearchClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [input, setInput] = useState(searchParams.get('phone') ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSearch = (value: string) => {
    setInput(value)
    startTransition(() => {
      if (value.trim()) {
        router.push(`?phone=${encodeURIComponent(value)}`)
      } else {
        router.push('/admin/paiements-bictorys')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="tel"
          placeholder="Entrez le numéro de téléphone (ex: +221781234567 ou 781234567)..."
          value={input}
          onChange={(e) => handleSearch(e.target.value)}
          disabled={isPending}
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        {input && (
          <button
            onClick={() => handleSearch('')}
            disabled={isPending}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Cherchez par le numéro WhatsApp du client. Le système recherche les 9 derniers chiffres pour plus de flexibilité.
      </p>
    </div>
  )
}
