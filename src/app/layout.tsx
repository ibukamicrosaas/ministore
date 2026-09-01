import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { DM_Sans } from 'next/font/google'
import { Space_Grotesk } from 'next/font/google'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Bricolage_Grotesque } from 'next/font/google'
import { IBM_Plex_Mono } from 'next/font/google'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { APP_NAME, APP_URL } from '@/constants'
import { TekkiShopMetaPixel } from '@/components/marketing/TekkiShopMetaPixel'

const outfit = Outfit({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

// Polices dédiées à la landing page (scope ".landing-scope" — voir globals.css), sans impact sur le dashboard
const spaceGrotesk = Space_Grotesk({
  variable: '--font-landing-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-landing-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

// Polices landing v6
const bricolageGrotesque = Bricolage_Grotesque({
  variable: '--lv6-display',
  subsets:  ['latin'],
  weight:   ['500', '700', '800'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--lv6-mono',
  subsets:  ['latin'],
  weight:   ['500', '600'],
})

// Boutiques publiques (scope ".shop-scope" — voir globals.css) : Bricolage
// Grotesque + Inter, décision AI_RULES.md antérieure à ce chantier, jamais
// codée jusqu'ici. Bricolage Grotesque réutilise la police déjà chargée pour
// la landing v6 (--lv6-display), pas un second chargement du même fichier.
const inter = Inter({
  variable: '--font-boutique-sans',
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
})

const description = 'Créez votre boutique en ligne en quelques minutes. Vos clients commandent, paient par Wave ou Orange Money, reçoivent une confirmation WhatsApp. Tout depuis votre téléphone.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Vendez en ligne facilement`,
    template: `%s — ${APP_NAME}`,
  },
  description,
  keywords: ['boutique en ligne', 'vente en ligne', 'wave', 'orange money', 'mobile money', 'Dakar', 'Sénégal', 'Afrique de l\'ouest', 'e-commerce', 'petits vendeurs'],
  authors: [{ name: 'TekkiShop', url: APP_URL }],
  creator: 'TekkiShop',
  publisher: 'Tekki Studio',
  manifest: '/manifest.json',
  openGraph: {
    title: `${APP_NAME} — Vendez en ligne facilement`,
    description,
    url: APP_URL,
    siteName: APP_NAME,
    images: [{ url: '/og-ministore.png', width: 1200, height: 630, alt: 'TekkiShop — Votre boutique en ligne' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Vendez en ligne facilement`,
    description,
    images: ['/og-ministore.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon-180x180.png',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0252EA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${outfit.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${plusJakartaSans.variable} ${bricolageGrotesque.variable} ${ibmPlexMono.variable} ${inter.variable} h-full antialiased`}>
      <body className="h-full bg-gray-50 text-gray-900 font-sans">
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <TekkiShopMetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        )}
      </body>
    </html>
  )
}
