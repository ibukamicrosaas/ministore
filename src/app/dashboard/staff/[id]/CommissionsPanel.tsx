'use client'

import { useState, useEffect, useCallback } from 'react'
import { getWeek, getYear } from 'date-fns'
import { fr } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'
import { getStaffWeekCommissions, markCommissionsPaid } from '@/lib/actions/commissions'
import type { CommissionWithBooking } from '@/lib/actions/commissions'
import { getWeekOptions } from '@/lib/utils/commissions'
import { CheckCircle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  staffId: string
}

export function CommissionsPanel({ staffId }: Props) {
  const weekOptions = getWeekOptions(8)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [commissions, setCommissions] = useState<CommissionWithBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  const selected = weekOptions[selectedIndex]

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getStaffWeekCommissions(staffId, selected.weekNumber, selected.year)
    setCommissions(result.data ?? [])
    setLoading(false)
  }, [staffId, selected.weekNumber, selected.year])

  useEffect(() => { load() }, [load])

  const unpaidTotal = commissions.filter(c => !c.is_paid).reduce((s, c) => s + c.commission_amount, 0)
  const paidTotal = commissions.filter(c => c.is_paid).reduce((s, c) => s + c.commission_amount, 0)
  const total = commissions.reduce((s, c) => s + c.commission_amount, 0)
  const allPaid = commissions.length > 0 && commissions.every(c => c.is_paid)

  const handleMarkPaid = async () => {
    setPaying(true)
    const result = await markCommissionsPaid(staffId, selected.weekNumber, selected.year)
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      toast.success('Commissions marquées comme payées ✓')
      load()
    }
    setPaying(false)
  }

  return (
    <div className="space-y-4">
      {/* Sélecteur de semaine */}
      <div className="relative">
        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 outline-none focus:border-[#E85D04]"
        >
          {weekOptions.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-bold text-gray-900">{total.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400">FCFA</p>
        </div>
        <div className="rounded-xl bg-green-50 p-3 text-center">
          <p className="text-xs text-green-600">Payé</p>
          <p className="text-sm font-bold text-green-700">{paidTotal.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-green-500">FCFA</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${unpaidTotal > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
          <p className={`text-xs ${unpaidTotal > 0 ? 'text-orange-600' : 'text-gray-500'}`}>À payer</p>
          <p className={`text-sm font-bold ${unpaidTotal > 0 ? 'text-orange-700' : 'text-gray-900'}`}>
            {unpaidTotal.toLocaleString('fr-FR')}
          </p>
          <p className={`text-xs ${unpaidTotal > 0 ? 'text-orange-500' : 'text-gray-400'}`}>FCFA</p>
        </div>
      </div>

      {/* Liste des commissions */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-6">Aucune commission cette semaine.</p>
      ) : (
        <div className="space-y-2">
          {commissions.map((c) => {
            const bookingDate = c.bookings?.booking_date
            const serviceName = c.bookings?.services?.name ?? 'Prestation'
            const dateLabel = bookingDate
              ? format(parseISO(bookingDate + 'T12:00:00'), 'EEE d MMM', { locale: fr })
              : '—'

            return (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                  c.is_paid ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{serviceName}</p>
                  <p className="text-xs text-gray-500">
                    {dateLabel} · {c.commission_rate}% de {c.service_price.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <p className={`text-sm font-bold ${c.is_paid ? 'text-green-600' : 'text-gray-900'}`}>
                    {c.commission_amount.toLocaleString('fr-FR')} FCFA
                  </p>
                  {c.is_paid && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bouton payer */}
      {!loading && unpaidTotal > 0 && !allPaid && (
        <button
          onClick={handleMarkPaid}
          disabled={paying}
          className="w-full rounded-xl bg-[#E85D04] py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
        >
          {paying ? 'Traitement...' : `Marquer ${unpaidTotal.toLocaleString('fr-FR')} FCFA comme payé`}
        </button>
      )}

      {!loading && allPaid && commissions.length > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm font-medium text-green-700">Toutes les commissions ont été payées</p>
        </div>
      )}
    </div>
  )
}
