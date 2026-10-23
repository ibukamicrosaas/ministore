'use client'
import { useMemo, useState } from 'react'
import { formatNumberFr } from './prices'
import {
  simulate, sumRevenue, paybackMonth, checkObjectives, minRecruitsForObjectives,
  type Objective,
} from './simulator-model'

// Simulateur de revenus de la Licence fondatrice (24 mois).
// Toutes les valeurs arrivent par props depuis page.tsx (composant serveur) :
// prix des abonnements (catalogue produit), prix de la licence, objectifs,
// parts, et scénarios de départs. Aucune valeur de départs n'est définie ici.

export interface SimScenario {
  key: string
  label: string
  /** Départs mensuels, entre 0 et 1 */
  monthlyRate: number
}

export interface SimPlan {
  key: string
  label: string
  /** Prix mensuel en FCFA, lu depuis le catalogue produit */
  price: number
}

interface Props {
  /** Bandeau affiché seulement avec les valeurs de TEST (texte fourni par le serveur : il n'est jamais dans le code envoyé en production) */
  testNotice?: string
  scenarios: SimScenario[]
  plans: SimPlan[]
  licencePrice: number
  objectives: readonly Objective[]
  /** Part reversée sur les marchands existants réactivés (0,5 = 50 %) */
  existingRate: number
  shares: { year1: number; year2: number }
  durationMonths: number
}

const MAX_RECRUITS = 40
const MAX_REACTIVATED = 100
const DEFAULT_RECRUITS = 5

const pct = (x: number) => `${formatNumberFr(Math.round(x * 1000) / 10)} %`
const money = (n: number) => `${formatNumberFr(Math.round(n))} F`
const signedMoney = (n: number) => `${n >= 0 ? '+' : '-'}${formatNumberFr(Math.round(Math.abs(n)))} F`
// Marchands actifs affichés arrondis à l'entier inférieur : on n'annonce jamais « 30 » quand le calcul donne 29,6.
const whole = (n: number) => Math.floor(n + 1e-9)

export function LicenceSimulator({ testNotice, scenarios, plans, licencePrice, objectives, existingRate, shares, durationMonths }: Props) {
  const [recruits, setRecruits] = useState(DEFAULT_RECRUITS)
  const [planKey, setPlanKey] = useState(plans[0].key)
  const [scenarioKey, setScenarioKey] = useState((scenarios.find(s => s.key === 'median') ?? scenarios[0]).key)
  const [reactivated, setReactivated] = useState(0)

  const plan = plans.find(p => p.key === planKey) ?? plans[0]
  const scenario = scenarios.find(s => s.key === scenarioKey) ?? scenarios[0]

  const result = useMemo(() => {
    const sim = simulate({
      recruitsPerMonth: recruits, churn: scenario.monthlyRate, price: plan.price,
      reactivated, existingRate, shares, months: durationMonths,
    })
    const checks = checkObjectives(sim, objectives)
    return {
      sim,
      checks,
      revenue12: sim.revenue[11],
      year1: sumRevenue(sim, 1, 12),
      year2: sumRevenue(sim, 13, durationMonths),
      total: sim.cumulative[durationMonths - 1],
      payback: paybackMonth(sim, licencePrice),
      needed: minRecruitsForObjectives(scenario.monthlyRate, objectives, MAX_RECRUITS),
    }
  }, [recruits, scenario, plan, reactivated, existingRate, shares, durationMonths, objectives, licencePrice])

  const net = result.total - licencePrice
  const maxRevenue = Math.max(...result.sim.revenue, 1)

  return (
    <div className="lic-sim">
      <div className="lic-sim-controls">
        {testNotice && <p className="lic-testflag" role="note">{testNotice}</p>}

        <label className="lic-sim-lbl" htmlFor="lic-recruits-range">Nouveaux marchands recrutés par mois</label>
        <div className="lic-sim-val">{recruits} <span>par mois</span></div>
        <input
          type="range" id="lic-recruits-range" className="lic-range"
          min={1} max={MAX_RECRUITS} step={1} value={recruits}
          onChange={e => setRecruits(Number(e.target.value))}
        />
        <div className="lic-sim-scale"><span>1</span><span>20</span><span>{MAX_RECRUITS}</span></div>

        <span className="lic-sim-lbl" id="lic-plan-lbl">Abonnement moyen de vos marchands</span>
        <div className="lic-plan-pick" role="group" aria-labelledby="lic-plan-lbl">
          {plans.map(p => (
            <button key={p.key} type="button" className={p.key === planKey ? 'on' : ''} aria-pressed={p.key === planKey} onClick={() => setPlanKey(p.key)}>
              {p.label}
              <small>{money(p.price)} par mois</small>
            </button>
          ))}
        </div>

        <span className="lic-sim-lbl" id="lic-churn-lbl" style={{ marginTop: 22 }}>Scénario de départs mensuels</span>
        <div className="lic-plan-pick lic-plan-pick-3" role="group" aria-labelledby="lic-churn-lbl">
          {scenarios.map(s => (
            <button key={s.key} type="button" className={s.key === scenarioKey ? 'on' : ''} aria-pressed={s.key === scenarioKey} onClick={() => setScenarioKey(s.key)}>
              {s.label}
              <small>{pct(s.monthlyRate)} par mois</small>
            </button>
          ))}
        </div>
        <p className="lic-sim-hint">Hypothèse. Le taux réel dépendra de votre suivi des marchands.</p>

        <label className="lic-sim-lbl" htmlFor="lic-react-range" style={{ marginTop: 26 }}>Marchands déjà inscrits que vous réactivez</label>
        <div className="lic-sim-val lic-sim-val-sm">{reactivated} <span>marchands</span></div>
        <input
          type="range" id="lic-react-range" className="lic-range"
          min={0} max={MAX_REACTIVATED} step={1} value={reactivated}
          onChange={e => setReactivated(Number(e.target.value))}
        />
        <div className="lic-sim-scale"><span>0</span><span>50</span><span>{MAX_REACTIVATED}</span></div>
        <p className="lic-sim-hint">
          Vous touchez {pct(existingRate * shares.year1)} de leur abonnement la première année, {pct(existingRate * shares.year2)} la deuxième, selon les modalités du contrat. Ils ne comptent pas dans les objectifs.
        </p>
      </div>

      <div className="lic-sim-out">
        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Revenu mensuel au 12<sup>e</sup> mois</span>
            <small>Ce que vous encaissez ce mois-là, avant frais</small>
          </div>
          <b>{money(result.revenue12)}</b>
        </div>
        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Encaissé sur l&apos;année 1</span>
            <small>Cumul des 12 premiers mois, montée en charge comprise</small>
          </div>
          <b>{money(result.year1)}</b>
        </div>
        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Encaissé sur l&apos;année 2</span>
            <small>Cumul des mois 13 à {durationMonths}, avec {pct(shares.year2)} des abonnements</small>
          </div>
          <b>{money(result.year2)}</b>
        </div>
        <div className="lic-sim-row lic-sim-hi">
          <div>
            <span className="lic-sim-rlabel">Licence rentabilisée au</span>
            <small>Mois où le cumul atteint les {money(licencePrice)} de la licence</small>
          </div>
          <b>{result.payback ? `Mois ${result.payback}` : `Au-delà de ${durationMonths} mois`}</b>
        </div>
        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Résultat sur {durationMonths} mois</span>
            <small>Encaissé moins le prix de la licence, hors charges d&apos;exploitation</small>
          </div>
          <b style={{ color: net >= 0 ? '#4bdca8' : '#e0616a' }}>{signedMoney(net)}</b>
        </div>

        <div className="lic-sim-block">
          <span className="lic-sim-rlabel">Objectifs atteints&nbsp;?</span>
          <div className="lic-goals">
            {result.checks.map(c => (
              <div key={c.months} className={`lic-goal ${c.reached ? 'ok' : 'ko'}`}>
                <small>{c.months} mois</small>
                <b>{whole(c.value)}&nbsp;/&nbsp;{c.count}</b>
                <small className="lic-goal-state">{c.reached ? '✓ Atteint' : '✕ Non atteint'}</small>
              </div>
            ))}
          </div>
          <p className="lic-sim-hint">
            Un objectif compte les boutiques recrutées avec votre code, actives et payantes, à {objectives.map(o => o.months).slice(0, -1).join(', ')} et {objectives[objectives.length - 1].months}&nbsp;mois.
          </p>
        </div>

        <div className="lic-sim-row">
          <div>
            <span className="lic-sim-rlabel">Recrutement nécessaire</span>
            <small>
              {result.needed !== null
                ? `Pour atteindre les trois objectifs avec ce scénario de départs, il faut recruter au moins ${result.needed} marchands par mois.`
                : `Pour atteindre les trois objectifs avec ce scénario de départs, il faut recruter plus de ${MAX_RECRUITS} marchands par mois.`}
            </small>
          </div>
          <b>{result.needed !== null ? `${result.needed} / mois` : `> ${MAX_RECRUITS} / mois`}</b>
        </div>

        <figure className="lic-sim-chart">
          <svg
            viewBox="0 0 480 128" role="img"
            aria-label={`Revenu mensuel sur ${durationMonths} mois. Il baisse au mois 13, quand votre part passe de ${pct(shares.year1)} à ${pct(shares.year2)}.`}
          >
            {result.sim.revenue.map((rev, i) => {
              const m = i + 1
              const h = Math.max(1, (rev / maxRevenue) * 80)
              return <rect key={m} x={i * 20 + 3} y={104 - h} width={14} height={h} rx={2} fill={m <= 12 ? '#4b8dff' : '#ffb020'} />
            })}
            <line x1={12 * 20} y1={4} x2={12 * 20} y2={108} stroke="#8fa9d0" strokeWidth={1} strokeDasharray="3 3" />
            <text x={12 * 20 + 6} y={15} fontSize={13} fill="#9fb3d4">Mois 13 : part de {pct(shares.year2)}</text>
            <text x={2} y={124} fontSize={13} fill="#9fb3d4">Mois 1</text>
            <text x={12 * 20} y={124} fontSize={13} fill="#9fb3d4" textAnchor="middle">Mois 12</text>
            <text x={durationMonths * 20 - 2} y={124} fontSize={13} fill="#9fb3d4" textAnchor="end">Mois {durationMonths}</text>
          </svg>
          <figcaption>Revenu mensuel simulé, mois par mois (avant frais d&apos;encaissement et de retrait)</figcaption>
        </figure>

        <p className="lic-sim-legal">
          Cette simulation est une projection arithmétique, pas une promesse. TEKKIShop ne garantit aucun chiffre d&apos;affaires. Les montants sont bruts&nbsp;: ils n&apos;incluent ni les frais d&apos;encaissement et de retrait, ni vos charges (publicité, SMS, WhatsApp, déplacements, temps passé).
        </p>
        <p className="lic-sim-legal" style={{ marginTop: 10 }}>
          Abonnements semestriels et annuels&nbsp;: TEKKIShop encaisse le montant et vous le reverse chaque mois, au prorata. La simulation raisonne donc en revenu mensuel, quel que soit le mode d&apos;abonnement choisi par vos marchands.
        </p>
      </div>
    </div>
  )
}
