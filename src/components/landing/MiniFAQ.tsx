'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export function MiniFAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={item.q}
          className={`rounded-2xl border transition-all duration-200 ${
            open === i
              ? 'border-sky-200 bg-sky-50/60'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className={`text-sm font-semibold leading-snug ${open === i ? 'text-sky-700' : 'text-gray-900'}`}>
              {item.q}
            </span>
            <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
              open === i ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {open === i
                ? <Minus className="h-3.5 w-3.5" />
                : <Plus className="h-3.5 w-3.5" />
              }
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5">
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
