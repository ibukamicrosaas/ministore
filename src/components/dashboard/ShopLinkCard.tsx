'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Share2, ImageDown, QrCode } from 'lucide-react'
import { ShareWhatsAppButton } from './ShareWhatsAppButton'

interface Props {
  shopSlug: string
  appUrl: string
  shopName?: string
}

// SPEC-refonte-dashboard-marchand.md section 5 (Lot 3) — un seul bouton
// principal plein (WhatsApp), le reste en actions secondaires discrètes.
// "Carte" conservée en secondaire (pas supprimée) faute de données d'usage
// réelles pour trancher — décision actée dans le plan validé.
export function ShopLinkCard({ shopSlug, appUrl, shopName }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${appUrl.replace(/^http:\/\//, 'https://')}/${shopSlug}`
  const waMessage = `Bonjour 👋\n\nDécouvrez *${shopName ?? shopSlug}* et commandez directement en ligne !\n\n👉 ${url}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--db-primary-soft,#E7EFFF)] shrink-0">
          <Share2 className="h-4 w-4 text-[var(--db-primary,#155EEF)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Fais connaître ta boutique</p>
          <p className="text-xs text-gray-500">Une seule chose à faire aujourd&apos;hui</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
        <p className="flex-1 text-xs text-gray-700 truncate font-mono">{url}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-gray-400 hover:text-[var(--db-primary,#155EEF)] transition-colors"
          title="Ouvrir le site"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Action principale — seule action pleine couleur de la carte */}
      <ShareWhatsAppButton message={waMessage} variant="primary" />

      {/* Actions secondaires — discrètes, jamais au même niveau visuel */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={handleCopy}
          className="flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? <span className="text-green-600">Copié !</span> : 'Copier'}
        </button>
        <a
          href={`/api/share/qr-code?slug=${shopSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          download={`qrcode-${shopSlug}.png`}
          title="Télécharger le QR code"
          className="flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <QrCode className="h-3.5 w-3.5" />
          QR code
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Voir le site
        </a>
        <a
          href={`/api/share/shop-card?slug=${shopSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          download={`carte-boutique-${shopSlug}.png`}
          title="Télécharger la carte boutique"
          className="flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ImageDown className="h-3.5 w-3.5" />
          Carte
        </a>
      </div>
    </div>
  )
}
