'use client'

import { useState, useTransition } from 'react'
import { deleteMyAccount } from '@/lib/actions/account'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  shopName: string
}

export function DeleteAccountButton({ shopName }: Props) {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [pending, startTransition] = useTransition()

  const confirmed = input.trim() === shopName.trim()

  function handleDelete() {
    if (!confirmed) return
    startTransition(async () => {
      const result = await deleteMyAccount()
      if (result?.error) {
        toast.error(result.error)
      }
      // En cas de succès, redirect() est appelé côté serveur
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer mon compte
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Supprimer le compte</h2>
              </div>
              <button
                onClick={() => { setOpen(false); setInput('') }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <p className="text-sm font-semibold text-red-600">
                Cette action est irréversible.
              </p>
              <p className="text-sm text-gray-600">
                La suppression effacera définitivement :
              </p>
              <ul className="text-sm text-gray-600 space-y-1 pl-4 list-disc">
                <li>Ta boutique et tous ses produits</li>
                <li>Toutes tes commandes et tes clients</li>
                <li>Tes paramètres, codes promo et données affilié</li>
                <li>Ton compte et tes accès</li>
              </ul>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Pour confirmer, tape le nom de ta boutique :{' '}
                <span className="font-bold text-gray-900">{shopName}</span>
              </label>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={shopName}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setInput('') }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={!confirmed || pending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
