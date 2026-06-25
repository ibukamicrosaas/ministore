'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'

type DownloadToken = {
  token: string
  expires_at: string
  download_count: number
  max_downloads: number
  products: { name: string; digital_file_name: string | null; digital_file_size: number | null } | null
}

interface Props {
  orderId:     string
  clientToken: string
  color:       string
  trackingUrl: string
}

const MAX_ATTEMPTS = 15  // 30 secondes max (intervalle 2s)

function fileSizeLabel(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

export function DigitalDownloadPoller({ orderId, clientToken, color, trackingUrl }: Props) {
  const [tokens, setTokens]   = useState<DownloadToken[]>([])
  const [timedOut, setTimedOut] = useState(false)
  const attempts = useRef(0)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      if (attempts.current >= MAX_ATTEMPTS) { setTimedOut(true); return }

      attempts.current++

      try {
        const res  = await fetch(`/api/orders/download-tokens?order_id=${orderId}&client_token=${clientToken}`)
        const data = await res.json() as { tokens: DownloadToken[] }

        if (data.tokens?.length > 0) {
          if (!cancelled) setTokens(data.tokens)
        } else {
          setTimeout(poll, 2000)
        }
      } catch {
        setTimeout(poll, 2000)
      }
    }

    // Premier check après 1.5s (le webhook a besoin d'un peu de temps)
    setTimeout(poll, 1500)
    return () => { cancelled = true }
  }, [orderId, clientToken])

  // Tokens disponibles → bouton(s) de téléchargement
  if (tokens.length > 0) {
    return (
      <div className="space-y-3 mb-6">
        {tokens.map((dt) => {
          const prod      = dt.products
          const remaining = dt.max_downloads - dt.download_count
          const expiresAt = new Date(dt.expires_at)
          const sizeLabel = prod?.digital_file_size ? fileSizeLabel(prod.digital_file_size) : null

          return (
            <div key={dt.token} className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-500 mb-2">
                Téléchargement numérique
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">
                {prod?.digital_file_name ?? prod?.name ?? 'Fichier'}
                {sizeLabel && <span className="text-gray-400 font-normal ml-1">({sizeLabel})</span>}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expire le {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </span>
                <span>{remaining} téléchargement{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</span>
              </div>
              <a
                href={`/api/download/${dt.token}`}
                download
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: color }}
              >
                <Download className="h-4 w-4" />
                Télécharger
              </a>
            </div>
          )
        })}
      </div>
    )
  }

  // Timeout → fallback avec lien vers la page de suivi
  if (timedOut) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 mb-6 text-left">
        <p className="text-sm font-semibold text-amber-800 mb-1">Votre lien de téléchargement est en cours de génération.</p>
        <p className="text-xs text-amber-700 mb-3">
          Vous le recevrez aussi par SMS/WhatsApp. Cliquez ci-dessous pour y accéder dès qu'il est prêt.
        </p>
        <Link
          href={trackingUrl}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          <Download className="h-4 w-4" />
          Accéder à mon téléchargement
        </Link>
      </div>
    )
  }

  // En attente
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 text-center mb-6">
      <Loader2 className="h-6 w-6 text-violet-400 animate-spin mx-auto mb-2" />
      <p className="text-sm font-semibold text-violet-700">Préparation de votre fichier...</p>
      <p className="text-xs text-violet-400 mt-1">Cela prend quelques secondes</p>
    </div>
  )
}
