'use client'

import { useState } from 'react'
import { Copy, Check, Gift, Users, Wallet, TrendingUp, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const PLAN_LABELS: Record<string, string> = {
  discovery: 'Découverte',
  business:   'Business',
  pro:        'Pro',
}

interface Commission {
  id: string
  plan: string
  commission_amount: number
  status: string
  created_at: string
}

interface Props {
  refCode: string
  referralLink: string
  totalEarned: number
  availableBalance: number
  referredCount: number
  commissions: Commission[]
  commissionRates: Record<string, number>
}

export function AffiliationClient({
  refCode,
  referralLink,
  totalEarned,
  availableBalance,
  referredCount,
  commissions,
  commissionRates,
}: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Crée ta boutique en ligne avec TekkiShop',
          text: `Crée ta boutique en ligne gratuitement avec TekkiShop — vends tes produits, reçois des commandes sur WhatsApp. Utilise mon lien :`,
          url: referralLink,
        })
        return
      } catch { /* annulé */ }
    }
    handleCopy()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Programme d'affiliation</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Partagez votre lien et gagnez une commission pour chaque boutique qui s'abonne.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <p className="text-xs text-gray-500 mb-1">Disponible</p>
          <p className="text-xl font-bold" style={{ color: availableBalance > 0 ? '#0EA5E9' : '#9ca3af' }}>
            {availableBalance.toLocaleString('fr-FR')}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">FCFA</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-gray-500 mb-1">Total gagné</p>
          <p className="text-xl font-bold text-gray-900">{totalEarned.toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">FCFA</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-gray-500 mb-1">Boutiques</p>
          <p className="text-xl font-bold text-gray-900">{referredCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">parrainées</p>
        </Card>
      </div>

      {/* Lien */}
      <Card className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Votre lien de parrainage
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="flex-1 text-xs font-mono text-gray-700 truncate">{referralLink}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0EA5E9' }}
        >
          <Gift className="h-4 w-4" />
          Partager mon lien
          <ArrowRight className="h-4 w-4" />
        </button>
      </Card>

      {/* Barème commissions */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Ce que vous gagnez</p>
        </div>
        <div className="divide-y divide-gray-50">
          {Object.entries(commissionRates).map(([plan, amount]) => (
            <div key={plan} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-700">Plan {PLAN_LABELS[plan] ?? plan}</span>
              <span className="text-sm font-bold text-gray-900">{amount.toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
          <p className="text-xs text-gray-500">Commission unique versée quand la boutique parrainée active un plan payant.</p>
          <p className="text-xs text-gray-500">Virement disponible à partir de 2 000 FCFA de solde.</p>
        </div>
      </Card>

      {/* Historique */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Historique des gains</p>
        <Card>
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <Users className="h-10 w-10 text-gray-200" />
              <div>
                <p className="text-sm font-medium text-gray-500">Aucune boutique parrainée pour l'instant.</p>
                <p className="text-xs text-gray-400 mt-1">Partagez votre lien pour commencer à gagner.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {commissions.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Plan {PLAN_LABELS[c.plan] ?? c.plan}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(c.created_at), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      +{c.commission_amount.toLocaleString('fr-FR')} FCFA
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      c.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status === 'paid' ? 'Versé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Comment ça marche */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Comment ça marche</p>
        </div>
        {[
          { n: 1, text: 'Partagez votre lien unique à vos contacts commerçants.' },
          { n: 2, text: "Ils s'inscrivent sur TekkiShop via votre lien." },
          { n: 3, text: 'Quand ils activent un plan payant, vous gagnez une commission.' },
          { n: 4, text: 'Demandez votre virement dès que votre solde atteint 2 000 FCFA.' },
        ].map(step => (
          <div key={step.n} className="flex items-start gap-3">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: '#0EA5E9' }}
            >
              {step.n}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{step.text}</p>
          </div>
        ))}
      </Card>
    </div>
  )
}
