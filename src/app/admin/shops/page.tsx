'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { Settings, ExternalLink, MessageCircle, Search, TrendingUp } from 'lucide-react'
import { COUNTRIES } from '@/constants/countries'

export default function AdminShopsPage() {
  const supabase = createClient()
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState<'all' | 'trial' | 'discovery' | 'business' | 'pro'>('all')
  const [filterCountry, setFilterCountry] = useState<'all' | 'SN' | 'CI' | 'BK' | 'ML' | 'TG' | 'BJ'>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data } = await supabase
        .from('shops')
        .select('id, name, slug, plan, trial_ends_at, city, country, is_active, created_at, phone_whatsapp')
        .order('created_at', { ascending: false })

      if (data) {
        // Diagnostic: voir les codes pays uniques dans la BD
        const uniqueCountries = [...new Set(data.map(s => s.country).filter(Boolean))]
        console.log('🌍 Codes pays dans la BD:', uniqueCountries)
        console.log('Exemples de shops:', data.slice(0, 3).map(s => ({ name: s.name, country: s.country })))
      }

      setShops(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return shops.filter(s => {
      const matchesPlan = filterPlan === 'all' || s.plan === filterPlan
      const matchesCountry = filterCountry === 'all' || (s.country?.toUpperCase() === filterCountry?.toUpperCase())
      const normalizePhone = (phone: string) => phone?.replace(/\D/g, '') || ''
      const matchesSearch = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.city?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        normalizePhone(s.phone_whatsapp).includes(searchQuery.replace(/\D/g, ''))
      return matchesPlan && matchesCountry && matchesSearch
    })
  }, [shops, searchQuery, filterPlan, filterCountry])

  const stats = {
    total: shops.length,
    active: shops.filter(s => s.is_active).length,
    paid: shops.filter(s => s.plan !== 'trial').length,
    trial: shops.filter(s => s.plan === 'trial').length,
  }

  const planConfig = {
    trial: { label: 'Essai', color: 'bg-gray-100 text-gray-700', icon: '📋' },
    discovery: { label: 'Découverte', color: 'bg-emerald-100 text-emerald-700', icon: '🚀' },
    business: { label: 'Business', color: 'bg-blue-100 text-blue-700', icon: '💼' },
    pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700', icon: '👑' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Boutiques</h1>
              <p className="text-gray-500 mt-2">Gère les boutiques et leurs abonnements</p>
            </div>
            <TrendingUp className="h-12 w-12 text-sky-400 opacity-20" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'from-gray-500 to-gray-600' },
              { label: 'Actives', value: stats.active, color: 'from-emerald-500 to-emerald-600' },
              { label: 'Payantes', value: stats.paid, color: 'from-blue-500 to-blue-600' },
              { label: 'Essai', value: stats.trial, color: 'from-amber-500 to-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 text-white shadow-sm`}>
                <p className="text-sm opacity-90 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recherche et filtres ── */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Chercher par nom, ville ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Plan filters */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'trial', 'discovery', 'business', 'pro'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setFilterPlan(plan)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterPlan === plan
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {plan === 'all' ? 'Tous les plans' : planConfig[plan as keyof typeof planConfig]?.label}
              </button>
            ))}
          </div>

          {/* Country filters */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'SN', 'CI', 'BK', 'ML', 'TG', 'BJ'] as const).map((country) => (
              <button
                key={country}
                onClick={() => setFilterCountry(country)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterCountry === country
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {country === 'all' ? 'Tous les pays' : COUNTRIES.find(c => c.code === country)?.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tableau ── */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Boutique</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Plan</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden md:table-cell">Téléphone</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Statut</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden lg:table-cell">Depuis</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{shop.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{shop.city ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${planConfig[shop.plan as keyof typeof planConfig]?.color}`}>
                          <span>{planConfig[shop.plan as keyof typeof planConfig]?.icon}</span>
                          {planConfig[shop.plan as keyof typeof planConfig]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-gray-600 text-xs">
                        {shop.phone_whatsapp ? (
                          <a href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">
                            {shop.phone_whatsapp}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${shop.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {shop.is_active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell">
                        {format(new Date(shop.created_at), 'd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/shops/${shop.id}`}
                            className="p-2 rounded-lg hover:bg-sky-100 text-sky-600 transition-colors"
                            title="Gérer"
                          >
                            <Settings className="h-4 w-4" />
                          </Link>
                          <Link href={`/${shop.slug}`} target="_blank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          {shop.phone_whatsapp && (
                            <a
                              href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              {filtered.length} boutique{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
