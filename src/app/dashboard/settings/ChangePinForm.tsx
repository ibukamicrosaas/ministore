'use client'

import { useState } from 'react'
import { PinInput } from '@/components/ui/PinInput'
import { changePin } from '@/lib/actions/auth'
import { CheckCircle2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export function ChangePinForm() {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin]         = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)

  // Reset PinInput keys so they clear after success
  const [resetKey, setResetKey] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPin !== confirmPin) {
      toast.error('Les deux nouveaux PINs ne correspondent pas.')
      return
    }
    if (newPin.length !== 6) {
      toast.error('Le nouveau PIN doit contenir 6 chiffres.')
      return
    }
    setLoading(true)
    const result = await changePin(currentPin, newPin)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setDone(true)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setResetKey(k => k + 1)
      toast.success('Code PIN modifié avec succès ✓')
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-semibold text-gray-900">PIN modifié avec succès</p>
        <p className="text-xs text-gray-500">Utilise ton nouveau code PIN lors de ta prochaine connexion.</p>
        <button
          onClick={() => setDone(false)}
          className="mt-2 text-xs text-[var(--color-primary)] hover:opacity-75 transition-opacity"
        >
          Modifier à nouveau
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 text-center">
          Code PIN actuel
        </label>
        <PinInput key={`current-${resetKey}`} name="current_pin" onChange={setCurrentPin} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 text-center">
          Nouveau code PIN
        </label>
        <PinInput key={`new-${resetKey}`} name="new_pin" onChange={setNewPin} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 text-center">
          Confirmer le nouveau PIN
        </label>
        <PinInput key={`confirm-${resetKey}`} name="confirm_pin" onChange={setConfirmPin} />
      </div>

      <button
        type="submit"
        disabled={loading || currentPin.length < 6 || newPin.length < 6 || confirmPin.length < 6}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {loading ? 'Modification...' : 'Modifier mon PIN'}
      </button>
    </form>
  )
}
