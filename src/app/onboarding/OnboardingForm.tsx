'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createSalon } from '@/lib/actions/settings'
import { TRIAL_DAYS } from '@/constants'
import toast from 'react-hot-toast'

const COUNTRY_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' },
  { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CM', label: '🇨🇲 Cameroun' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'TG', label: '🇹🇬 Togo' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'GN', label: '🇬🇳 Guinée' },
  { value: 'CD', label: '🇨🇩 RDC' },
  { value: 'GA', label: '🇬🇦 Gabon' },
  { value: 'MG', label: '🇲🇬 Madagascar' },
  { value: 'MA', label: '🇲🇦 Maroc' },
]

export function OnboardingForm() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(event.currentTarget)
    const result = await createSalon(formData)

    if (result?.error) {
      toast.error(result.error)
      setErrors({ form: result.error })
    }

    setLoading(false)
  }

  return (
    <Card padding="lg">
      <h2 className="text-base font-semibold text-gray-900 mb-5">
        Informations du salon
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          label="Nom du salon"
          placeholder="Salon Aminata Beauté"
          required
          autoFocus
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="city"
            label="Ville"
            placeholder="Dakar"
            required
            error={errors.city}
          />
          <Select
            name="country"
            label="Pays"
            options={COUNTRY_OPTIONS}
            defaultValue="SN"
          />
        </div>

        <Input
          name="phone_whatsapp"
          type="tel"
          label="Numéro WhatsApp du salon"
          placeholder="+221 77 000 00 00"
          required
          hint="Le numéro qui recevra les notifications de réservations"
          error={errors.phone_whatsapp}
        />

        {errors.form && (
          <p className="text-xs text-red-600 text-center">{errors.form}</p>
        )}

        <Button
          type="submit"
          fullWidth
          loading={loading}
          size="lg"
          className="mt-2"
        >
          Créer mon salon →
        </Button>
      </form>

      <div className="mt-4 rounded-lg bg-orange-50 p-3">
        <p className="text-xs text-orange-700 text-center">
          🎉 <strong>{TRIAL_DAYS} jours d&apos;essai gratuit</strong> — Tu pourras configurer tes services et employées depuis le tableau de bord.
        </p>
      </div>
    </Card>
  )
}
