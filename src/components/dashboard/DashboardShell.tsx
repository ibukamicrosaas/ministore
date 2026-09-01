'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { PushNotificationManager } from './PushNotificationManager'
import { PushPermissionPrompt } from './PushPermissionPrompt'
import { ChatWidget } from '@/components/ai/ChatWidget'
import { ChatAssistantContext } from './ChatAssistantContext'
import type { Shop, Profile } from '@/types'

interface DashboardShellProps {
  shop: Shop
  profile: Profile
  children: React.ReactNode
  pageTitle?: string
  unreadNotifications?: number
  isAdmin?: boolean
  renewalBanner?: React.ReactNode
  isTrial?: boolean
  /** Bandeau permanent §7 (essai free_orders expiré) — calculé dans le layout, qui seul a accès aux commandes retenues. */
  expiredBanner?: React.ReactNode
}

export function DashboardShell({ shop, profile, children, pageTitle, unreadNotifications = 0, isAdmin = false, renewalBanner, isTrial = false, expiredBanner }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null)

  function openChatWithPrompt(prompt: string) {
    setChatInitialPrompt(prompt)
    setChatOpen(true)
  }

  return (
    <ChatAssistantContext.Provider value={{ openChatWithPrompt }}>
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
        {/* Spacer pour le header fixe sur mobile */}
        <div className="h-14 shrink-0 lg:hidden" aria-hidden />
        {/* Bannière renouvellement — placée ici pour être visible sous le header fixe */}
        {renewalBanner}
        {/* Bandeau permanent essai free_orders expiré (§7) */}
        {expiredBanner}
        {/* Bandeau essai — visible dès J1, disparaît quand la bannière urgence prend le relais */}
        {isTrial && !renewalBanner && (
          <div className="flex items-center gap-2.5 border-b border-amber-100 bg-amber-50 px-4 py-2 shrink-0">
            <span className="shrink-0 text-base leading-none">🔒</span>
            <p className="flex-1 text-xs font-medium text-amber-800 truncate">
              Votre boutique n&apos;est pas encore visible par vos clients.
            </p>
            <Link
              href="/dashboard/upgrade"
              className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
            >
              Activer →
            </Link>
          </div>
        )}
        <PushPermissionPrompt />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav
        profile={profile}
        shop={shop}
        onChatOpen={() => setChatOpen(true)}
        isChatOpen={chatOpen}
      />
      <ChatWidget
        shopName={shop.name}
        isOpen={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        initialPrompt={chatInitialPrompt}
        onInitialPromptConsumed={() => setChatInitialPrompt(null)}
      />
      <PushNotificationManager />
    </div>
    </ChatAssistantContext.Provider>
  )
}
