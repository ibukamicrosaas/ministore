import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { APP_NAME, APP_URL } from '@/constants'

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
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0EA5E9',
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
    <html lang="fr" className={`${outfit.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="h-full bg-gray-50 text-gray-900 font-sans">
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  )
}
