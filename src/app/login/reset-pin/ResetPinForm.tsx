'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { PinInput } from '@/components/ui/PinInput'
import { requestPinReset, confirmPinReset } from '@/lib/actions/auth'
import toast from 'react-hot-toast'
import Link from 'next/link'

const PHONE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)

const ARROW_LEFT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
)

type Step = 'phone' | 'confirm'

export function ResetPinForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await requestPinReset(phone)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Code envoyé par SMS ✓')
      setStep('confirm')
    }
    setLoading(false)
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await confirmPinReset(phone, code, newPin)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('PIN mis à jour ✓')
      router.push('/login')
    }
    setLoading(false)
  }

  return (
    <Card>
      {step === 'phone' ? (
        <form onSubmit={handleRequestCode} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Numéro de téléphone
            </label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
              <span className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-gray-400 shrink-0">
                {PHONE_SVG}
              </span>
              <input
                type="tel"
                placeholder="77 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 min-w-0 px-3 py-3 text-sm outline-none bg-transparent"
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Envoi...' : 'Recevoir le code par SMS'}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {ARROW_LEFT_SVG}
            Retour à la connexion
          </Link>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Code envoyé au <span className="font-semibold text-gray-900">{phone}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Code reçu par SMS
            </label>
            <PinInput name="code" length={6} onChange={setCode} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Nouveau PIN (6 chiffres)
            </label>
            <PinInput name="newPin" length={6} onChange={setNewPin} />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6 || newPin.length < 6}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Mise à jour...' : 'Changer le PIN'}
          </button>

          <button
            type="button"
            onClick={() => { setStep('phone'); setCode(''); setNewPin('') }}
            className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Renvoyer le code
          </button>
        </form>
      )}
    </Card>
  )
}
