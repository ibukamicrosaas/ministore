'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: "Je n'ai jamais vendu en ligne. C'est vraiment pour moi ?",
    a: "Oui. TekkiShop est fait exactement pour toi. Si tu sais envoyer une photo sur WhatsApp, tu sais créer ta boutique. Et si tu bloques quelque part, notre équipe t'accompagne gratuitement sur WhatsApp jusqu'à ta première vente.",
  },
  {
    q: "Est-ce que j'ai besoin d'un ordinateur ?",
    a: "Non. Tout se fait depuis ton téléphone : créer ta boutique, ajouter tes produits, confirmer tes commandes, suivre tes ventes. Un ordinateur peut être utilisé si tu préfères, mais il n'est jamais obligatoire.",
  },
  {
    q: "L'argent de mes ventes arrive où ?",
    a: "Directement chez toi. En Afrique : sur ton compte Wave ou Orange Money, dès que tu fais un retrait depuis ton tableau de bord (2 000 FCFA minimum). Si tu es sur le plan Découverte ou Business, la commission de 3 % est automatiquement déduite au moment du retrait. En Europe & Canada : les paiements par carte sont gérés via Stripe et virés directement sur ton compte bancaire. TekkiShop ne garde jamais ton argent.",
  },
  {
    q: "Est-ce que mes clients doivent télécharger une application ?",
    a: "Non. Tes clients commandent directement depuis ton lien, dans leur navigateur. Aucune application à télécharger. C'est aussi simple que d'ouvrir un lien WhatsApp.",
  },
  {
    q: "Est-ce que c'est gratuit pour commencer ?",
    a: "Oui. Ta boutique est en ligne et peut recevoir des commandes dès que tu publies ton premier produit. Tes 3 premières commandes sont offertes. Tu choisis un plan seulement pour continuer à en recevoir au-delà, à partir de 2 900 FCFA / mois, sans engagement.",
  },
  {
    q: "Que se passe-t-il après mes 3 commandes offertes ?",
    a: "Ta boutique reste visible et tes clients peuvent toujours commander, mais les nouvelles commandes t'attendent jusqu'à ce que tu choisisses un plan. Tu les retrouves toutes dès l'activation, aucune n'est perdue.",
  },
  {
    q: "Et si je ne vends rien pendant mes 14 jours ?",
    a: "Ta boutique ne disparaît pas. Ton Assistant IA t'aide à trouver tes premiers clients, et tu peux prolonger de 7 jours en partageant ton lien. Tu ne paies que le jour où tu décides de continuer.",
  },
  {
    q: "Quels sont exactement les frais ?",
    a: "TekkiShop est transparent. Plan Découverte & Business : 3% de commission uniquement sur les paiements en ligne (Wave, Orange Money, carte bancaire). Le paiement à la livraison est gratuit. Plan Pro : 0% de commission partout. Aucun frais caché, aucun frais d'annulation.",
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
    a: "Tu peux changer de plan à tout moment depuis ton tableau de bord (menu « Passer au Pro »). Le changement est immédiat : ton nouveau plan est activé dès le paiement et reste valable 31 jours à compter de cette date. Attention : il n'y a pas de proratisation — les jours restants de ton ancien plan ne sont pas déduits du prix du nouveau plan. Aucun frais caché, aucune surprise.",
  },
  {
    q: "Puis-je renouveler mon plan avant la fin de mon abonnement ?",
    a: "Oui, absolument ! Tu peux renouveler à tout moment depuis la page « Passer au Pro » de ton tableau de bord — même si ton abonnement est encore en cours. Le renouvellement repart pour 31 jours à compter du paiement. Il n'y a pas de remboursement pour les jours restants.",
  },
  {
    q: "Le plan Pro inclut-il un nom de domaine ?",
    a: "Non. TEKKIShop ne vend pas de noms de domaine. Le plan Pro te permet de connecter ton propre domaine personnalisé (ex : monbusiness.com), mais tu dois l'acheter toi-même auprès d'un registrar comme Namecheap, GoDaddy, OVH ou Gandi. Une fois acheté, tu le connectes depuis les paramètres de ta boutique. TEKKIShop t'indique exactement comment faire (enregistrement DNS).",
  },
  {
    q: "Dois-je avoir un compte Bictorys ou Stripe pour recevoir des paiements ?",
    a: "Oui. Pour accepter les paiements en ligne en Afrique (Wave, Orange Money, Moov…), tu dois avoir un compte actif chez Bictorys — c'est la plateforme fintech qui traite ces paiements. Pour les paiements par carte bancaire en Europe ou au Canada, tu dois avoir un compte Stripe actif. Ces deux comptes sont gratuits à créer, mais sont soumis aux conditions et à la vérification d'identité propres à chaque Fintech. TEKKIShop te guide dans la procédure de connexion.",
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
