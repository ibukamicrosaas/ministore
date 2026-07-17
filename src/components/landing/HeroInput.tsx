'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

export function HeroInput() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const slug = toSlug(value)
  const hasSlug = slug.length > 0
  const active = focused || hasSlug

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (value.trim()) params.set('name', value.trim())
    if (slug) params.set('slug', slug)
    router.push(`/onboarding?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto lg:mx-0">
      {/* Pill — le focus couvre tout le conteneur */}
      <div
        className="flex items-center rounded-2xl bg-white transition-all duration-200"
        style={{
          border: `2px solid ${active ? 'var(--color-primary)' : '#e5e7eb'}`,
          boxShadow: active ? '0 0 0 4px rgba(14,165,233,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Préfixe URL — toujours visible */}
        <span
          className="shrink-0 pl-4 select-none whitespace-nowrap font-semibold transition-colors duration-200"
          style={{
            fontSize: 13,
            color: active ? 'var(--color-primary)' : '#9ca3af',
          }}
        >
          tekki.shop/
        </span>

        {/* Champ de saisie */}
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="ton-business"
          maxLength={50}
          className="flex-1 min-w-0 px-1 py-4 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300 font-medium"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        {/* Bouton CTA intégré */}
        <button
          type="submit"
          className="shrink-0 m-1.5 flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <span>Créer ma boutique</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Ligne sous le champ */}
      <div className="mt-2.5 h-5 px-1">
        {hasSlug ? (
          <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            ✓ Ton lien sera : <strong>tekki.shop/{slug}</strong>
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            Tape le nom de ton business — ton lien apparaît automatiquement
          </p>
        )}
      </div>
    </form>
  )
}
