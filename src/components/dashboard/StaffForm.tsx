'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createStaff, updateStaff, deactivateStaff } from '@/lib/actions/staff'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Staff, CreateStaffInput } from '@/types'

interface StaffFormProps {
  member?: Staff
}

const REMUNERATION_OPTIONS = [
  { value: 'commission',    label: 'Commission (% des prestations)' },
  { value: 'fixed_salary',  label: 'Salaire fixe mensuel' },
]

export function StaffForm({ member }: StaffFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [remunerationType, setRemunerationType] = useState<string>(
    member?.remuneration_type ?? 'commission'
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const input: CreateStaffInput = {
      first_name: formData.get('first_name') as string,
      last_name: (formData.get('last_name') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      whatsapp: (formData.get('whatsapp') as string) || undefined,
      remuneration_type: formData.get('remuneration_type') as 'commission' | 'fixed_salary',
      commission_rate: formData.get('commission_rate')
        ? parseFloat(formData.get('commission_rate') as string)
        : undefined,
      fixed_salary: formData.get('fixed_salary')
        ? parseInt(formData.get('fixed_salary') as string)
        : undefined,
    }

    const result = member
      ? await updateStaff(member.id, input)
      : await createStaff(input)

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (member) {
      toast.success('Employée mise à jour.')
      setLoading(false)
    }
  }

  async function handleDeactivate() {
    if (!member) return
    if (!confirm(`Désactiver ${member.first_name} ? Elle ne sera plus assignable aux réservations.`)) return

    setDeactivating(true)
    const result = await deactivateStaff(member.id)
    if (result?.error) {
      toast.error(result.error)
      setDeactivating(false)
    } else {
      toast.success('Employée désactivée.')
      router.push('/dashboard/staff')
    }
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="first_name"
            label="Prénom"
            placeholder="Fatou"
            required
            defaultValue={member?.first_name}
          />
          <Input
            name="last_name"
            label="Nom"
            placeholder="Diallo"
            defaultValue={member?.last_name}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="phone"
            type="tel"
            label="Téléphone"
            placeholder="+221 77 000 00 00"
            defaultValue={member?.phone ?? ''}
          />
          <Input
            name="whatsapp"
            type="tel"
            label="WhatsApp"
            placeholder="+221 77 000 00 00"
            defaultValue={member?.whatsapp ?? ''}
          />
        </div>

        <Select
          name="remuneration_type"
          label="Type de rémunération"
          options={REMUNERATION_OPTIONS}
          defaultValue={member?.remuneration_type ?? 'commission'}
          onChange={(e) => setRemunerationType(e.target.value)}
          required
        />

        {remunerationType === 'commission' ? (
          <Input
            name="commission_rate"
            type="number"
            label="Taux de commission (%)"
            placeholder="50"
            min={1}
            max={100}
            step={1}
            required
            defaultValue={member?.commission_rate ?? ''}
            hint="Ex : 50 signifie que l'employée touche 50% de chaque prestation"
          />
        ) : (
          <Input
            name="fixed_salary"
            type="number"
            label="Salaire fixe mensuel (FCFA)"
            placeholder="150000"
            min={0}
            step={5000}
            required
            defaultValue={member?.fixed_salary ?? ''}
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} fullWidth>
            {member ? 'Enregistrer' : 'Ajouter l\'employée'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard/staff')}
          >
            Annuler
          </Button>
        </div>

        {member?.is_active && (
          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={deactivating}
            onClick={handleDeactivate}
            className="mt-2"
          >
            Désactiver cette employée
          </Button>
        )}
      </form>
    </Card>
  )
}
