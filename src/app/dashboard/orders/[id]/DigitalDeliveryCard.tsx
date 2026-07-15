'use client'

import { useState } from 'react'
import { Copy, MessageCircle, RefreshCw, Check, X, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'

type DownloadToken = {
  id: string
  token: string
  expires_at: string
  download_count: number
  max_downloads: number
  downloaded_at: string | null
  products: { name: string; digital_file_name: string | null } | null
}

interface Props {
  tokens: DownloadToken[]
  orderId: string
  clientPhone: string
  clientName: string
  appUrl: string
}

export function DigitalDeliveryCard({ tokens, orderId, clientPhone, clientName, appUrl }: Props) {
  const [copied, setCopied]       = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTokens, setModalTokens] = useState<{ token: string; downloadUrl: string; productName: string }[]>([])

  const hasValidToken = tokens.some(dt =>
    new Date(dt.expires_at) > new Date() && dt.download_count < dt.max_downloads
  )

  async function copyLink(token: string) {
    const url = `${appUrl}/telechargement/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // fallback: select the text
    }
  }

  function sendViaWhatsApp(token: string, productName: string) {
    const url = `${appUrl}/telechargement/${token}`
    const msg = `Bonjour ${clientName} ! Voici ton lien de téléchargement pour *${productName}* :\n${url}\n\n_Lien valide 48h — max 5 téléchargements._`
    const waUrl = `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  async function handleResend() {
    setResending(true)
    setResendError(null)
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/resend-digital`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { ok: boolean; tokens: { token: string; downloadUrl: string; productName?: string }[] }
        setModalTokens(data.tokens.map(t => ({
          token:       t.token,
          downloadUrl: t.downloadUrl,
          productName: t.productName ?? 'ton fichier',
        })))
        setModalOpen(true)
      } else {
        const data = await res.json() as { error?: string }
        setResendError(data.error ?? 'Erreur lors du renvoi')
      }
    } catch {
      setResendError('Erreur réseau')
    } finally {
      setResending(false)
    }
  }

  function buildResendMessage(): string {
    if (modalTokens.length === 0) return ''
    const lines: (string | null)[] = [
      `Bonjour ${clientName} 👋`,
      '',
      modalTokens.length === 1
        ? `Voici ton lien de téléchargement pour *${modalTokens[0].productName}* :`
        : 'Voici tes liens de téléchargement :',
      '',
      ...modalTokens.flatMap(t =>
        modalTokens.length > 1
          ? [`*${t.productName}* :`, t.downloadUrl, '']
          : [t.downloadUrl]
      ),
      `_Lien${modalTokens.length > 1 ? 's' : ''} valide${modalTokens.length > 1 ? 's' : ''} 48h — max 5 téléchargements._`,
    ]
    return lines.filter(l => l !== null).join('\n')
  }

  function handleOpenWhatsApp() {
    const msg = buildResendMessage()
    const url = `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleCloseModal() {
    setModalOpen(false)
    setModalTokens([])
    window.location.reload()
  }

  return (
    <>
    <Card>
      <p className="text-sm font-semibold text-gray-900 mb-3">📄 Liens de téléchargement</p>

      {tokens.length === 0 ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-3">
          Aucun lien généré — le client n&apos;a pas encore reçu l&apos;accès à son fichier.
        </p>
      ) : (
        <div className="space-y-4 mb-3">
          {tokens.map(dt => {
            const isExpired    = new Date(dt.expires_at) < new Date()
            const isExhausted  = dt.download_count >= dt.max_downloads
            const isValid      = !isExpired && !isExhausted
            const statusColor  = isValid ? 'text-emerald-600' : 'text-red-500'
            const statusLabel  = isExpired ? 'Expiré' : isExhausted ? 'Épuisé' : 'Actif'
            const downloadUrl  = `${appUrl}/telechargement/${dt.token}`
            const productName  = dt.products?.digital_file_name ?? dt.products?.name ?? 'Fichier'

            return (
              <div key={dt.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate pr-2">{productName}</p>
                  <span className={`text-xs font-semibold shrink-0 ${statusColor}`}>{statusLabel}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Téléchargements : {dt.download_count}/{dt.max_downloads}
                  {dt.downloaded_at && ` · 1er dl : ${new Date(dt.downloaded_at).toLocaleDateString('fr-FR')}`}
                </p>
                <p className="text-xs text-gray-400">
                  Expire le {new Date(dt.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {/* URL + bouton copier */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2.5 py-1.5">
                  <p className="text-xs text-gray-400 truncate flex-1 font-mono">{downloadUrl}</p>
                  <button
                    onClick={() => void copyLink(dt.token)}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    {copied === dt.token
                      ? <><Check className="h-3 w-3" /> Copié</>
                      : <><Copy className="h-3 w-3" /> Copier</>
                    }
                  </button>
                </div>

                {/* Envoyer via WhatsApp */}
                <button
                  onClick={() => sendViaWhatsApp(dt.token, productName)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2 text-xs font-semibold text-white hover:bg-[#20bb5a] transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Envoyer à {clientName} via WhatsApp
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Bouton regénérer — si aucun token valide */}
      {!hasValidToken && (
        <div className="pt-2 border-t border-gray-100">
          {resendError && (
            <p className="text-xs text-red-600 mb-2">{resendError}</p>
          )}
          <button
            onClick={() => void handleResend()}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:border-sky-400 hover:text-sky-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Génération en cours...' : 'Générer un nouveau lien et envoyer au client'}
          </button>
        </div>
      )}
    </Card>

    {/* Modal envoi WhatsApp */}
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl overflow-hidden min-w-0">

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/10">
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Envoyer à {clientName}</p>
                <p className="text-[11px] text-gray-500">Lien généré — prêt à envoyer</p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Aperçu du message */}
          <div className="mb-4 max-h-52 overflow-y-auto rounded-xl bg-[#1B2B33] p-3">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Aperçu du message</p>
            <div className="space-y-0.5 text-[13px] text-white/90 leading-relaxed overflow-hidden">
              {buildResendMessage().split('\n').map((line, i) => {
                if (line === '') return <div key={i} className="h-1.5" />
                const isUrl = line.startsWith('http')
                const parts = line.split(/\*([^*]+)\*/g)
                return (
                  <div key={i} className={isUrl ? 'break-all text-[11px] text-white/60' : 'break-words'}>
                    {parts.map((part, j) =>
                      j % 2 === 1
                        ? <span key={j} className="font-bold text-white">{part}</span>
                        : <span key={j}>{part}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Numéro du client — pré-rempli */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Numéro WhatsApp du client
            </label>
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 font-mono">
              {clientPhone}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCloseModal}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#20bb5a] transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Ouvrir WhatsApp
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
