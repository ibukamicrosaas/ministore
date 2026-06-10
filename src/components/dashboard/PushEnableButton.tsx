'use client'

import { useState, useEffect } from 'react'
import { BellRing } from 'lucide-react'
import { requestPushPermission } from './PushNotificationManager'

export function PushEnableButton() {
  const [visible, setVisible]   = useState(false)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) return

    // Afficher le bouton uniquement si la permission n'a pas encore été demandée
    if (Notification.permission === 'default') setVisible(true)
  }, [])

  if (!visible) return null

  async function handleClick() {
    setLoading(true)
    const granted = await requestPushPermission()
    setLoading(false)
    if (granted) setVisible(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Activer les notifications pour les nouvelles commandes"
      className="relative rounded-lg p-2 text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
      aria-label="Activer les notifications"
    >
      <BellRing className="h-5 w-5" />
    </button>
  )
}
