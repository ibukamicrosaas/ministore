'use client'

import { useMemo, useState } from 'react'

export interface HelpQuestion {
  q: string
  a: string
}

export interface HelpCategory {
  title: string
  icon: React.ReactNode
  items: HelpQuestion[]
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function AccordionItem({ item, defaultOpen }: { item: HelpQuestion; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-3.5 text-left text-sm font-medium text-gray-900 hover:text-[var(--color-primary)] transition-colors"
      >
        {item.q}
        <span className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-gray-500">{item.a}</p>
      )}
    </div>
  )
}

export function HelpCenter({ categories }: { categories: HelpCategory[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return categories
    return categories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          item => normalize(item.q).includes(q) || normalize(item.a).includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0)
  }, [categories, query])

  return (
    <div>
      <div className="relative max-w-xl mx-auto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cherche une question (ex : retrait, produit digital, PIN...)"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-gray-400">
          Rien ne correspond à &laquo;&nbsp;{query}&nbsp;&raquo;. Essaie un autre mot, ou écris-nous directement sur WhatsApp.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {filtered.map(cat => (
            <section key={cat.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  {cat.icon}
                </span>
                <h2 className="text-sm font-bold text-gray-900">{cat.title}</h2>
              </div>
              <div>
                {cat.items.map((item, i) => (
                  <AccordionItem key={item.q} item={item} defaultOpen={Boolean(query) && i === 0} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
