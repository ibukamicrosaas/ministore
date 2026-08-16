'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQS = [
  {
    q: 'Puis-je vraiment créer ma boutique avec mon téléphone ?',
    a: 'Oui. Tout se fait depuis ton téléphone, sans ordinateur ni développeur. C\'est aussi simple que publier une photo sur WhatsApp ou Instagram. Un Assistant IA t\'explique et te guide à chaque étape si tu bloques.',
  },
  {
    q: 'Comment je reçois l\'argent que mes clients paient sur ma boutique ?',
    a: 'L\'argent encaissé est reversé directement sur ton compte mobile money ou bancaire selon les retraits que tu effectues. Tu vois chaque paiement en temps réel dans ton espace vendeur.',
  },
  {
    q: 'Dans quels pays TEKKIShop fonctionne ?',
    a: 'Dans 11 pays : Sénégal, Côte d\'Ivoire, Togo, Bénin, Burkina Faso et Mali — avec les paiements mobiles locaux de chaque pays — ainsi qu\'en France, en Belgique, au Luxembourg, en Suisse et au Canada, avec paiement par carte bancaire.',
  },
  {
    q: 'Quelle est la différence entre les 3 plans ?',
    a: 'Le plan Découverte (2 900 FCFA/mois) donne accès à 10 produits et aux paiements de base. Le plan Business (4 900 FCFA/mois) ajoute les produits illimités, les notifications SMS automatiques et les codes promo. Le plan Pro (9 900 FCFA/mois) va plus loin : 0 % de commission avec tes propres clés de paiement, ton propre nom de domaine, et la marque TEKKIShop masquée.',
  },
  {
    q: 'Faut-il choisir un plan pour pouvoir vendre ?',
    a: 'Non. Ta boutique est en ligne et peut recevoir des commandes dès que tu publies ton premier produit. Tes 3 premières commandes sont offertes. Tu choisis un plan seulement pour continuer à en recevoir au-delà.',
  },
  {
    q: 'Que se passe-t-il après mes 3 commandes offertes ?',
    a: 'Ta boutique reste visible et tes clients peuvent toujours commander, mais les nouvelles commandes t\'attendent jusqu\'à ce que tu choisisses un plan. Tu les retrouves toutes dès l\'activation, aucune n\'est perdue.',
  },
  {
    q: 'Et si je ne vends rien pendant mes 14 jours ?',
    a: 'Ta boutique ne disparaît pas. Ton Assistant IA t\'aide à trouver tes premiers clients, et tu peux prolonger de 7 jours en partageant ton lien. Tu ne paies que le jour où tu décides de continuer.',
  },
  {
    q: 'Est-ce que je peux changer de plan si j\'en ai déjà choisi un ?',
    a: 'Oui, quand tu veux. Le changement est immédiat. Si tu passes à un plan supérieur, tu profites des nouvelles fonctionnalités tout de suite.',
  },
  {
    q: 'Si j\'arrête de payer l\'abonnement, est-ce que je perds mes produits ?',
    a: 'Non. Ta boutique n\'est plus visible par les clients, mais tous tes produits, tes commandes et tes données restent conservés. Tout revient dès que tu réactives ton abonnement.',
  },
  {
    q: 'Est-ce que je peux vendre à des clients à l\'étranger ?',
    a: 'Oui. Ta boutique est accessible depuis n\'importe quel pays. Les moyens de paiement disponibles s\'adaptent au pays du client quand c\'est possible.',
  },
  {
    q: 'Est-ce que je peux vendre des produits digitaux ?',
    a: 'Oui. Ebooks, formations, fichiers audio, templates — dès que le client paie, il télécharge son fichier automatiquement. Tu n\'as rien à envoyer toi-même.',
  },
  {
    q: 'Pourquoi je dois payer chaque mois pour utiliser TEKKIShop ?',
    a: 'Ta boutique tourne sur nos serveurs 24h/24, même quand tu dors, pour que tes clients puissent commander à tout moment. L\'abonnement couvre l\'hébergement, les paiements mobiles, les mises à jour et l\'assistance. Pas de frais cachés : tu paies le prix affiché et tu arrêtes quand tu veux.',
  },
]

export function FAQv6() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="section" id="faq">
      <div className="container faq-grid">
        <div className="faq-side reveal">
          <span className="label">Questions fréquentes</span>
          <h2>On répond à tout.</h2>
          <p className="lead">Tu peux créer ta boutique maintenant et la préparer à ton rythme.</p>
          <Link href="/start" className="btn btn-primary" style={{ marginTop: 10 }}>
            Créer ma boutique
          </Link>
        </div>

        <div className="faq-list reveal">
          {FAQS.map((item, i) => (
            <article key={i} className={`faq-item${openIdx === i ? ' open' : ''}`}>
              <button
                className="faq-q"
                aria-expanded={openIdx === i}
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                {item.q}
                <i>+</i>
              </button>
              <div className="faq-a">
                <p>{item.a}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
