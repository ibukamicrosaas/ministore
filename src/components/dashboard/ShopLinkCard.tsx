'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Share2 } from 'lucide-react'

interface Props {
  shopSlug: string
  appUrl: string
}

export function ShopLinkCard({ shopSlug, appUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${appUrl}/${shopSlug}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-[var(--color-primary)]/30 bg-sky-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
          <Share2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Lien de ton site</p>
          <p className="text-xs text-gray-500">Partage ce lien à tes clients</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-white border border-sky-100 px-3 py-2">
        <p className="flex-1 text-xs text-gray-700 truncate font-mono">{url}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
          title="Ouvrir le site"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-sky-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copier le lien
            </>
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Voir ton site
        </a>
      </div>
    </div>
  )
}
