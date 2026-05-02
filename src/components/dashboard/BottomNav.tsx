'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarRange, Banknote, Users, Scissors, CalendarCheck } from 'lucide-react'
import { clsx } from 'clsx'
import type { Profile, Salon } from '@/types'

interface BottomNavProps {
  profile: Profile
  salon: Salon
}

const ownerTabs = [
  { href: '/dashboard',               label: 'Accueil',      icon: LayoutDashboard, exact: true,  salonOnly: false },
  { href: '/dashboard/calendar',      label: 'Agenda',       icon: CalendarRange,                  salonOnly: false },
  { href: '/dashboard/services',      label: 'Prestations',  icon: Scissors,                       salonOnly: false },
  { href: '/dashboard/staff',         label: 'Employées',    icon: Users,                          salonOnly: true  },
  { href: '/dashboard/commissions',   label: 'Commissions',  icon: Banknote,                       salonOnly: true  },
]

const staffTabs = [
  { href: '/dashboard/my-schedule', label: 'Mon planning', icon: CalendarCheck, exact: true, salonOnly: false },
]

export function BottomNav({ profile, salon }: BottomNavProps) {
  const pathname = usePathname()
  const isOwner = profile.role === 'owner'
  const isSalon = salon.business_type === 'salon'
  const allTabs = isOwner ? ownerTabs : staffTabs
  const tabs = allTabs.filter(t => !t.salonOnly || isSalon)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex h-16 items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-[#E85D04]' : 'text-gray-400'
              )}
            >
              <Icon className={clsx('h-5 w-5', active ? 'text-[#E85D04]' : 'text-gray-400')} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
