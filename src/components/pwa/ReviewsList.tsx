'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

type Review = {
  id: string
  rating: number
  comment: string | null
  client_name: string
  created_at: string
}

const INITIAL_COUNT = 3

export function ReviewsList({ reviews, reviewAvg, reviewCount }: {
  reviews: Review[]
  reviewAvg: number
  reviewCount: number
}) {
  const [expanded, setExpanded] = useState(false)
  const visible   = expanded ? reviews : reviews.slice(0, INITIAL_COUNT)
  const remaining = reviewCount - INITIAL_COUNT

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Avis clients
        </p>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star
                key={s}
                className="h-3 w-3"
                fill={s <= Math.round(reviewAvg) ? '#F59E0B' : 'none'}
                stroke={s <= Math.round(reviewAvg) ? '#F59E0B' : '#D1D5DB'}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700">{reviewAvg}</span>
          <span className="text-xs text-gray-400">({reviewCount})</span>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map(review => (
          <div key={review.id} className="rounded-2xl bg-gray-50 px-4 py-3.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {review.client_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm font-semibold text-gray-800">{review.client_name}</span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    className="h-3 w-3"
                    fill={s <= review.rating ? '#F59E0B' : 'none'}
                    stroke={s <= review.rating ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
            )}
            <p className="mt-2 text-[10px] text-gray-400">
              {new Date(review.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        ))}
      </div>

      {!expanded && remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Voir {remaining} autre{remaining > 1 ? 's' : ''} avis
        </button>
      )}
    </div>
  )
}
