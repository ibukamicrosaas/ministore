export type DeviceType = 'ios' | 'android-chrome' | 'desktop-chrome' | null

export function detectDevice(): DeviceType {
  if (typeof window === 'undefined') return null
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)
  const isAndroid = /Android/.test(ua)
  if (isIOS) return 'ios'
  if (isChrome && isAndroid) return 'android-chrome'
  if (isChrome) return 'desktop-chrome'
  return null
}

// Web Push sur Safari iOS n'est disponible que pour un site ajouté à l'écran
// d'accueil (mode standalone) — dans un onglet Safari classique, la demande
// de permission n'aboutit à rien d'utilisable. Voir PushPermissionPrompt.tsx.
export function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
