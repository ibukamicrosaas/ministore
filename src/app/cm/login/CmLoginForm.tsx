'use client'

import { useState, useTransition } from 'react'
import { cmSignIn } from '@/lib/actions/cm-auth'

export function CmLoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await cmSignIn(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="bg-[#161b27] border border-white/[0.06] rounded-2xl p-6 space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-gray-400 mb-1.5">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ton@email.com"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-gray-400 mb-1.5">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60 transition-colors"
      >
        {pending ? 'Connexion...' : 'Se connecter'}
      </button>

      <p className="text-[11px] text-gray-600 text-center">
        Accès accordé par invitation uniquement — contacte l&rsquo;équipe TEKKIShop si tu n&rsquo;as pas reçu tes identifiants.
      </p>
    </form>
  )
}
