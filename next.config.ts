import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

// Tunnel de dev (VS Code Dev Tunnels, ngrok, etc.) — dérivé de NEXT_PUBLIC_APP_URL
// plutôt que codé en dur, pour ne pas devoir retoucher ce fichier à chaque nouvelle
// URL de tunnel. Jamais actif en production : serverActions.allowedOrigins
// s'applique aussi en prod (doc Next.js), donc gardé strictement derrière NODE_ENV.
//
// Les deux listes ci-dessous protègent contre deux vérifications DIFFÉRENTES de
// Next.js, avec des valeurs différentes constatées en conditions réelles :
// - allowedDevOrigins : contrôle qui peut charger les assets/endpoints du serveur
//   de dev — l'origine vue par le NAVIGATEUR pour ces requêtes-là est bien celle
//   du tunnel (confirmé par les tests curl/logs webhook de cette session).
// - serverActions.allowedOrigins : contrôle le CSRF sur les Server Actions —
//   ici, constaté empiriquement (log Next.js réel, action-handler.js) que
//   l'en-tête `Origin` envoyé par le navigateur pour CES requêtes précises
//   vaut `localhost:<port>`, pas l'URL du tunnel — cause non élucidée côté
//   navigateur/tunnel, mais la valeur à autoriser est celle qui arrive
//   réellement dans `Origin`, pas celle de la barre d'adresse.
const isDev = process.env.NODE_ENV !== 'production'
let devTunnelHostname: string | null = null
let devServerActionOrigins: string[] = []
if (isDev && process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_APP_URL)
    if (u.hostname !== 'localhost') {
      devTunnelHostname = u.hostname // allowedDevOrigins : hostname seul, sans port
      // Les deux valeurs possibles observées pour l'en-tête Origin des Server
      // Actions derrière ce tunnel : celle du tunnel lui-même, et localhost —
      // les deux gardées pour ne pas devoir redevenir cette énigme au prochain test.
      devServerActionOrigins = [u.host, 'localhost:3000']
    }
  } catch {
    // NEXT_PUBLIC_APP_URL mal formée — pas de tunnel à autoriser, comportement inchangé
  }
}

// CSP : Next.js nécessite 'unsafe-inline' pour les styles Tailwind et les scripts hydration
// Les iframes TikTok/Instagram/Facebook sont autorisées pour les vidéos produit
const csp = [
  "default-src 'self'",
  // blob: requis pour les workers Next.js (RSC streaming, prefetch)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://va.vercel-scripts.com https://vercel.live https://connect.facebook.net",
  // worker-src blob: requis pour que Next.js puisse créer ses workers internes
  "worker-src blob: 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  // *.ingest.sentry.io (sans o* — le wildcard o* est invalide en CSP)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.ingest.sentry.io",
  "frame-src 'self' https://www.tiktok.com https://www.instagram.com https://www.facebook.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',       value: 'on' },
  { key: 'X-Frame-Options',              value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',       value: 'nosniff' },
  { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',           value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // HSTS : force HTTPS pour 2 ans, inclut les sous-domaines
  { key: 'Strict-Transport-Security',    value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy',      value: csp },
]

const nextConfig: NextConfig = {
  ...(devTunnelHostname ? { allowedDevOrigins: [devTunnelHostname] } : {}),
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        // Wildcard pour tous les projets Supabase (prod, staging, local tunnel)
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Supabase Image Transforms (redimensionnement et optimisation côté serveur)
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Durée de cache CDN Next.js pour les images optimisées (7 jours)
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      ...(devServerActionOrigins.length ? { allowedOrigins: devServerActionOrigins } : {}),
    },
  },
}

export default withSentryConfig(nextConfig, {
  org: 'tekki-studio',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
})
