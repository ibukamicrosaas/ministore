'use client'

import { useState, useEffect, useRef } from 'react'
import { TrendingUp } from 'lucide-react'
import type { RevenuePeriod } from '@/lib/dashboard/date-range'

const PERIODS: { key: RevenuePeriod; label: string }[] = [
  { key: 'today',    label: 'Auj.' },
  { key: 'yesterday', label: 'Hier' },
  { key: 'week',     label: 'Semaine' },
  { key: 'month',    label: 'Mois' },
  { key: 'quarter',  label: 'Trimestre' },
  { key: 'semester', label: 'Semestre' },
  { key: 'year',     label: 'Année' },
  { key: 'all',      label: 'Tout' },
]

interface Props {
  initialRevenue: number
  initialCount: number
}

export function RevenueCard({ initialRevenue, initialCount }: Props) {
  const [period, setPeriod]   = useState<RevenuePeriod>('today')
  const [revenue, setRevenue] = useState(initialRevenue)
  const [count, setCount]     = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    setLoading(true)
    fetch(`/api/dashboard/revenue?period=${period}`)
      .then(r => r.json())
      .then(d => { setRevenue(d.revenue ?? 0); setCount(d.count ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <div className="col-span-2 rounded-2xl bg-[var(--color-primary)] p-4 text-white">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-medium text-white/70">
            Ventes — {PERIODS.find(p => p.key === period)?.label}
            {count > 0 && (
              <span className="ml-1.5 opacity-60">
                · {count} vente{count > 1 ? 's' : ''}
              </span>
            )}
          </p>
          <p className={`mt-1 text-3xl font-bold tracking-tight transition-opacity duration-150 ${loading ? 'opacity-40' : 'opacity-100'}`}>
            {revenue.toLocaleString('fr-FR')}
            <span className="text-lg font-semibold ml-1 opacity-80">F</span>
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shrink-0">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Sélecteur de période — scroll horizontal */}
      <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
              period === p.key
                ? 'bg-white text-[var(--color-primary)]'
                : 'bg-white/15 text-white/80 hover:bg-white/25'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
