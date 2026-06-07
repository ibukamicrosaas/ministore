'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createShop } from '@/lib/actions/settings'
import { TRIAL_DAYS } from '@/constants'
import { detectCountryFromPhone } from '@/lib/payments/bictorys'
import { createClient } from '@/lib/supabase/client'
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
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)

  // Récupérer et pré-détecter le country depuis le phone du profile utilisateur
  useEffect(() => {
    async function detectCountry() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single()

      if (profile?.phone) {
        const detected = detectCountryFromPhone(profile.phone)
        setDetectedCountry(detected)
      }
    }

    detectCountry()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(event.currentTarget)
    const result = await createShop(formData)

    if (result?.error) {
      toast.error(result.error)
      setErrors({ form: result.error })
    }

    setLoading(false)
  }

  return (
    <Card padding="lg">
      <h2 className="text-base font-semibold text-gray-900 mb-5">
        Informations du shop
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          label="Nom du shop"
          placeholder="Shop Aminata Beauté"
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
            placeholder="Sélectionne ton pays"
            defaultValue={detectedCountry ?? undefined}
            options={COUNTRY_OPTIONS}
            required
            error={errors.country}
          />
        </div>

        <Input
          name="phone_whatsapp"
          type="tel"
          label="Numéro WhatsApp du shop"
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
          Créer mon shop →
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
