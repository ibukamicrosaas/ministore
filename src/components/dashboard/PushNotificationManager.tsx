'use client'

import { useEffect } from 'react'

export function PushNotificationManager() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) return

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    async function setup() {
      try {
        // Enregistrer le service worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        // Ne pas demander la permission si déjà accordée ou refusée
        if (Notification.permission === 'denied') return

        // Si pas encore accordée, demander discrètement (sans popup intrusif)
        // On le fait uniquement si l'utilisateur a déjà accordé, sinon on attend
        // un geste explicite (l'utilisateur peut activer depuis les paramètres)
        if (Notification.permission !== 'granted') return

        // Vérifier si déjà abonné
        const existing = await reg.pushManager.getSubscription()
        if (existing) return

        // S'abonner aux notifications push
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey!),
        })

        // Envoyer l'abonnement au serveur
        await fetch('/api/push/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(sub.toJSON()),
        })
      } catch (err) {
        // Silencieux — la fonctionnalité est optionnelle
        console.debug('[push] setup error:', err)
      }
    }

    setup()
  }, [])

  return null
}

// Demander explicitement la permission push (appelé depuis un bouton UI)
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return false

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const reg = await navigator.serviceWorker.ready

    const existing = await reg.pushManager.getSubscription()
    if (existing) return true

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const res = await fetch('/api/push/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(sub.toJSON()),
    })

    return res.ok
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  const output  = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}
