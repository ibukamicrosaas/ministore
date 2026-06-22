'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface ChatLimitBannerProps {
  plan: string
  limit: number
}

export function ChatLimitBanner({ plan, limit }: ChatLimitBannerProps) {
  const message =
    plan === 'business'
      ? `Tu as atteint ta limite de ${limit} messages aujourd'hui. Passe au plan Pro pour un accès illimité.`
      : `Tu as atteint ta limite de ${limit} messages aujourd'hui. Passe au plan Business ou Pro pour continuer.`

  return (
    <div className="mx-3 mb-2 rounded-xl bg-orange-50 border border-orange-200 p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
        <p className="text-xs text-orange-800 leading-relaxed">{message}</p>
      </div>
      <p className="text-xs text-orange-600 pl-6">Ta limite se renouvelle demain à minuit.</p>
      <Link
        href="/dashboard/upgrade"
        className="ml-6 inline-flex items-center justify-center rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
      >
        Voir les plans →
      </Link>
    </div>
  )
}
