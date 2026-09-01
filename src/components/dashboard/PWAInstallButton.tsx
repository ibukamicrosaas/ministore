'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share2 } from 'lucide-react'
import { type DeviceType, detectDevice, isAlreadyInstalled } from '@/lib/utils/pwa'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallButton() {
  const [device, setDevice] = useState<DeviceType>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isAlreadyInstalled()) return
    if (sessionStorage.getItem('pwa-install-dismissed')) return

    setDevice(detectDevice())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem('pwa-install-dismissed', '1')
  }

  async function handleInstall() {
    if (device === 'ios') {
      setShowIOSModal(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
    setDeferredPrompt(null)
  }

  // Show button only when install is possible
  const canShowNative = (device === 'android-chrome' || device === 'desktop-chrome') && deferredPrompt
  const canShowIOS = device === 'ios'
  if (!canShowNative && !canShowIOS) return null

  return (
    <>
      {/* Install button in TopBar */}
      <button
        onClick={handleInstall}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
        title="Installer l'application"
        aria-label="Installer l'application"
      >
        <Download className="h-5 w-5" />
        {/* Blue dot to attract attention */}
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
      </button>

      {/* iOS instruction modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowIOSModal(false)} />

          <div className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--color-primary)] px-5 pt-6 pb-5">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 rounded-full p-1 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                {/* Mini app icon */}
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-xl">T</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Installer l&apos;app</p>
                  <h2 className="text-lg font-bold text-white leading-tight">TekkiShop sur ton écran</h2>
                </div>
              </div>
              <p className="text-sm text-white/70">Accède à ton dashboard comme une vraie app, sans passer par le navigateur.</p>
            </div>

            {/* Steps */}
            <div className="px-5 py-5 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">3 étapes rapides dans Safari</p>

              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    text: 'Appuie sur l\'icône Partager',
                    sub: 'Le rectangle avec la flèche vers le haut, en bas de Safari',
                    icon: <Share2 className="h-5 w-5 text-[var(--color-primary)]" />,
                  },
                  {
                    step: '2',
                    text: 'Appuie sur "Sur l\'écran d\'accueil"',
                    sub: 'Fais défiler le menu vers le bas pour le trouver',
                    icon: (
                      <svg className="h-5 w-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M14 17.5h7M17.5 14v7" />
                      </svg>
                    ),
                  },
                  {
                    step: '3',
                    text: 'Appuie sur "Ajouter" en haut à droite',
                    sub: 'L\'icône TekkiShop apparaît sur ton écran d\'accueil',
                    icon: (
                      <svg className="h-5 w-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ),
                  },
                ].map(({ step, text, sub, icon }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 border border-sky-100">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setShowIOSModal(false); dismiss() }}
                className="mt-2 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                C&apos;est bon, j&apos;ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
