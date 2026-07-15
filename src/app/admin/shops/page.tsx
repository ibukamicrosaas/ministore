'use client'

import { useState, useMemo, useEffect } from 'react'
import { getAllShopsForAdmin } from '@/lib/actions/admin-shops'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { Settings, ExternalLink, MessageCircle, Search, TrendingUp, X, Download, CreditCard, ChevronUp, ChevronDown, Send } from 'lucide-react'
import { COUNTRIES } from '@/constants/countries'

const KNOWN_CODES = ['SN', 'CI', 'BK', 'ML', 'TG', 'BJ'] as const
type KnownCode = typeof KNOWN_CODES[number]
type CountryFilter = 'all' | KnownCode | 'other'
type PlanFilter = 'all' | 'trial' | 'decouverte' | 'business' | 'pro'
type SegmentFilter = 'all' | 'ready' | 'started' | 'ghost'
type StatusFilter = 'all' | 'active' | 'inactive'
type SortField = 'name' | 'plan' | 'created_at' | 'subscription_ends_at'
type SortDir = 'asc' | 'desc'

const PLAN_ORDER: Record<string, number> = { trial: 0, decouverte: 1, business: 2, pro: 3 }

const SEGMENT_CONFIG: Record<SegmentFilter, { label: string; description: string; color: string; icon: string }> = {
  all:     { label: 'Tous',      description: '',                         color: 'bg-gray-100 text-gray-600',      icon: '' },
  ready:   { label: 'Prêts',     description: '≥ 3 produits',             color: 'bg-emerald-100 text-emerald-700', icon: '🟢' },
  started: { label: 'Démarrés',  description: '1-2 produits',             color: 'bg-sky-100 text-sky-700',        icon: '🔵' },
  ghost:   { label: 'Fantômes',  description: '0 produit',                color: 'bg-gray-100 text-gray-500',      icon: '👻' },
}

function getSegment(shop: { product_count?: number }): Exclude<SegmentFilter, 'all'> {
  const pc = shop.product_count ?? 0
  if (pc >= 3) return 'ready'
  if (pc >= 1) return 'started'
  return 'ghost'
}

const COUNTRY_FLAGS: Record<string, string> = {
  SN: '🇸🇳', CI: '🇨🇮', BK: '🇧🇫', ML: '🇲🇱', TG: '🇹🇬', BJ: '🇧🇯',
}

const PLAN_CONFIG = {
  trial:      { label: 'Essai',      badge: 'bg-gray-100 text-gray-700',      icon: '📋' },
  decouverte: { label: 'Découverte', badge: 'bg-emerald-100 text-emerald-700', icon: '🚀' },
  business:   { label: 'Business',   badge: 'bg-blue-100 text-blue-700',       icon: '💼' },
  pro:        { label: 'Pro',        badge: 'bg-purple-100 text-purple-700',   icon: '👑' },
} as const

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState<PlanFilter>('all')
  const [filterCountry, setFilterCountry] = useState<CountryFilter>('all')
  const [filterSegment, setFilterSegment] = useState<SegmentFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [campaignMessage, setCampaignMessage] = useState('')
  const [campaignSending, setCampaignSending] = useState(false)
  const [campaignResult, setCampaignResult] = useState<{ sent: number; failed: number; skipped: number } | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await getAllShopsForAdmin()
      setShops(data)
    } catch (err) {
      console.error('[admin/shops] loadData:', err)
    } finally {
      setLoading(false)
    }
  }

  // Comptages pour les badges des filtres (calculés sur tout le dataset)
  const planCounts = useMemo(() => {
    const c: Record<string, number> = { all: shops.length }
    for (const s of shops) c[s.plan] = (c[s.plan] ?? 0) + 1
    return c
  }, [shops])

  const countryCounts = useMemo(() => {
    const c: Record<string, number> = { all: shops.length, other: 0 }
    for (const s of shops) {
      const code = (s.country ?? '').toUpperCase()
      if (KNOWN_CODES.includes(code as KnownCode)) {
        c[code] = (c[code] ?? 0) + 1
      } else {
        c.other++
      }
    }
    return c
  }, [shops])

  // Comptages des segments pour les boutiques en essai
  const segmentCounts = useMemo(() => {
    const trialShops = shops.filter(s => s.plan === 'trial')
    const c: Record<SegmentFilter, number> = { all: trialShops.length, ready: 0, started: 0, ghost: 0 }
    for (const s of trialShops) c[getSegment(s)]++
    return c
  }, [shops])

  const filtered = useMemo(() => {
    // Normalisation du query téléphone — on ne l'utilise que s'il contient des chiffres
    const phoneQuery = searchQuery.replace(/\D/g, '')

    return shops.filter(s => {
      // Filtre plan
      if (filterPlan !== 'all' && s.plan !== filterPlan) return false

      // Filtre segment (uniquement pertinent pour les boutiques en essai)
      if (filterSegment !== 'all') {
        if (s.plan !== 'trial') return false
        if (getSegment(s) !== filterSegment) return false
      }

      // Filtre statut actif/inactif
      if (filterStatus === 'active'   && !s.is_active) return false
      if (filterStatus === 'inactive' &&  s.is_active) return false

      // Filtre pays
      const code = (s.country ?? '').toUpperCase()
      if (filterCountry !== 'all') {
        if (filterCountry === 'other') {
          if (KNOWN_CODES.includes(code as KnownCode)) return false
        } else {
          if (code !== filterCountry) return false
        }
      }

      // Recherche texte — bug fix : le match téléphone n'est actif que si la query contient des chiffres
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const nameMatch  = (s.name  ?? '').toLowerCase().includes(q)
        const cityMatch  = (s.city  ?? '').toLowerCase().includes(q)
        const phoneMatch = phoneQuery.length > 0 &&
          (s.phone_whatsapp ?? '').replace(/\D/g, '').includes(phoneQuery)
        if (!nameMatch && !cityMatch && !phoneMatch) return false
      }

      return true
    })
  }, [shops, searchQuery, filterPlan, filterCountry, filterSegment, filterStatus])

  const sorted = useMemo(() => {
    if (!sortField) return filtered
    return [...filtered].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sortField === 'name') {
        av = (a.name ?? '').toLowerCase()
        bv = (b.name ?? '').toLowerCase()
      } else if (sortField === 'plan') {
        av = PLAN_ORDER[a.plan] ?? 0
        bv = PLAN_ORDER[b.plan] ?? 0
      } else if (sortField === 'created_at') {
        av = a.created_at ?? ''
        bv = b.created_at ?? ''
      } else if (sortField === 'subscription_ends_at') {
        av = a.subscription_ends_at ?? '9999-12-31'
        bv = b.subscription_ends_at ?? '9999-12-31'
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortDir])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  async function handleSendCampaign() {
    if (!campaignMessage.trim()) return
    const recipients = sorted.filter(s => s.phone_whatsapp)
    if (recipients.length === 0) return
    setCampaignSending(true)
    setCampaignResult(null)
    try {
      const res = await fetch('/api/admin/sms-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: campaignMessage, shopIds: recipients.map((s: any) => s.id) }),
      })
      if (res.ok) {
        const data = await res.json() as { sent: number; failed: number; skipped: number }
        setCampaignResult(data)
      }
    } finally {
      setCampaignSending(false)
    }
  }

  const stats = useMemo(() => ({
    total:         shops.length,
    active:        shops.filter(s => s.is_active).length,
    paid:          shops.filter(s => s.plan !== 'trial').length,
    trial:         shops.filter(s => s.plan === 'trial').length,
    totalRevenue:  shops.reduce((s: number, shop: any) => s + (shop.online_revenue ?? 0), 0),
  }), [shops])

  const hasFilters = filterPlan !== 'all' || filterCountry !== 'all' || filterSegment !== 'all' || filterStatus !== 'all' || searchQuery.length > 0

  function resetFilters() {
    setSearchQuery('')
    setFilterPlan('all')
    setFilterCountry('all')
    setFilterSegment('all')
    setFilterStatus('all')
  }

  function exportCSV() {
    const headers = ['Boutique', 'Plan', 'Statut', 'Cycle', 'Segment', 'Nb produits', 'Téléphone WhatsApp', 'Ville', 'Pays', 'Date d\'inscription', 'Expiration abonnement', 'Lien boutique']
    const rows = sorted.map(s => {
      const code = (s.country ?? '').toUpperCase()
      const countryLabel = COUNTRIES.find(c => c.code === code)?.label ?? s.country ?? ''
      const planLabel = PLAN_CONFIG[s.plan as keyof typeof PLAN_CONFIG]?.label ?? s.plan ?? ''
      const shopUrl = `${window.location.origin}/${s.slug}`
      const date = s.created_at ? format(new Date(s.created_at), 'd MMM yyyy', { locale: fr }) : ''
      const expiry = s.subscription_ends_at ? format(new Date(s.subscription_ends_at), 'd MMM yyyy', { locale: fr }) : ''
      const cycle = s.is_annual ? 'Annuel' : s.plan !== 'trial' ? 'Mensuel' : ''
      const segment = s.plan === 'trial' ? SEGMENT_CONFIG[getSegment(s)].label : ''
      const statusLabel = s.is_active ? 'Actif' : 'Inactif'
      return [s.name ?? '', planLabel, statusLabel, cycle, segment, s.product_count ?? 0, s.phone_whatsapp ?? '', s.city ?? '', countryLabel, date, expiry, shopUrl]
    })

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const planPart    = filterPlan    !== 'all' ? filterPlan    : 'tous'
    const countryPart = filterCountry !== 'all' ? filterCountry.toLowerCase() : ''
    const datePart    = new Date().toISOString().slice(0, 10)
    const fileName    = ['boutiques', planPart, countryPart, datePart].filter(Boolean).join('-') + '.csv'

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
        {/* ── En-tête ── */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Boutiques</h1>
              <p className="text-gray-500 mt-0.5 text-sm">Gère les boutiques et leurs abonnements</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const recipientsCount = sorted.filter(s => s.phone_whatsapp).length
                  const defaultMsg = `Bonjour ! Votre boutique TEKKIShop est suspendue. Réactivez votre abonnement pour continuer à recevoir des commandes : https://app.tekki.shop/dashboard`
                  setCampaignMessage(defaultMsg)
                  setCampaignResult(null)
                  setCampaignOpen(true)
                }}
                disabled={loading || sorted.length === 0}
                title="Envoyer une campagne SMS aux boutiques filtrées"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                Campagne SMS
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {sorted.filter(s => s.phone_whatsapp).length}
                </span>
              </button>
              <button
                onClick={exportCSV}
                disabled={loading || sorted.length === 0}
                title={`Exporter ${sorted.length} boutique${sorted.length !== 1 ? 's' : ''} en CSV`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {sorted.length}
                </span>
              </button>
              <TrendingUp className="h-12 w-12 text-sky-400 opacity-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total',    value: stats.total,  color: 'from-gray-500 to-gray-600',         fmt: null },
              { label: 'Actives',  value: stats.active, color: 'from-emerald-500 to-emerald-600',   fmt: null },
              { label: 'Payantes', value: stats.paid,   color: 'from-blue-500 to-blue-600',         fmt: null },
              { label: 'Essai',    value: stats.trial,  color: 'from-amber-500 to-amber-600',       fmt: null },
              { label: 'CA en ligne (Bictorys)', value: stats.totalRevenue, color: 'from-violet-500 to-violet-700', fmt: 'fcfa' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white shadow-sm col-span-${stat.fmt ? '2 md:col-span-1' : '1'}`}>
                <p className="text-sm opacity-80 font-medium">{stat.label}</p>
                <p className={`font-bold mt-1 ${stat.fmt ? 'text-xl' : 'text-3xl'}`}>
                  {stat.fmt === 'fcfa'
                    ? (stat.value as number).toLocaleString('fr-FR') + ' F'
                    : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recherche & filtres ── */}
        <div className="mb-5 space-y-3">

          {/* Champ de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Nom, ville ou numéro de téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtre plan */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-8 shrink-0">Plan</span>
            {(['all', 'trial', 'decouverte', 'business', 'pro'] as const).map((plan) => {
              const isActive = filterPlan === plan
              const cfg = plan !== 'all' ? PLAN_CONFIG[plan] : null
              return (
                <button
                  key={plan}
                  onClick={() => setFilterPlan(plan)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-200'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600'
                  }`}
                >
                  {cfg?.icon && <span className="text-xs leading-none">{cfg.icon}</span>}
                  {plan === 'all' ? 'Tous les plans' : cfg?.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {planCounts[plan] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Filtre pays */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-8 shrink-0">Pays</span>
            {(['all', ...KNOWN_CODES, 'other'] as const).map((country) => {
              const isActive = filterCountry === country
              const flag = country !== 'all' && country !== 'other' ? (COUNTRY_FLAGS[country] ?? '') : ''
              const label = country === 'all' ? 'Tous les pays'
                : country === 'other' ? 'Autres'
                : COUNTRIES.find(c => c.code === country)?.label ?? country
              return (
                <button
                  key={country}
                  onClick={() => setFilterCountry(country as CountryFilter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  {flag && <span className="text-base leading-none">{flag}</span>}
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {countryCounts[country] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Filtre segment — prospects en essai */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-8 shrink-0">Seg.</span>
            {(['all', 'ready', 'started', 'ghost'] as SegmentFilter[]).map((seg) => {
              const isActive = filterSegment === seg
              const cfg = SEGMENT_CONFIG[seg]
              return (
                <button
                  key={seg}
                  onClick={() => {
                    setFilterSegment(seg)
                    // Quand on sélectionne un segment, on force le filtre essai
                    if (seg !== 'all') setFilterPlan('trial')
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-500 text-white shadow-md ring-2 ring-violet-200'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
                  }`}
                >
                  {cfg.icon && <span className="text-xs leading-none">{cfg.icon}</span>}
                  {cfg.label}
                  {seg !== 'all' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {segmentCounts[seg]}
                    </span>
                  )}
                  {seg === 'all' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {segmentCounts.all}
                    </span>
                  )}
                </button>
              )
            })}
            <span className="text-xs text-gray-400 ml-1">boutiques en essai uniquement</span>
          </div>

          {/* Filtre statut actif/inactif */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-8 shrink-0">Statut</span>
            {([
              { value: 'all',      label: 'Tous',      color: 'bg-sky-500 text-white shadow-md ring-2 ring-sky-200',         inactive: 'bg-white border border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600' },
              { value: 'active',   label: '🟢 Actifs',  color: 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200', inactive: 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600' },
              { value: 'inactive', label: '🔴 Inactifs', color: 'bg-red-500 text-white shadow-md ring-2 ring-red-200',        inactive: 'bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600' },
            ] as const).map(opt => {
              const isActive = filterStatus === opt.value
              const count = opt.value === 'all' ? shops.length
                : opt.value === 'active' ? shops.filter(s => s.is_active).length
                : shops.filter(s => !s.is_active).length
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? opt.color : opt.inactive}`}
                >
                  {opt.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Barre de résultats + actions */}
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-gray-500">
              <span className="font-semibold text-gray-800">{sorted.length}</span>
              {' '}résultat{sorted.length !== 1 ? 's' : ''}
              {sorted.length < shops.length && (
                <span className="text-gray-400"> sur {shops.length}</span>
              )}
            </span>
            <div className="flex items-center gap-3">
              {sorted.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exporter ({sorted.length})
                </button>
              )}
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-medium transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tableau ── */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mb-3" />
            <p className="text-sm text-gray-400">Chargement des boutiques...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-800 mb-1">Aucune boutique trouvée</p>
            <p className="text-sm text-gray-400 mb-5">
              {searchQuery
                ? `Aucun résultat pour « ${searchQuery} »`
                : 'Essaie d\'autres filtres.'}
            </p>
            <button
              onClick={resetFilters}
              className="text-sm text-sky-600 hover:underline font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {([
                      { field: 'name' as SortField,                 label: 'Boutique',     cls: 'px-6 py-4' },
                      { field: 'plan' as SortField,                 label: 'Plan',         cls: 'px-6 py-4' },
                      { field: null,                                  label: 'Téléphone',    cls: 'px-6 py-4 hidden md:table-cell' },
                      { field: null,                                  label: 'Statut',       cls: 'px-6 py-4' },
                      { field: null,                                  label: 'Produits',     cls: 'px-6 py-4 hidden md:table-cell' },
                      { field: null,                                  label: 'CA en ligne',  cls: 'px-6 py-4 hidden lg:table-cell' },
                      { field: 'created_at' as SortField,           label: 'Inscription',  cls: 'px-6 py-4 hidden xl:table-cell' },
                      { field: 'subscription_ends_at' as SortField, label: 'Abonnement',   cls: 'px-6 py-4 hidden xl:table-cell' },
                    ].map(col => (
                      <th
                        key={col.label}
                        className={`text-left font-semibold text-gray-600 ${col.cls} ${col.field ? 'cursor-pointer select-none hover:text-sky-600 transition-colors' : ''}`}
                        onClick={col.field ? () => handleSort(col.field!) : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {col.field && sortField === col.field && (
                            sortDir === 'asc'
                              ? <ChevronUp className="h-3.5 w-3.5 text-sky-500" />
                              : <ChevronDown className="h-3.5 w-3.5 text-sky-500" />
                          )}
                          {col.field && sortField !== col.field && (
                            <ChevronUp className="h-3.5 w-3.5 text-gray-300" />
                          )}
                        </span>
                      </th>
                    )))}
                    <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((shop) => {
                    const code = (shop.country ?? '').toUpperCase()
                    const flag = COUNTRY_FLAGS[code]
                    const countryLabel = COUNTRIES.find(c => c.code === code)?.label
                    const planCfg = PLAN_CONFIG[shop.plan as keyof typeof PLAN_CONFIG]

                    return (
                      <tr key={shop.id} className="hover:bg-sky-50/40 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 group-hover:text-sky-700 transition-colors">
                            {shop.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            {flag && <span>{flag}</span>}
                            {[shop.city, countryLabel].filter(Boolean).join(', ') || '—'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            planCfg?.badge ?? 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className="leading-none">{planCfg?.icon ?? '?'}</span>
                            {planCfg?.label ?? shop.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {shop.phone_whatsapp ? (
                            <a
                              href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-sky-600 hover:underline"
                            >
                              {shop.phone_whatsapp}
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            shop.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              shop.is_active ? 'bg-emerald-500' : 'bg-red-400'
                            }`} />
                            {shop.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {shop.plan === 'trial' ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                              getSegment(shop) === 'ready'   ? 'bg-emerald-50 text-emerald-700' :
                              getSegment(shop) === 'started' ? 'bg-sky-50 text-sky-700'          :
                                                               'bg-gray-100 text-gray-400'
                            }`}>
                              {SEGMENT_CONFIG[getSegment(shop)].icon} {shop.product_count ?? 0}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">{shop.product_count ?? 0}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {(shop.online_revenue ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                              <CreditCard className="h-3 w-3" />
                              {(shop.online_revenue as number).toLocaleString('fr-FR')} F
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 hidden xl:table-cell">
                          {format(new Date(shop.created_at), 'd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell">
                          {shop.plan === 'trial' ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : shop.subscription_ends_at ? (
                            <div className="space-y-0.5">
                              {shop.is_annual && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                  ANNUEL
                                </span>
                              )}
                              <p className={`text-xs font-medium ${
                                new Date(shop.subscription_ends_at) < new Date()
                                  ? 'text-red-600'
                                  : new Date(shop.subscription_ends_at) < new Date(Date.now() + 7 * 86400000)
                                    ? 'text-amber-600'
                                    : 'text-gray-600'
                              }`}>
                                Exp. {format(new Date(shop.subscription_ends_at), 'd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                          ) : (
                            <Link
                              href={`/admin/shops/${shop.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                              title="Aucune date d'expiration — cliquer pour corriger"
                            >
                              ⚠ Définir exp.
                            </Link>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/shops/${shop.id}`}
                              title="Gérer"
                              className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            >
                              <Settings className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/${shop.slug}`}
                              target="_blank"
                              title="Voir la boutique"
                              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            {shop.phone_whatsapp && (
                              <a
                                href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
              <span>
                {sorted.length} boutique{sorted.length !== 1 ? 's' : ''}
                {sorted.length < shops.length && ` sur ${shops.length}`}
              </span>
              {hasFilters && (
                <button onClick={resetFilters} className="text-sky-500 hover:text-sky-700 font-medium transition-colors">
                  Voir toutes les boutiques
                </button>
              )}
            </div>
          </div>
        )}

      {/* ── Modal campagne SMS ── */}
      {campaignOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold text-gray-900">Campagne SMS Lafricamobile</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sorted.filter(s => s.phone_whatsapp).length} destinataire{sorted.filter(s => s.phone_whatsapp).length !== 1 ? 's' : ''} sur {sorted.length} boutique{sorted.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => { setCampaignOpen(false); setCampaignResult(null) }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {campaignResult ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{campaignResult.sent}</p>
                  <p className="text-sm text-emerald-600">SMS envoyés avec succès</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
                    <p className="text-lg font-bold text-red-600">{campaignResult.failed}</p>
                    <p className="text-xs text-red-500">Échecs</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                    <p className="text-lg font-bold text-gray-600">{campaignResult.skipped}</p>
                    <p className="text-xs text-gray-500">Sans numéro</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCampaignOpen(false); setCampaignResult(null) }}
                  className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message SMS</label>
                  <textarea
                    value={campaignMessage}
                    onChange={e => setCampaignMessage(e.target.value)}
                    rows={5}
                    maxLength={480}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 resize-none transition-all"
                    placeholder="Votre message SMS..."
                  />
                  <p className="text-right text-[10px] text-gray-400 mt-1">{campaignMessage.length}/480 caractères</p>
                </div>

                {sorted.filter(s => !s.phone_whatsapp).length > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    ⚠ {sorted.filter(s => !s.phone_whatsapp).length} boutique{sorted.filter(s => !s.phone_whatsapp).length !== 1 ? 's' : ''} sans numéro seront ignorées.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setCampaignOpen(false); setCampaignResult(null) }}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => void handleSendCampaign()}
                    disabled={campaignSending || !campaignMessage.trim() || sorted.filter(s => s.phone_whatsapp).length === 0}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {campaignSending
                      ? 'Envoi en cours...'
                      : `Envoyer à ${sorted.filter(s => s.phone_whatsapp).length} boutique${sorted.filter(s => s.phone_whatsapp).length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
