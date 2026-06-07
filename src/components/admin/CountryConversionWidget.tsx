'use client'

import { useEffect, useState } from 'react'
import { getCountryConversionStats } from '@/lib/actions/analytics'
import { COUNTRIES } from '@/constants/countries'

export default function CountryConversionWidget() {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCountryConversionStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide">Conversion par pays</p>
      <div className="space-y-3">
        {stats.map(({ country, paid, total, rate }) => {
          const countryName = COUNTRIES.find(c => c.code === country)?.label || country
          return (
            <div key={country}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">{countryName}</span>
                <span className="text-sm font-bold text-gray-900">{rate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{paid} payantes / {total} total</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
