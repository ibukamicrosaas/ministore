'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateTimePicker } from '@/components/booking/DateTimePicker'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ServiceVariant } from '@/types'

interface Props {
  salonSlug: string
  serviceId: string
  availableDays: string[]
  depositPercentage: number
  servicePrice: number
  variants?: ServiceVariant[] | null
}

export function DateTimePickerWrapper({ salonSlug, serviceId, availableDays, depositPercentage, servicePrice, variants }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(
    variants && variants.length > 0 ? null : null
  )

  const hasVariants = variants && variants.length > 0
  const effectivePrice = selectedVariant?.price ?? servicePrice
  const depositAmount = Math.floor(effectivePrice * (depositPercentage / 100))

  const handleSelect = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
  }

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return
    if (hasVariants && !selectedVariant) return

    const params = new URLSearchParams({ date: selectedDate, time: selectedTime })
    if (selectedVariant) {
      params.set('vl', selectedVariant.label)
      params.set('vp', String(selectedVariant.price))
    }
    router.push(`/${salonSlug}/book/${serviceId}/info?${params}`)
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur de variante */}
      {hasVariants && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">Choisissez votre formule</p>
          <div className="space-y-2">
            {variants!.map((v) => {
              const isSelected = selectedVariant?.label === v.label
              const vDeposit = Math.floor(v.price * (depositPercentage / 100))
              return (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-orange-50 ring-1 ring-[var(--color-primary)]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'border-[var(--color-primary)]' : 'border-gray-300'}`}>
                      {isSelected && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{v.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--color-primary)]">{v.price.toLocaleString('fr-FR')} FCFA</p>
                    {vDeposit > 0 && (
                      <p className="text-xs text-gray-400">Acompte : {vDeposit.toLocaleString('fr-FR')} FCFA</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendrier — affiché seulement si variante sélectionnée (ou pas de variantes) */}
      {(!hasVariants || selectedVariant) && (
        <>
          <p className="text-sm font-semibold text-gray-900">Choisissez une date et un créneau</p>
          <DateTimePicker
            salonSlug={salonSlug}
            serviceId={serviceId}
            availableDays={availableDays}
            onSelect={handleSelect}
          />

          {selectedDate && selectedTime && (
            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white active:opacity-80 transition-opacity"
            >
              Réserver pour {format(parseISO(selectedDate + 'T12:00:00'), "EEEE d MMMM", { locale: fr })}, à {selectedTime}
            </button>
          )}
        </>
      )}

      {/* Message si variante pas encore choisie */}
      {hasVariants && !selectedVariant && (
        <p className="text-center text-xs text-gray-400">Sélectionnez une formule pour voir les créneaux disponibles</p>
      )}
    </div>
  )
}
