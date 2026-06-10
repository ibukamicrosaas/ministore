'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import type { Shop, Profile } from '@/types'

interface DashboardShellProps {
  shop: Shop
  profile: Profile
  children: React.ReactNode
  pageTitle?: string
  unreadNotifications?: number
}

export function DashboardShell({ shop, profile, children, pageTitle, unreadNotifications = 0 }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        shop={shop}
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
          unreadCount={unreadNotifications}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav profile={profile} shop={shop} />
    </div>
  )
}
