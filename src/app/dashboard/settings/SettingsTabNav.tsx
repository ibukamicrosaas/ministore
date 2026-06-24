'use client'

import Link from 'next/link'
import { Store, ShoppingCart, Palette, User } from 'lucide-react'

const TABS = [
  { id: 'boutique', label: 'Boutique', icon: Store },
  { id: 'ventes',   label: 'Ventes',   icon: ShoppingCart },
  { id: 'contenu',  label: 'Contenu',  icon: Palette },
  { id: 'compte',   label: 'Compte',   icon: User },
]

interface Props {
  activeTab: string
}

export function SettingsTabNav({ activeTab }: Props) {
  return (
    <div className="flex gap-1 rounded-2xl bg-gray-100 p-1 mb-6">
      {TABS.map(tab => {
        const Icon    = tab.icon
        const isActive = activeTab === tab.id
        return (
          <Link
            key={tab.id}
            href={`/dashboard/settings?tab=${tab.id}`}
            scroll={false}
            prefetch={false}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
          </Link>
        )
      })}
    </div>
  )
}
