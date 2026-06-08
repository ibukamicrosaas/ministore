'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import {
  getActivationRates,
  getChurnRate,
  getMRRBreakdown,
  getPlanDistribution,
  getCustomerSegments,
  getTrendsData,
} from '@/lib/actions/analytics'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']

interface ActivationRate {
  country: string
  activationRate: number
  paid: number
  total: number
}

interface ChurnData {
  churnRate: number
  churned: number
  activeStartMonth: number
}

interface MRRData {
  totalMRR: number
  newMRR: number
  churnedMRR: number
  netMRR: number
  byPlan: { discovery: number; business: number; pro: number }
}

interface PlanDist {
  trial: number
  discovery: number
  business: number
  pro: number
}

interface Segment {
  country: string
  plan: string
  isActive: boolean
  count: number
}

interface Trend {
  date: string
  mrr: number
  activations: number
  churns: number
}

export default function DetailedAnalyticsPage() {
  const [activationRates, setActivationRates] = useState<ActivationRate[]>([])
  const [churnRate, setChurnRate] = useState<ChurnData | null>(null)
  const [mrrBreakdown, setMrrBreakdown] = useState<MRRData | null>(null)
  const [planDist, setPlanDist] = useState<PlanDist | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getActivationRates(),
      getChurnRate(),
      getMRRBreakdown(),
      getPlanDistribution(),
      getCustomerSegments(),
      getTrendsData(),
    ])
      .then(([a, c, m, p, s, t]) => {
        setActivationRates(a)
        setChurnRate(c)
        setMrrBreakdown(m)
        setPlanDist(p)
        setSegments(s)
        setTrends(t)
      })
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Analytics détaillées</h1>
          <p className="text-gray-500 mt-1 capitalize">
            {format(now, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement des données...</div>
        ) : (
          <>
            {/* 1. Activation Rate par pays */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Activation Rate par pays</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activationRates.map(({ country, activationRate, paid, total }) => (
                  <div key={country} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900">{country}</span>
                      <span className="text-lg font-bold text-amber-600">{activationRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${activationRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{paid} payantes / {total} total</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Churn Rate */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-bold text-gray-900">Churn Rate (ce mois)</h2>
              </div>
              {churnRate && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                    <p className="text-xs text-red-600 font-semibold mb-1">Taux de churn</p>
                    <p className="text-3xl font-bold text-red-700">{churnRate.churnRate}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                    <p className="text-xs text-red-600 font-semibold mb-1">Boutiques parties</p>
                    <p className="text-3xl font-bold text-red-700">{churnRate.churned}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                    <p className="text-xs text-red-600 font-semibold mb-1">Actives début mois</p>
                    <p className="text-3xl font-bold text-red-700">{churnRate.activeStartMonth}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. MRR Breakdown */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-bold text-gray-900">MRR Breakdown</h2>
              </div>
              {mrrBreakdown && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
                        <p className="text-xs text-sky-600 font-semibold mb-1">MRR Total</p>
                        <p className="text-2xl font-bold text-sky-700">
                          {mrrBreakdown.totalMRR.toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-semibold mb-1">New MRR (30j)</p>
                        <p className="text-2xl font-bold text-emerald-700">
                          +{mrrBreakdown.newMRR.toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs text-red-600 font-semibold mb-1">Churned MRR (30j)</p>
                        <p className="text-2xl font-bold text-red-700">
                          -{mrrBreakdown.churnedMRR.toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-xs text-purple-600 font-semibold mb-1">Impact net</p>
                        <p className={`text-2xl font-bold ${mrrBreakdown.netMRR >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {mrrBreakdown.netMRR >= 0 ? '+' : ''}{mrrBreakdown.netMRR.toLocaleString('fr-FR')} F
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-4">MRR par plan</p>
                    <div className="space-y-2">
                      {[
                        { plan: 'Découverte', value: mrrBreakdown.byPlan.discovery, color: 'bg-emerald-100' },
                        { plan: 'Business', value: mrrBreakdown.byPlan.business, color: 'bg-blue-100' },
                        { plan: 'Pro', value: mrrBreakdown.byPlan.pro, color: 'bg-purple-100' },
                      ].map(({ plan, value, color }) => (
                        <div key={plan} className={`${color} rounded-lg p-3`}>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-700">{plan}</span>
                            <span className="font-bold text-gray-900">{value.toLocaleString('fr-FR')} F</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Plan Distribution (Pie Chart) */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Plan Distribution</h2>
              {planDist && (
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Essai', value: planDist.trial },
                          { name: 'Découverte', value: planDist.discovery },
                          { name: 'Business', value: planDist.business },
                          { name: 'Pro', value: planDist.pro },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 5. Customer Segments (Table) */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Customer Segments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Pays</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Plan</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Nombre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {segments.slice(0, 20).map(({ country, plan, isActive, count }) => (
                      <tr key={`${country}-${plan}-${isActive}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{country}</td>
                        <td className="px-4 py-3 text-gray-600">{plan}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. Trends (30 jours) */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Trends (30 derniers jours)</h2>
              {trends && trends.length > 0 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-4">MRR Trend</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="mrr" stroke="#0ea5e9" strokeWidth={2} name="MRR" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-4">Activations vs Churns</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="activations" fill="#10b981" name="Activations" />
                        <Bar dataKey="churns" fill="#ef4444" name="Churns" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
