'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { onboardingCreateService, onboardingCreateStaff } from '@/lib/actions/onboarding'
import toast from 'react-hot-toast'
import { CheckCircle2, ChevronRight, Scissors, Users, ArrowRight } from 'lucide-react'

type Step = 'service' | 'staff' | 'done'

export function SetupWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('service')
  const [saving, setSaving] = useState(false)

  // Service form state
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('60')
  const [servicePrice, setServicePrice] = useState('')

  // Staff form state
  const [staffFirstName, setStaffFirstName] = useState('')
  const [staffLastName, setStaffLastName] = useState('')

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault()
    if (!serviceName || !servicePrice) return
    setSaving(true)

    const result = await onboardingCreateService({
      name: serviceName.trim(),
      duration_minutes: parseInt(serviceDuration, 10),
      price: parseInt(servicePrice, 10),
    })

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Service ajouté ✓')
      setStep('staff')
    }
    setSaving(false)
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!staffFirstName) return
    setSaving(true)

    const result = await onboardingCreateStaff({
      first_name: staffFirstName.trim(),
      last_name: staffLastName.trim() || undefined,
    })

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Employée ajoutée ✓')
      setStep('done')
    }
    setSaving(false)
  }

  function handleSkipStaff() {
    setStep('done')
  }

  if (step === 'done') {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Votre salon est prêt !</h2>
            <p className="text-sm text-gray-500 mt-1">
              Vous pouvez maintenant recevoir des réservations.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 rounded-xl bg-[#E85D04] px-6 py-3 text-sm font-semibold text-white"
          >
            Accéder au tableau de bord
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        <StepBadge n={1} label="Premier service" icon={<Scissors className="h-3.5 w-3.5" />} active={step === 'service'} done={step === 'staff'} />
        <div className="flex-1 h-px bg-gray-200" />
        <StepBadge n={2} label="Première employée" icon={<Users className="h-3.5 w-3.5" />} active={step === 'staff'} done={false} />
      </div>

      {/* Step 1 — Service */}
      {step === 'service' && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
              <Scissors className="h-4 w-4 text-[#E85D04]" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Ajoutez votre premier service</h2>
          </div>

          <form onSubmit={handleCreateService} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom du service</label>
              <input
                type="text"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                placeholder="Ex : Tresse box braid, Défrisage..."
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E85D04]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Durée (minutes)</label>
                <select
                  value={serviceDuration}
                  onChange={e => setServiceDuration(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E85D04] bg-white"
                >
                  {[30, 45, 60, 90, 120, 150, 180, 240, 300, 360].map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prix (FCFA)</label>
                <input
                  type="number"
                  value={servicePrice}
                  onChange={e => setServicePrice(e.target.value)}
                  placeholder="5000"
                  min="0"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E85D04]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !serviceName || !servicePrice}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85D04] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Ajout...' : 'Ajouter ce service'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </Card>
      )}

      {/* Step 2 — Staff */}
      {step === 'staff' && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
              <Users className="h-4 w-4 text-[#E85D04]" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Ajoutez votre première employée</h2>
          </div>

          <form onSubmit={handleCreateStaff} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
                <input
                  type="text"
                  value={staffFirstName}
                  onChange={e => setStaffFirstName(e.target.value)}
                  placeholder="Aminata"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E85D04]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom (optionnel)</label>
                <input
                  type="text"
                  value={staffLastName}
                  onChange={e => setStaffLastName(e.target.value)}
                  placeholder="Diallo"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E85D04]"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Vous pourrez définir sa rémunération et ses services dans les paramètres.
            </p>

            <button
              type="submit"
              disabled={saving || !staffFirstName}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85D04] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Ajout...' : 'Ajouter cette employée'}
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSkipStaff}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
            >
              Passer cette étape
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}

function StepBadge({ n, label, icon, active, done }: {
  n: number
  label: string
  icon: React.ReactNode
  active: boolean
  done: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
        done ? 'bg-green-500 text-white' : active ? 'bg-[#E85D04] text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <p className={`text-xs font-medium ${active ? 'text-[#E85D04]' : done ? 'text-green-600' : 'text-gray-400'}`}>
        {label}
      </p>
    </div>
  )
}
