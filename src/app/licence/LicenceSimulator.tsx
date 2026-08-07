'use client'
import { useState } from 'react'

const LICENCE_COST = 1_200_000

const PLANS = [
  { label: 'Découverte', price: 2_900 },
  { label: 'Business', price: 4_900 },
  { label: 'Pro', price: 9_900 },
]

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

export function LicenceSimulator() {
  const [shops, setShops] = useState(60)
  const [planIdx, setPlanIdx] = useState(1)

  const price = PLANS[planIdx].price
  const monthly = shops * price
  const perMonth = shops / 12

  let cumul = 0
  let breakMonth: number | null = null
  for (let m = 1; m <= 12; m++) {
    cumul += Math.round(perMonth * m) * price
    if (breakMonth === null && cumul >= LICENCE_COST) breakMonth = m
  }
  const net = cumul - LICENCE_COST

  return (
    <div className="lic-sim">
      <div className="lic-sim-controls">
        <label className="lic-sim-lbl" htmlFor="lic-shops-range">
          Boutiques payantes au bout de 12 mois
        </label>
        <div className="lic-sim-val">
          {shops} <span>boutiques</span>
        </div>
        <input
          type="range"
          id="lic-shops-range"
          className="lic-range"
          min={10}
          max={400}
          step={5}
          value={shops}
          onChange={e => setShops(Number(e.target.value))}
        />
        <div className="lic-sim-scale">
          <span>10</span><span>200</span><span>400</span>
        </div>

        <label className="lic-sim-lbl">Abonnement moyen de vos marchands</label>
        <div className="lic-plan-pick" role="group">
          {PLANS.map((p, i) => (
            <button
              key={p.price}
              type="button"
              className={i === planIdx ? 'on' : ''}
              onClick={() => setPlanIdx(i)}
            >
              {p.label}
              <small>{p.price.toLocaleString('fr-FR')} F</small>
            </button>
          ))}
        </div>
        <p className="lic-sim-hint">
          La simulation suppose une croissance régulière de zéro jusqu&apos;au nombre de boutiques indiqué,
          réparti sur les douze premiers mois.
        </p>
      </div>

      <div className="lic-sim-out">
        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Revenu mensuel au 12<sup>e</sup> mois</span>
            <small>Ce que vous encaissez chaque mois une fois l&apos;objectif atteint</small>
          </div>
          <b>{fmt(monthly)}&nbsp;F</b>
        </div>
        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Encaissé sur les 12 premiers mois</span>
            <small>Cumul de la première année, montée en charge comprise</small>
          </div>
          <b>{fmt(cumul)}&nbsp;F</b>
        </div>
        <div className="lic-sim-row lic-sim-hi">
          <div>
            <span className="lic-sim-rlabel">Licence remboursée au</span>
            <small>Mois où le cumul dépasse les 1 200 000 F investis</small>
          </div>
          <b>{breakMonth ? `Mois ${breakMonth}` : 'Au-delà de 12 mois'}</b>
        </div>
        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Résultat de l&apos;année 1</span>
            <small>Encaissé moins le coût de la licence, hors charges d&apos;exploitation</small>
          </div>
          <b style={{ color: net >= 0 ? '#4bdca8' : '#e0616a' }}>
            {net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}&nbsp;F
          </b>
        </div>
        <p className="lic-sim-legal">
          Cette simulation est une projection arithmétique, pas une promesse. Dukka ne garantit aucun
          niveau de chiffre d&apos;affaires ni de rentabilité&nbsp;: vos résultats dépendront de vos
          efforts commerciaux. Les montants indiqués sont bruts et n&apos;intègrent pas vos charges
          d&apos;exploitation (publicité, frais de paiement, communication, temps passé).
          {' '}Le calcul retient un coût de licence de 1&nbsp;200&nbsp;000 FCFA, montant plancher&nbsp;: le vôtre peut être supérieur selon votre marché.
        </p>
      </div>
    </div>
  )
}
