'use client'

import { useState } from 'react'
import { Star, Check, Copy } from 'lucide-react'

interface Props {
  reviewUrl: string
  clientName: string
  waNumber: string | null
}

export function CopyReviewLinkButton({ reviewUrl, clientName, waNumber }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(reviewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waMessage = `Bonjour ${clientName} 👋 J'espère que ta commande te plaît ! Si tu as un moment, je serais ravi(e) d'avoir ton avis 🙏 ${reviewUrl}`
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`
    : null

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
        <p className="text-xs font-semibold text-amber-800">Demander un avis client</p>
      </div>
      <p className="text-[10px] text-amber-700 leading-relaxed">
        Envoie ce lien au client par WhatsApp ou SMS — il pourra noter sa commande en quelques secondes.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </button>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#20bb5a] transition-colors"
          >
            Envoyer par WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
