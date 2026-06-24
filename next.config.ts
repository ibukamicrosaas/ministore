import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

// CSP : Next.js nécessite 'unsafe-inline' pour les styles Tailwind et les scripts hydration
// Les iframes TikTok/Instagram/Facebook sont autorisées pour les vidéos produit
const csp = [
  "default-src 'self'",
  // blob: requis pour les workers Next.js (RSC streaming, prefetch)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://va.vercel-scripts.com https://vercel.live",
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
