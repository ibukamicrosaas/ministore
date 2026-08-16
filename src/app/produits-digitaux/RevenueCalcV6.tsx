'use client'
import { useState } from 'react'
import { MIN_COMMISSION_RATE, MAX_COMMISSION_RATE } from '@/lib/billing/commission'

const fmt = (n: number) => Math.max(0, n).toLocaleString('fr-FR')

// Simulation générique, sans pays connu — utilise le taux le plus bas
// (Sénégal/Côte d'Ivoire) comme référence, avec une note explicite que le
// taux réel dépend du pays de la boutique. Jamais un taux tapé en dur ici.
const REFERENCE_RATE = MIN_COMMISSION_RATE
const MAX_RATE = MAX_COMMISSION_RATE

export function RevenueCalcV6() {
  const [price, setPrice] = useState(4500)
  const [sales, setSales] = useState(20)

  const revenue = price * sales
  const commission = Math.round(revenue * (REFERENCE_RATE / 100))
  const plan = 2900
  const net = revenue - commission - plan

  return (
    <div className="rv">
      <div className="rv-field">
        <label className="rv-label">
          Prix de ton produit
          <b className="rv-val">{fmt(price)} FCFA</b>
        </label>
        <input
          type="range" min={1000} max={50000} step={500} value={price}
          onChange={e => setPrice(Number(e.target.value))}
          className="rv-range"
          aria-label="Prix du produit"
        />
        <div className="rv-hints"><span>1 000</span><span>50 000</span></div>
      </div>

      <div className="rv-field">
        <label className="rv-label">
          Ventes par mois
          <b className="rv-val">{sales} ventes</b>
        </label>
        <input
          type="range" min={1} max={200} step={1} value={sales}
          onChange={e => setSales(Number(e.target.value))}
          className="rv-range"
          aria-label="Nombre de ventes par mois"
        />
        <div className="rv-hints"><span>1</span><span>200</span></div>
      </div>

      <div className="rv-result">
        <div className="rv-row">
          <span>Chiffre d&apos;affaires</span>
          <b>{fmt(revenue)} FCFA</b>
        </div>
        <div className="rv-row">
          <span>Commission TEKKIShop — {REFERENCE_RATE}&nbsp;%</span>
          <b>− {fmt(commission)} FCFA</b>
        </div>
        <div className="rv-row">
          <span>Abonnement Découverte</span>
          <b>− {fmt(plan)} FCFA</b>
        </div>
        <div className="rv-row rv-total">
          <span>Tu conserves</span>
          <b>{fmt(net)} FCFA</b>
        </div>
      </div>
      <p className="rv-note">
        Simulation indicative, à partir du taux le plus bas ({REFERENCE_RATE}&nbsp;%) — la commission réelle dépend de ton pays (jusqu&rsquo;à {MAX_RATE}&nbsp;%). Retrait instantané sur mobile money.
      </p>
    </div>
  )
}
