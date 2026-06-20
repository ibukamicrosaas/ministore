'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: "Est-ce que mes clients doivent télécharger une application ?",
    a: "Non. Tes clients commandent directement depuis ton lien, dans leur navigateur. Aucune application à télécharger. C'est aussi simple que d'ouvrir un lien WhatsApp.",
  },
  {
    q: "Est-ce que c'est gratuit pour commencer ?",
    a: "Il n'y a pas de plan 100% gratuit, mais le plan Découverte démarre à 2 900 FCFA / mois (ou son équivalent en euros selon ton pays). C'est moins cher qu'un abonnement téléphonique. Et tu peux annuler à tout moment, sans engagement.",
  },
  {
    q: "Quels sont exactement les frais ?",
    a: "TekkiShop est transparent. Plan Découverte & Business : 3% de commission uniquement sur les paiements en ligne (Wave, Orange Money, carte bancaire). Le paiement à la livraison est gratuit. Plan Pro : 0% de commission partout. Aucun frais caché, aucun frais d'annulation.",
  },
  {
    q: "Comment je reçois mon argent ?",
    a: "En Afrique : tes clients paient par Wave ou Orange Money et l'argent arrive directement sur ton numéro. En Europe & Canada : les paiements par carte sont gérés via Stripe et virés sur ton compte bancaire automatiquement. Pour le paiement à la livraison, tu encaisses toi-même.",
  },
  {
    q: "Je suis en France / Belgique / Canada — ça marche pour moi ?",
    a: "Oui ! TEKKIShop est désormais disponible en Europe francophone (France, Belgique, Luxembourg, Suisse) et au Canada. Ta boutique affiche les prix en euros (€) ou en dollars canadiens (CAD), et tes clients paient par carte bancaire via Stripe. L'inscription se fait de la même manière que pour l'Afrique.",
  },
  {
    q: "Est-ce que je dois être une entreprise enregistrée ?",
    a: "Pas du tout. TekkiShop est fait pour les vendeurs individuels, les petites boutiques, les cuisinières à domicile, les artisans — que tu sois enregistré ou non.",
  },
  {
    q: "Puis-je vendre n'importe quel type de produit ?",
    a: "Oui : alimentation, mode, beauté, artisanat, électronique, décoration… Tout produit physique ou service à livrer ou à retirer. La seule limite : les produits illégaux.",
  },
  {
    q: "Comment je passe d'un plan à l'autre ?",
    a: "Tu peux changer de plan à tout moment depuis ton tableau de bord. Le nouveau tarif s'applique dès le mois suivant. Aucun frais caché, aucune surprise.",
  },
]

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className={`rounded-2xl border transition-all duration-200 ${
            open === i
              ? 'border-sky-200 bg-sky-50/60'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className={`text-sm font-semibold leading-snug ${open === i ? 'text-sky-700' : 'text-gray-900'}`}>
              {faq.q}
            </span>
            <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
              open === i ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {open === i
                ? <Minus className="h-3.5 w-3.5" />
                : <Plus className="h-3.5 w-3.5" />
              }
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5">
              <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
