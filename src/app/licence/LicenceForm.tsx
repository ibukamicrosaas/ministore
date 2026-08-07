'use client'
import { useState } from 'react'

const COUNTRIES = [
  'Bénin — marchands déjà actifs',
  'Mali — marchands déjà actifs',
  'Burkina Faso — marchands déjà actifs',
  'Niger',
  'Guinée',
  'Cameroun',
  'Gabon',
  'Autre pays (à préciser ci-dessous)',
]

export function LicenceForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="lic-form-card lic-form-success">
        <svg
          viewBox="0 0 24 24" fill="none" stroke="#12b981" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ width: 48, height: 48, margin: '0 auto 18px', display: 'block' }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12.5l2.6 2.6L16 9.7" />
        </svg>
        <h3 style={{ margin: '0 0 10px', fontSize: 22, letterSpacing: '-.025em' }}>
          Candidature envoyée
        </h3>
        <p style={{ margin: 0, color: '#697893', fontSize: 15, lineHeight: 1.65 }}>
          Merci. Nous avons bien reçu votre candidature — vous recevrez une réponse motivée
          sous cinq jours ouvrés, que nous poursuivions ou non.
        </p>
      </div>
    )
  }

  return (
    <form className="lic-form-card" onSubmit={handleSubmit} noValidate>
      <div className="lic-field">
        <label htmlFor="f-country">Pays que vous souhaitez ouvrir</label>
        <select id="f-country" required>
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="lic-frow">
        <div className="lic-field">
          <label htmlFor="f-name">Nom complet</label>
          <input id="f-name" type="text" placeholder="Prénom et nom" required />
        </div>
        <div className="lic-field">
          <label htmlFor="f-phone">Numéro WhatsApp</label>
          <input id="f-phone" type="tel" placeholder="+229 ..." required />
        </div>
      </div>
      <div className="lic-field">
        <label htmlFor="f-email">Adresse e-mail</label>
        <input id="f-email" type="email" placeholder="vous@exemple.com" required />
      </div>
      <div className="lic-field">
        <label htmlFor="f-exp">Votre parcours en quelques lignes</label>
        <textarea
          id="f-exp"
          placeholder="Votre activité actuelle, vos expériences en vente, en tech ou en entrepreneuriat."
          required
        />
      </div>
      <div className="lic-field">
        <label htmlFor="f-plan">Comment comptez-vous trouver vos 100 premiers marchands&nbsp;?</label>
        <textarea
          id="f-plan"
          placeholder="Réseau, terrain, réseaux sociaux, partenariats, associations de commerçants…"
          required
        />
        <small>C&apos;est la partie que nous lisons le plus attentivement.</small>
      </div>
      <button className="lic-btn lic-btn-primary lic-btn-full" type="submit">
        Envoyer ma candidature
      </button>
      <p className="lic-form-legal">
        En envoyant ce formulaire, vous acceptez que Dukka utilise ces informations pour étudier
        votre candidature. Aucune donnée ne sera transmise à un tiers.
      </p>
    </form>
  )
}
