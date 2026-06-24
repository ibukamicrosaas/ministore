'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface Item {
  product_id: string
  product_name: string
}

interface Props {
  items: Item[]
  orderToken: string
  color: string
}

export function ReviewForm({ items, orderToken, color }: Props) {
  const [ratings, setRatings]   = useState<Record<string, number>>({})
  const [hover, setHover]       = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    for (const item of items) {
      if (!ratings[item.product_id]) {
        setError(`Merci de noter "${item.product_name}".`)
        return
      }
    }

    setLoading(true)
    for (const item of items) {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_token: orderToken,
          product_id:  item.product_id,
          rating:      ratings[item.product_id],
          comment:     comments[item.product_id] ?? '',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Une erreur s\'est produite.')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="text-base font-bold text-gray-900">Merci pour ton avis !</p>
        <p className="text-sm text-gray-500 mt-1">Il sera visible sur la page produit.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {items.map(item => (
        <div key={item.product_id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>

          {/* Étoiles */}
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(star => {
              const filled = star <= (hover[item.product_id] ?? ratings[item.product_id] ?? 0)
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHover(h => ({ ...h, [item.product_id]: star }))}
                  onMouseLeave={() => setHover(h => { const n = { ...h }; delete n[item.product_id]; return n })}
                  onClick={() => setRatings(r => ({ ...r, [item.product_id]: star }))}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className="h-8 w-8"
                    fill={filled ? '#F59E0B' : 'none'}
                    stroke={filled ? '#F59E0B' : '#D1D5DB'}
                  />
                </button>
              )
            })}
            {ratings[item.product_id] && (
              <span className="ml-2 text-sm font-medium text-gray-600">
                {['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent'][ratings[item.product_id]]}
              </span>
            )}
          </div>

          {/* Commentaire */}
          <textarea
            value={comments[item.product_id] ?? ''}
            onChange={e => setComments(c => ({ ...c, [item.product_id]: e.target.value }))}
            placeholder="Ton avis en quelques mots... (optionnel)"
            rows={2}
            maxLength={500}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            style={{ '--color-primary': color } as React.CSSProperties}
          />
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: color }}
      >
        {loading ? 'Envoi en cours...' : 'Publier mon avis'}
      </button>
    </form>
  )
}
