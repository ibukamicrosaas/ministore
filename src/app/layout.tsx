import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Fraunces } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { APP_NAME, APP_URL } from '@/constants'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['700', '900'],
})

const description = 'Créez une page de réservation pour votre salon en quelques minutes. Vos clientes réservent, paient par Wave ou Orange Money, reçoivent un rappel WhatsApp. Tout depuis votre téléphone.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Mettez votre salon en ligne`,
    template: `%s — ${APP_NAME}`,
  },
  description,
  keywords: ['salon de beauté', 'réservation en ligne', 'wave', 'orange money', 'coiffure', 'Dakar', 'Sénégal', 'Afrique', 'mobile money'],
  authors: [{ name: 'Sheka', url: APP_URL }],
  creator: 'Sheka',
  publisher: 'Tekki Studio',
  manifest: '/manifest.json',
  openGraph: {
    title: `${APP_NAME} — Mettez votre salon en ligne`,
    description,
    url: APP_URL,
    siteName: APP_NAME,
    images: [{ url: '/og-sheka.png', width: 1200, height: 630, alt: 'Sheka — Gestion de salon de beauté' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Mettez votre salon en ligne`,
    description,
    images: ['/og-sheka.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#E85D04',
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
    <html lang="fr" className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="h-full bg-gray-50 text-gray-900">
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  )
}
