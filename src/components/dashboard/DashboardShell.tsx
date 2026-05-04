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
}

export function DashboardShell({ shop, profile, children, pageTitle }: DashboardShellProps) {
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
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav profile={profile} shop={shop} />
    </div>
  )
}
