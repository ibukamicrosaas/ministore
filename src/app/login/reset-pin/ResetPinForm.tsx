'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { PinInput } from '@/components/ui/PinInput'
import { requestPinReset, confirmPinReset } from '@/lib/actions/auth'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
      toast.success('Code envoyé sur WhatsApp ✓')
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
              Numéro WhatsApp
            </label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#E85D04] focus-within:ring-1 focus-within:ring-[#E85D04] transition-all">
              <span className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-500 shrink-0">
                📱
              </span>
              <input
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+221 77 000 00 00"
                className="flex-1 px-3 py-3 text-sm text-gray-900 outline-none bg-white placeholder:text-gray-400"
                autoComplete="tel"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full rounded-xl bg-[#E85D04] py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Envoi...' : 'Recevoir le code WhatsApp'}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
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
              Code reçu par WhatsApp
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
            className="w-full rounded-xl bg-[#E85D04] py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
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
