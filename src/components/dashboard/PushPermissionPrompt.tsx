'use client'

import { useEffect, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { requestPushPermission } from './PushNotificationManager'
import { detectDevice, isAlreadyInstalled } from '@/lib/utils/pwa'

type PromptVariant = 'eligible-first' | 'eligible-discreet' | 'ios-first' | 'ios-discreet' | null

const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export function PushPermissionPrompt() {
  const [variant, setVariant] = useState<PromptVariant>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) return

    // iOS Safari : Web Push exige l'ajout à l'écran d'accueil — tant que ce
    // n'est pas fait, on ne parle jamais de notifications, on parle d'install.
    if (detectDevice() === 'ios' && !isAlreadyInstalled()) {
      const firstSeen = localStorage.getItem('push-ios-install-first-seen')
      if (!firstSeen) {
        localStorage.setItem('push-ios-install-first-seen', String(Date.now()))
        setVariant('ios-first')
        return
      }
      const dismissedAt = localStorage.getItem('push-ios-install-dismissed-at')
      if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_COOLDOWN_MS) return
      setVariant('ios-discreet')
      return
    }

    if (Notification.permission !== 'default') return

    const firstSeen = localStorage.getItem('push-prompt-first-seen')
    if (!firstSeen) {
      localStorage.setItem('push-prompt-first-seen', String(Date.now()))
      setVariant('eligible-first')
      return
    }
    const dismissedAt = localStorage.getItem('push-prompt-dismissed-at')
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_COOLDOWN_MS) return
    setVariant('eligible-discreet')
  }, [])

  if (!variant) return null

  function dismissEligible() {
    localStorage.setItem('push-prompt-dismissed-at', String(Date.now()))
    setVariant(null)
  }

  function dismissIos() {
    localStorage.setItem('push-ios-install-dismissed-at', String(Date.now()))
    setVariant(null)
  }

  async function handleEnable() {
    setLoading(true)
    await requestPushPermission()
    setLoading(false)
    setVariant(null)
  }

  if (variant === 'eligible-first') {
    return (
      <div className="flex items-center gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3 shrink-0">
        <BellRing className="h-5 w-5 shrink-0 text-sky-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-sky-900">Ne rate plus une commande</p>
          <p className="text-xs text-sky-700">
            Active les notifications pour être alerté même quand tu n&apos;es pas sur l&apos;app.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={dismissEligible}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
          >
            Plus tard
          </button>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            Activer les notifications
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'eligible-discreet') {
    return (
      <div className="flex items-center gap-3 border-b border-sky-100 bg-sky-50 px-4 py-2 shrink-0">
        <BellRing className="h-4 w-4 shrink-0 text-sky-600" />
        <p className="flex-1 text-xs font-medium text-sky-800">
          Active les notifications pour ne pas rater de commande.
        </p>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="shrink-0 rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white hover:bg-sky-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          Activer
        </button>
        <button
          onClick={dismissEligible}
          aria-label="Fermer"
          className="shrink-0 rounded-lg p-1 text-sky-400 hover:bg-sky-100 hover:text-sky-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (variant === 'ios-first') {
    return (
      <div className="flex items-center gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3 shrink-0">
        <BellRing className="h-5 w-5 shrink-0 text-sky-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-sky-900">Pour recevoir tes commandes même app fermée</p>
          <p className="text-xs text-sky-700">
            Installe d&apos;abord TekkiShop sur ton écran d&apos;accueil — appuie sur l&apos;icône ⬇ en haut.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={dismissIos}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
          >
            Plus tard
          </button>
          <button
            onClick={dismissIos}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition-colors"
          >
            Compris
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 border-b border-sky-100 bg-sky-50 px-4 py-2 shrink-0">
      <BellRing className="h-4 w-4 shrink-0 text-sky-600" />
      <p className="flex-1 text-xs font-medium text-sky-800">
        Installe l&apos;app (icône ⬇ en haut) pour activer les notifications de commande.
      </p>
      <button
        onClick={dismissIos}
        className="shrink-0 rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
      >
        Compris
      </button>
      <button
        onClick={dismissIos}
        aria-label="Fermer"
        className="shrink-0 rounded-lg p-1 text-sky-400 hover:bg-sky-100 hover:text-sky-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
