'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'

const REASONS = [
  { value: 'sexual_no_consent', label: 'Contenu à caractère sexuel/intime sans consentement' },
  { value: 'impersonation',     label: "Usurpation d'identité (marque, organisme, personne)" },
  { value: 'scam',              label: 'Arnaque / produit non reçu' },
  { value: 'other',             label: 'Autre' },
] as const

type Reason = typeof REASONS[number]['value']

interface Props {
  shopId: string
  productId?: string
  /** Style plus discret pour un contexte déjà chargé (ex. sous des boutons d'action). */
  className?: string
}

export function ReportContentLink({ shopId, productId, className }: Props) {
  const [open, setOpen]         = useState(false)
  const [reason, setReason]     = useState<Reason>('sexual_no_consent')
  const [detail, setDetail]     = useState('')
  const [contact, setContact]   = useState('')
  const [status, setStatus]     = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function close() {
    setOpen(false)
    setStatus('idle')
    setDetail('')
    setContact('')
    setReason('sexual_no_consent')
    setErrorMsg('')
  }

  async function submit() {
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shop_id:          shopId,
          product_id:       productId ?? null,
          reason,
          detail:           detail.trim() || null,
          reporter_contact: contact.trim() || null,
        }),
      })
      if (res.ok) {
        setStatus('sent')
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setErrorMsg(data.error ?? "Erreur lors de l'envoi.")
        setStatus('error')
      }
    } catch {
      setErrorMsg('Erreur réseau.')
      setStatus('error')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'mt-2 flex w-full items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors'}
      >
        <Flag className="h-3 w-3" />
        {productId ? 'Signaler ce produit' : 'Signaler cette boutique'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">
                Signaler {productId ? 'ce produit' : 'cette boutique'}
              </p>
              <button onClick={close} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {status === 'sent' ? (
              <div className="text-center py-4">
                <p className="text-sm font-semibold text-emerald-700 mb-1">Signalement envoyé</p>
                <p className="text-xs text-gray-500 mb-4">Merci, notre équipe va l&apos;examiner.</p>
                <button
                  onClick={close}
                  className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Motif</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value as Reason)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  >
                    {REASONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Détail (optionnel)</label>
                  <textarea
                    value={detail}
                    onChange={e => setDetail(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 resize-none"
                    placeholder="Précise ce que tu as vu..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ton contact (optionnel)</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    placeholder="E-mail ou téléphone, si tu veux qu'on te recontacte"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-xs text-red-600">{errorMsg}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={close}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => void submit()}
                    disabled={status === 'sending'}
                    className="flex-1 rounded-xl bg-gray-800 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
                  >
                    {status === 'sending' ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
