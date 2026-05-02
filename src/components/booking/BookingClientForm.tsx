'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Service } from '@/types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  salonSlug: string
  service: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'>
  date: string
  time: string
  depositPercentage: number
  variantLabel?: string
  variantPrice?: number
}

export function BookingClientForm({ salonSlug, service, date, time, depositPercentage, variantLabel, variantPrice }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [notes, setNotes] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(true)

  const effectivePrice = variantPrice ?? service.price
  const depositAmount = Math.floor(effectivePrice * (depositPercentage / 100))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !phone.trim()) {
      toast.error('Prénom et téléphone obligatoires')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonSlug,
          serviceId: service.id,
          date,
          time,
          clientFirstName: firstName.trim(),
          clientLastName: lastName.trim() || undefined,
          clientPhone: phone.trim(),
          clientWhatsapp: sameAsPhone ? phone.trim() : whatsapp.trim(),
          notes: notes.trim() || undefined,
          variantLabel,
          variantPrice,
        }),
      })

      const data = await res.json() as {
        bookingId?: string
        requiresPayment?: boolean
        depositAmount?: number
        totalPrice?: number
        error?: string
      }

      if (!res.ok || !data.bookingId) {
        toast.error(data.error ?? 'Une erreur est survenue')
        return
      }

      const params = new URLSearchParams({
        booking_id: data.bookingId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      })

      if (data.requiresPayment) {
        router.push(`/${salonSlug}/book/${service.id}/pay?${params}`)
      } else {
        router.push(`/${salonSlug}/book/success?booking_id=${data.bookingId}`)
      }
    } catch {
      toast.error('Erreur réseau, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Récap service */}
      <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
        <p className="text-sm font-semibold text-gray-900">{service.name}</p>
        {variantLabel && (
          <p className="text-xs text-[var(--color-primary)] font-medium mt-0.5">{variantLabel}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">
          {format(parseISO(date + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })} · {time} · {service.duration_minutes} min
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">Prix total</span>
          <span className="text-sm font-bold text-gray-900">{effectivePrice.toLocaleString('fr-FR')} FCFA</span>
        </div>
        {depositAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Acompte requis ({depositPercentage}%)</span>
            <span className="text-sm font-semibold text-[var(--color-primary)]">{depositAmount.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
      </div>

      {/* Informations client */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Vos informations</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Aminata"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Diallo"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Numéro de téléphone *</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            placeholder="+221 77 000 00 00"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-700">Numéro WhatsApp *</label>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={e => setSameAsPhone(e.target.checked)}
                className="rounded"
              />
              Même que téléphone
            </label>
          </div>
          {!sameAsPhone && (
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="+221 76 000 00 00"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
            placeholder="Précisions sur votre réservation..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white disabled:opacity-60 active:opacity-80 transition-opacity"
      >
        {loading ? 'Traitement...' : 'Continuer vers le paiement →'}
      </button>
    </form>
  )
}
