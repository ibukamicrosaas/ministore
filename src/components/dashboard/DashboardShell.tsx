'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { PushNotificationManager } from './PushNotificationManager'
import type { Shop, Profile } from '@/types'

interface DashboardShellProps {
  shop: Shop
  profile: Profile
  children: React.ReactNode
  pageTitle?: string
  unreadNotifications?: number
  isAdmin?: boolean
}

export function DashboardShell({ shop, profile, children, pageTitle, unreadNotifications = 0, isAdmin = false }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        shop={shop}
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
      />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
          unreadCount={unreadNotifications}
          shopSlug={shop.slug}
        />
        {/* Spacer pour le header fixe sur mobile (lg:hidden car en desktop le header est dans le flux) */}
        <div className="h-14 shrink-0 lg:hidden" aria-hidden />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav profile={profile} shop={shop} />
      <PushNotificationManager />
    </div>
  )
}
