'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getCommissionRateRangeLabel } from '@/lib/billing/commission'

// Copie dédiée à la home (lot A landing) — FAQv6.tsx n'est pas touché, les 4
// pages pays continuent de l'utiliser tel quel. Différences : pas de mention
// Découverte (vitrine uniquement) ; retrait "ou ton compte bancaire"
// (PAYOUT_METHODS_BY_COUNTRY ne propose que du mobile money, confirmé) ;
// retrait "instantané"/"directement" ; retrait de la phrase "TEKKIShop ne
// prend aucune commission" (fausse, contredit la ligne suivante) ; commission
// présentée comme commune aux 3 plans via getCommissionRateRangeLabel, jamais
// un taux figé ni propre à un plan.
function buildFaqs(commissionRange: string) {
  return [
    {
      group: 'WhatsApp et tes clients',
      items: [
        {
          q: 'Je vends déjà sur WhatsApp. Pourquoi aurais-je besoin d\'une boutique ?',
          a: 'Parce que WhatsApp t\'oblige à répondre à chaque client, un par un. Avec ta boutique, tes clients trouvent seuls tes prix, ton stock et tes conditions de livraison, commandent et paient à toute heure. Tu gardes WhatsApp pour discuter, et tu arrêtes d\'y perdre des ventes quand les messages débordent.',
        },
        {
          q: 'Est-ce que je dois arrêter de vendre sur WhatsApp ?',
          a: 'Non. TEKKIShop ne remplace pas WhatsApp : il prend le relais quand tu ne peux pas répondre à tout le monde. Mets ton lien dans ton statut, ta bio et ta réponse automatique. Tes clients commandent directement, et tu continues à discuter avec ceux qui le souhaitent.',
        },
        {
          q: 'Est-ce que TEKKIShop m\'apporte des clients ?',
          a: 'Non, et c\'est important de le savoir. TEKKIShop t\'aide à transformer en commandes les clients que tu attires déjà sur TikTok, Instagram, Facebook et WhatsApp. C\'est toi qui les fais venir, avec ton contenu et tes publicités.',
        },
      ],
    },
    {
      group: 'Ta boutique',
      items: [
        {
          q: 'Puis-je vraiment créer ma boutique avec mon téléphone ?',
          a: 'Oui. Tout se fait depuis ton téléphone, sans ordinateur ni développeur. C\'est aussi simple que publier une photo sur WhatsApp ou Instagram. Un Assistant IA t\'explique et te guide à chaque étape si tu bloques.',
        },
        {
          q: 'Comment je reçois l\'argent que mes clients paient sur ma boutique ?',
          a: 'Quand un client paie par mobile money ou par carte, l\'argent arrive dans ta page Revenus, et tu le retires sur ton compte mobile money. Pour le paiement à la livraison, c\'est toi ou ton livreur qui encaissez, comme aujourd\'hui.',
        },
        {
          q: 'Dans quels pays TEKKIShop fonctionne ?',
          a: 'Dans 6 pays d\'Afrique (Sénégal, Côte d\'Ivoire, Togo, Bénin, Burkina Faso, Mali) avec les paiements mobiles locaux de chaque pays, ainsi que dans 5 pays de la diaspora (France, Belgique, Luxembourg, Suisse, Canada) avec paiement par carte bancaire.',
        },
        {
          q: 'Est-ce que je peux vendre des produits digitaux ?',
          a: 'Oui. Ebooks, formations, fichiers audio, modèles — dès que le client paie, il télécharge son fichier automatiquement. Tu n\'as rien à envoyer toi-même.',
        },
      ],
    },
    {
      group: 'Prix et abonnement',
      items: [
        {
          q: 'Comment fonctionne l\'essai gratuit ?',
          a: 'Tu crées ta boutique gratuitement et tes 3 premières commandes sont offertes. Tu choisis un plan seulement quand tu veux continuer à recevoir des commandes.',
        },
        {
          q: 'Quelle est la différence entre les plans ?',
          a: 'Business convient à la plupart des vendeurs : produits illimités, paiement mobile money et à la livraison, tableau de bord avancé avec rapports de ventes. Pro ajoute tout ce qu\'il faut pour une image 100% professionnelle : ton propre nom de domaine, une image de couverture, la marque TEKKIShop masquée, le paiement par carte et un support prioritaire.',
        },
        {
          q: 'Pourquoi je dois payer chaque mois pour utiliser TEKKIShop ?',
          a: `Ta boutique tourne sur nos serveurs 24h/24, même quand tu dors, pour que tes clients puissent commander à tout moment. Une commission de ${commissionRange} selon ton pays s'applique sur les paiements en ligne, sur tous les plans sans exception, pour couvrir les frais des opérateurs — rien n'est prélevé sur le paiement à la livraison, puisque l'argent ne transite pas par nous.`,
        },
        {
          q: 'Est-ce que je peux changer de plan si j\'en ai déjà choisi un ?',
          a: 'Oui, à tout moment, depuis tes paramètres.',
        },
        {
          q: 'Si j\'arrête de payer l\'abonnement, est-ce que je perds mes produits ?',
          a: 'Non. Tes produits et tes commandes restent enregistrés.',
        },
      ],
    },
  ]
}

export function FAQHome() {
  const commissionRange = getCommissionRateRangeLabel()
  const FAQ_GROUPS = buildFaqs(commissionRange)
  const [openKey, setOpenKey] = useState<string>('0-0')

  return (
    <section className="section" id="faq">
      <div className="container faq-grid">
        <div className="faq-side reveal">
          <span className="label">Questions fréquentes</span>
          <h2>On répond à tout.</h2>
          <p className="lead">Tu peux créer ta boutique maintenant et la préparer à ton rythme.</p>
          <Link href="/start" className="btn btn-primary" style={{ marginTop: 10 }}>Créer ma boutique</Link>
        </div>

        <div className="faq-list reveal">
          {FAQ_GROUPS.map((grp, gi) => (
            <div key={grp.group}>
              <div className="faq-group-label" style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: gi === 0 ? '0 0 10px' : '28px 0 10px' }}>
                {grp.group}
              </div>
              {grp.items.map((item, ii) => {
                const key = `${gi}-${ii}`
                return (
                  <article key={key} className={`faq-item${openKey === key ? ' open' : ''}`}>
                    <button className="faq-q" aria-expanded={openKey === key} onClick={() => setOpenKey(openKey === key ? '' : key)}>
                      {item.q}
                      <i>+</i>
                    </button>
                    <div className="faq-a"><p>{item.a}</p></div>
                  </article>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
