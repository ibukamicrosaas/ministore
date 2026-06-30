'use client'

import { useState, useEffect } from 'react'
import { X, ImageDown, QrCode } from 'lucide-react'
import { ShareWhatsAppButton } from './ShareWhatsAppButton'
import { APP_URL } from '@/constants'

interface Props {
  shopSlug: string
  shopName: string
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const ACTIONS = [
  {
    id:          'whatsapp',
    emoji:       '💬',
    title:       'WhatsApp — contacts & groupes',
    description: 'Envoie ton lien à tes contacts. C\'est le canal n°1 pour les premières ventes.',
    color:       'bg-green-100 text-green-700',
  },
  {
    id:          'card',
    emoji:       '🖼️',
    title:       'Carte visuelle — statut & stories',
    description: 'Poste l\'image sur ton statut WhatsApp, ta story Instagram ou Facebook.',
    color:       'bg-sky-100 text-sky-700',
  },
  {
    id:          'qr',
    emoji:       '📍',
    title:       'QR code — stand & emballages',
    description: 'Imprime-le et colle-le sur ton stand, ta vitrine ou tes emballages.',
    color:       'bg-purple-100 text-purple-700',
  },
]

export function FirstSalesNudge({ shopSlug, shopName }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [done, setDone]           = useState<Set<string>>(new Set())
  const dismissKey = `ts_nudge_dismissed_${shopSlug}`
  const doneKey    = `ts_nudge_done_${shopSlug}`

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey) === '1')
    try {
      const saved = JSON.parse(localStorage.getItem(doneKey) ?? '[]') as string[]
      setDone(new Set(saved))
    } catch { /* ignore */ }
  }, [dismissKey, doneKey])

  function markDone(id: string) {
    setDone(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem(doneKey, JSON.stringify([...next]))
      return next
    })
  }

  function handleDismiss() {
    localStorage.setItem(dismissKey, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  const shopUrl   = `${APP_URL}/${shopSlug}`
  const waMessage = `Bonjour 👋\n\nDécouvrez *${shopName}* et commandez directement en ligne !\n\n👉 ${shopUrl}`
  const doneCount = done.size

  return (
    <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">

      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">🎯 Attire tes premiers clients</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {doneCount === 0
              ? '3 actions rapides pour tes premières ventes'
              : doneCount === ACTIONS.length
              ? 'Bravo — tu as tout fait ! 🎉'
              : `${doneCount}/${ACTIONS.length} actions effectuées`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">

        {/* Action 1 — WhatsApp */}
        <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${done.has('whatsapp') ? 'bg-white/60' : 'bg-white shadow-sm'}`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done.has('whatsapp') ? 'bg-gray-100' : 'bg-green-100'}`}>
            <span className={done.has('whatsapp') ? 'opacity-40' : ''}><WhatsAppIcon /></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${done.has('whatsapp') ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {ACTIONS[0].title}
            </p>
            {!done.has('whatsapp') && (
              <p className="text-xs text-gray-500 mt-0.5">{ACTIONS[0].description}</p>
            )}
          </div>
          {!done.has('whatsapp') && (
            <ShareWhatsAppButton
              message={waMessage}
              variant="icon"
              className="shrink-0"
            />
          )}
          {done.has('whatsapp') && (
            <span className="text-xs font-medium text-emerald-600 shrink-0">✓ Fait</span>
          )}
        </div>

        {/* Action 2 — Carte visuelle */}
        <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${done.has('card') ? 'bg-white/60' : 'bg-white shadow-sm'}`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done.has('card') ? 'bg-gray-100' : 'bg-sky-100'}`}>
            <ImageDown className={`h-4 w-4 ${done.has('card') ? 'text-gray-400' : 'text-sky-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${done.has('card') ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {ACTIONS[1].title}
            </p>
            {!done.has('card') && (
              <p className="text-xs text-gray-500 mt-0.5">{ACTIONS[1].description}</p>
            )}
          </div>
          {!done.has('card') ? (
            <a
              href={`/api/share/shop-card?slug=${shopSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              download={`carte-${shopSlug}.png`}
              onClick={() => markDone('card')}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <ImageDown className="h-3 w-3" /> Télécharger
            </a>
          ) : (
            <span className="text-xs font-medium text-emerald-600 shrink-0">✓ Fait</span>
          )}
        </div>

        {/* Action 3 — QR code */}
        <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${done.has('qr') ? 'bg-white/60' : 'bg-white shadow-sm'}`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done.has('qr') ? 'bg-gray-100' : 'bg-purple-100'}`}>
            <QrCode className={`h-4 w-4 ${done.has('qr') ? 'text-gray-400' : 'text-purple-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${done.has('qr') ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {ACTIONS[2].title}
            </p>
            {!done.has('qr') && (
              <p className="text-xs text-gray-500 mt-0.5">{ACTIONS[2].description}</p>
            )}
          </div>
          {!done.has('qr') ? (
            <a
              href={`/api/share/qr-code?slug=${shopSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              download={`qrcode-${shopSlug}.png`}
              onClick={() => markDone('qr')}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <QrCode className="h-3 w-3" /> Générer
            </a>
          ) : (
            <span className="text-xs font-medium text-emerald-600 shrink-0">✓ Fait</span>
          )}
        </div>

      </div>
    </div>
  )
}
