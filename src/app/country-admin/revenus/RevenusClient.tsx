'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Wallet, ArrowDownToLine, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { PayoutRequestModal } from './PayoutRequestModal'
import { CM_PAYOUT_MIN } from '@/lib/actions/country-admin'

type Payout = {
  id: string
  amount: number
  provider: string
  mobile_money_number: string
  status: string
  requested_at: string
  paid_at: string | null
  admin_reference: string | null
  notes: string | null
}

interface Props {
  totalEarned: number
  totalWithdrawn: number
  available: number
  pendingRequest: boolean
  payouts: Payout[]
  country: string
}

const STATUS_CONFIG = {
  pending:  { label: 'En attente',  icon: Clock,         color: 'text-amber-600 bg-amber-50 border-amber-200' },
  paid:     { label: 'Payé',        icon: CheckCircle2,  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Rejeté',      icon: XCircle,       color: 'text-red-600 bg-red-50 border-red-200' },
}

export function RevenusClient({ totalEarned, totalWithdrawn, available, pendingRequest, payouts, country }: Props) {
  const [showModal, setShowModal] = useState(false)

  const canRequest = available >= CM_PAYOUT_MIN && !pendingRequest

  return (
    <>
      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Solde disponible</p>
          <p className="text-3xl font-black text-emerald-600">{available.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400 mt-0.5">FCFA</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Total encaissé</p>
          <p className="text-2xl font-black text-gray-900">{totalEarned.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400 mt-0.5">FCFA · depuis le début</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Total retiré</p>
          <p className="text-2xl font-black text-gray-900">{totalWithdrawn.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400 mt-0.5">FCFA · retraits effectués</p>
        </div>
      </div>

      {/* ── CTA retrait ── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {pendingRequest
                  ? 'Demande en cours de traitement'
                  : available >= CM_PAYOUT_MIN
                    ? `${available.toLocaleString('fr-FR')} FCFA disponibles`
                    : `Minimum ${CM_PAYOUT_MIN.toLocaleString('fr-FR')} FCFA requis`}
              </p>
              <p className="text-xs text-gray-500">
                {pendingRequest
                  ? 'Tu seras notifié dès que le virement est effectué.'
                  : available >= CM_PAYOUT_MIN
                    ? 'Tu peux demander un retrait maintenant.'
                    : `Il te manque ${(CM_PAYOUT_MIN - available).toLocaleString('fr-FR')} FCFA.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={!canRequest}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Demander un retrait
          </button>
        </div>
      </div>

      {/* ── Historique ── */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Historique des retraits</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {payouts.map(p => {
              const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon
              return (
                <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {p.amount.toLocaleString('fr-FR')} FCFA
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {p.provider.toUpperCase()} · {p.mobile_money_number}
                      </p>
                      {p.admin_reference && (
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">Réf: {p.admin_reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {format(new Date(p.requested_at), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {payouts.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">Aucun retrait effectué pour l&apos;instant.</p>
        </div>
      )}

      {showModal && (
        <PayoutRequestModal
          available={available}
          country={country}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
