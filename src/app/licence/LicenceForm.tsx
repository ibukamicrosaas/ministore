'use client'
import { useState } from 'react'
import { submitLicenceApplication } from '@/lib/actions/licence'
import { WAITLIST_SUFFIX, isWaitlistCountry } from './prices'

interface TerritoryOption {
  name: string
  group: 'open' | 'waitlist'
}

interface Props {
  territories: TerritoryOption[]
}

// Valeur enregistrée dans licence_applications.country. Convention existante
// (« <pays> (<précision>) ») : les pays ouverts gardent leur nom seul, les
// pays en liste d'attente portent WAITLIST_SUFFIX (prices.ts, partagé avec
// l'admin), ce qui les rend identifiables sans migration.
const OTHER_COUNTRY = 'Autre pays (à préciser ci-dessous)'

function optionValue(t: TerritoryOption): string {
  return t.group === 'waitlist' ? `${t.name}${WAITLIST_SUFFIX}` : t.name
}

export function LicenceForm({ territories }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [waitlisted, setWaitlisted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const fd = new FormData(e.currentTarget)
    const countryValue = (fd.get('country') as string) ?? ''
    const result = await submitLicenceApplication({
      country:         countryValue,
      fullName:        (fd.get('name') as string)?.trim() ?? '',
      whatsappPhone:   (fd.get('phone') as string)?.trim() ?? '',
      email:           (fd.get('email') as string)?.trim() ?? '',
      experience:      (fd.get('experience') as string)?.trim() ?? '',
      acquisitionPlan: (fd.get('plan') as string)?.trim() ?? '',
      financing:       (fd.get('financing') as string)?.trim() ?? '',
    })

    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setWaitlisted(isWaitlistCountry(countryValue))
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
          {waitlisted
            ? "Votre candidature est enregistrée. Ce pays n'est pas encore ouvert : nous vous prévenons dès l'intégration du paiement mobile."
            : 'Merci. Nous avons bien reçu votre candidature. Vous recevrez une réponse motivée sous cinq jours ouvrés, que nous poursuivions ou non.'}
        </p>
      </div>
    )
  }

  return (
    <form className="lic-form-card" onSubmit={handleSubmit} noValidate>
      <p style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 600, color: '#0b1830', lineHeight: 1.5 }}>
        Première vague&nbsp;: un seul licencié par pays. La première signature suivie du paiement complet l&apos;emporte.
      </p>
      {error && (
        <p style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, background: '#fdecec', color: '#c0392b', fontSize: 13.5 }}>
          {error}
        </p>
      )}
      <div className="lic-field">
        <label htmlFor="f-country">Pays que vous souhaitez ouvrir</label>
        <select id="f-country" name="country" required>
          <optgroup label="Ouvert">
            {territories.filter(t => t.group === 'open').map(t => <option key={t.name} value={optionValue(t)}>{t.name}</option>)}
          </optgroup>
          <optgroup label="Liste d'attente : paiement mobile non intégré">
            {territories.filter(t => t.group === 'waitlist').map(t => <option key={t.name} value={optionValue(t)}>{t.name}</option>)}
          </optgroup>
          <option value={OTHER_COUNTRY}>Autre pays (à préciser ci-dessous)</option>
        </select>
      </div>
      <div className="lic-frow">
        <div className="lic-field">
          <label htmlFor="f-name">Nom complet</label>
          <input id="f-name" name="name" type="text" placeholder="Prénom et nom" required />
        </div>
        <div className="lic-field">
          <label htmlFor="f-phone">Numéro WhatsApp</label>
          <input id="f-phone" name="phone" type="tel" placeholder="+229 ..." required />
        </div>
      </div>
      <div className="lic-field">
        <label htmlFor="f-email">Adresse e-mail</label>
        <input id="f-email" name="email" type="email" placeholder="vous@exemple.com" required />
      </div>
      <div className="lic-field">
        <label htmlFor="f-exp">Votre parcours en quelques lignes</label>
        <textarea
          id="f-exp"
          name="experience"
          placeholder="Votre activité actuelle, vos expériences en vente, en tech ou en entrepreneuriat."
          required
        />
      </div>
      <div className="lic-field">
        <label htmlFor="f-plan">Comment comptez-vous trouver vos 100 premiers marchands&nbsp;?</label>
        <textarea
          id="f-plan"
          name="plan"
          placeholder="Réseau, terrain, réseaux sociaux, partenariats, associations de commerçants…"
          required
        />
        <small>C&apos;est la partie que nous lisons le plus attentivement.</small>
      </div>
      <div className="lic-field">
        <label htmlFor="f-financing">Comment financerez-vous la licence et vos six premiers mois d&apos;activité&nbsp;?</label>
        <textarea
          id="f-financing"
          name="financing"
          placeholder="Épargne, associés, revenus actuels, prêt…"
          required
        />
      </div>
      <button className="lic-btn lic-btn-primary lic-btn-full" type="submit" disabled={submitting}>
        {submitting ? 'Envoi en cours…' : 'Envoyer ma candidature'}
      </button>
      <p className="lic-form-legal">
        En envoyant ce formulaire, vous acceptez que TEKKIShop utilise ces informations pour étudier
        votre candidature. Aucune donnée ne sera transmise à un tiers.
      </p>
    </form>
  )
}
