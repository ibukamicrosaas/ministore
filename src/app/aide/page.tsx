import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME, PAYOUT_MIN_AMOUNT, FREE_ORDERS_TRIAL_DAYS } from '@/constants'
import { getCommissionRateRangeLabel } from '@/lib/billing/commission'
import { HelpCenter } from './HelpCenter'
import type { HelpCategory } from './HelpCenter'

const COMMISSION_RANGE = getCommissionRateRangeLabel()

export const metadata = {
  title: `Centre d'aide — ${APP_NAME}`,
  description: `Toutes les réponses pour créer et gérer ta boutique ${APP_NAME} : produits, commandes, paiements, retraits, compte.`,
}

const ICON_SHOP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M3 9l1-5h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
    <path d="M4 9v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
  </svg>
)
const ICON_BOX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="M3.3 7 12 12l8.7-5" /><path d="M12 22V12" />
  </svg>
)
const ICON_CART = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
)
const ICON_CARD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const ICON_WALLET = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5Z" /><path d="M16 12h.01" /><path d="M3 8h18" />
  </svg>
)
const ICON_USER = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const ICON_TAG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L3 3v6.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.82 0l4.6-4.6a2 2 0 0 0 0-2.82Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
)
const ICON_TRUCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8Z" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const CATEGORIES: HelpCategory[] = [
  {
    title: 'Créer et configurer ma boutique',
    icon: ICON_SHOP,
    items: [
      {
        q: 'Comment créer ma boutique ?',
        a: `Va sur /start, réponds aux quelques questions (nom de ton business, pays, ce que tu vends), et ta boutique est en ligne à la fin — sans ordinateur ni développeur.`,
      },
      {
        q: 'Puis-je changer le nom ou l’adresse de ma boutique après création ?',
        a: 'Oui, depuis Paramètres dans ton espace vendeur. Sache que si tu changes l’adresse (l’URL), les liens déjà partagés avec l’ancienne adresse ne fonctionneront plus.',
      },
      {
        q: 'Comment personnaliser l’apparence de ma boutique ?',
        a: 'Depuis Paramètres, tu peux ajouter ton logo, une photo de couverture, tes réseaux sociaux (Instagram, TikTok, Facebook) et tes horaires si tu es sur le plan Pro.',
      },
      {
        q: 'Puis-je utiliser mon propre nom de domaine ?',
        a: 'Oui, sur le plan Pro. Tu peux connecter un domaine que tu possèdes déjà (par exemple maboutique.com) à la place de tekki.shop/maboutique.',
      },
    ],
  },
  {
    title: 'Ajouter et gérer mes produits',
    icon: ICON_BOX,
    items: [
      {
        q: 'Comment ajouter un produit ?',
        a: 'Depuis Produits > Ajouter un produit : photo, nom, prix, description, et stock si tu vends du physique. Il est visible sur ta boutique dès l’enregistrement.',
      },
      {
        q: 'Puis-je vendre des produits digitaux (ebook, formation, fichier) ?',
        a: 'Oui. Tu mets ton produit en type "digital" et tu uploades le fichier. Dès que le client paie, le lien de téléchargement lui est envoyé automatiquement — tu n’as rien à faire.',
      },
      {
        q: 'Comment gérer les variantes (taille, couleur) et le stock ?',
        a: 'Sur un produit physique, tu peux ajouter des variantes avec un stock séparé pour chacune. Le stock baisse automatiquement à chaque commande confirmée.',
      },
      {
        q: 'Puis-je proposer une réduction sur les grandes quantités ?',
        a: 'Oui, tu peux configurer des paliers de réduction par quantité directement sur la fiche produit (par exemple -10% à partir de 3 articles).',
      },
    ],
  },
  {
    title: 'Commandes et livraison',
    icon: ICON_CART,
    items: [
      {
        q: 'Comment je suis prévenu d’une nouvelle commande ?',
        a: 'Tu reçois une notification dans ton espace vendeur, et un SMS si tu es sur un plan qui inclut les notifications automatiques.',
      },
      {
        q: 'Que veut dire "commande retenue" ?',
        a: `Pendant les ${FREE_ORDERS_TRIAL_DAYS} premiers jours ou tant que tu n’as pas encore de plan actif, tes 3 premières commandes sont offertes. Au-delà, les nouvelles commandes sont mises de côté (retenues) jusqu’à ce que tu choisisses un plan — elles ne sont jamais perdues, tu les retrouves toutes dès l’activation.`,
      },
      {
        q: 'Comment configurer mes zones et mes délais de livraison ?',
        a: 'Depuis Paramètres > Livraison, tu définis tes zones (avec un prix par zone si besoin) et tu peux aussi activer le retrait en boutique.',
      },
      {
        q: 'Puis-je annuler une commande ?',
        a: 'Oui, depuis la fiche de la commande, tant qu’elle n’est pas encore livrée. Le client reçoit une notification de l’annulation.',
      },
    ],
  },
  {
    title: 'Paiements',
    icon: ICON_CARD,
    items: [
      {
        q: 'Quels moyens de paiement mes clients peuvent-ils utiliser ?',
        a: 'Wave, Orange Money, MTN Mobile Money et Moov selon le pays, le paiement à la livraison, et le paiement par carte bancaire pour tes clients en Europe et au Canada.',
      },
      {
        q: 'Puis-je désactiver le paiement à la livraison ?',
        a: 'Oui, chaque moyen de paiement se configure séparément dans Paramètres > Paiements.',
      },
      {
        q: 'Le paiement en ligne est-il sécurisé pour mon client ?',
        a: 'Oui, tous les paiements en ligne passent par nos prestataires de paiement partenaires (Wave, Orange Money, Bictorys, Stripe) — TEKKIShop ne stocke aucune donnée de carte ou de compte mobile money.',
      },
    ],
  },
  {
    title: 'Retirer mon argent',
    icon: ICON_WALLET,
    items: [
      {
        q: 'Comment retirer l’argent de mes ventes ?',
        a: 'Depuis Revenus, clique sur Retirer. L’argent disponible correspond à ce que tu as encaissé en ligne, moins ce que tu as déjà retiré.',
      },
      {
        q: 'Combien de temps prend un retrait ?',
        a: 'Le retrait automatique par Wave ou Orange Money est généralement instantané. Pour les autres méthodes, il est traité manuellement, en général sous 24h.',
      },
      {
        q: 'Quel est le montant minimum pour retirer ?',
        a: `${PAYOUT_MIN_AMOUNT.toLocaleString('fr-FR')} FCFA (ou l’équivalent dans ta devise). En dessous, il faut attendre d’avoir vendu un peu plus avant de pouvoir demander un retrait.`,
      },
      {
        q: 'Quelle commission TEKKIShop prend-elle sur mes ventes ?',
        a: `De ${COMMISSION_RANGE} selon ton pays, sur les paiements encaissés en ligne, sur tous les plans. Le 0% de commission n'est pas un avantage automatique du plan Pro — il ne s'applique que si tu as configuré tes propres clés Bictorys (Paramètres → Paiements). Rien n’est prélevé sur le paiement à la livraison, puisque l’argent ne transite pas par nous.`,
      },
    ],
  },
  {
    title: 'Mon compte',
    icon: ICON_USER,
    items: [
      {
        q: 'Comment me connecter à mon compte ?',
        a: 'Avec ton numéro WhatsApp et ton code PIN à 6 chiffres, depuis la page Connexion.',
      },
      {
        q: 'J’ai oublié mon code PIN, que faire ?',
        a: 'Clique sur "PIN oublié ?" sur la page de connexion — tu reçois un code de réinitialisation par SMS sur ton numéro.',
      },
      {
        q: 'Puis-je changer mon numéro de téléphone ?',
        a: 'Écris-nous sur WhatsApp avec ton ancien et ton nouveau numéro — c’est un changement qu’on effectue manuellement pour la sécurité de ton compte.',
      },
    ],
  },
  {
    title: 'Plans et tarifs',
    icon: ICON_TAG,
    items: [
      {
        q: 'Dois-je payer pour créer ma boutique ?',
        a: 'Non. Ta boutique est en ligne gratuitement dès que tu publies ton premier produit, et tes 3 premières commandes sont offertes. Tu choisis un plan seulement pour continuer à en recevoir au-delà.',
      },
      {
        q: 'Puis-je changer de plan à tout moment ?',
        a: 'Oui, le changement est immédiat. Si tu montes de plan, tu profites des nouvelles fonctionnalités tout de suite.',
      },
      {
        q: 'Si j’arrête de payer, est-ce que je perds mes produits et mes commandes ?',
        a: 'Non, rien n’est supprimé. Ta boutique n’est simplement plus visible par tes clients tant que tu n’as pas réactivé un plan — tout revient tel quel dès la réactivation.',
      },
    ],
  },
  {
    title: 'Livraison et retrait en boutique',
    icon: ICON_TRUCK,
    items: [
      {
        q: 'Puis-je proposer uniquement le retrait en boutique, sans livraison ?',
        a: 'Oui, tu peux activer une seule option, l’autre, ou les deux à la fois, selon ce que tu proposes réellement.',
      },
      {
        q: 'Est-ce que je peux vendre à des clients dans un autre pays que le mien ?',
        a: 'Oui, ta boutique est accessible partout. Les moyens de paiement proposés à ton client s’adaptent automatiquement à son pays quand c’est possible.',
      },
    ],
  },
]

export default function AidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label={`${APP_NAME} — Accueil`}>
            <Image src="/logo.svg" alt={APP_NAME} width={130} height={40} style={{ height: 32, width: 'auto' }} />
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            ← Retour à l&rsquo;accueil
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            En quoi pouvons-nous t&rsquo;aider&nbsp;?
          </h1>
          <p className="mt-3 text-gray-500">
            Tout ce qu&rsquo;il faut savoir pour créer et gérer ta boutique {APP_NAME}.
          </p>
        </div>

        <HelpCenter categories={CATEGORIES} />

        <div className="mt-16 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Tu ne trouves pas ta réponse ?</p>
          <p className="mt-1 text-sm text-gray-500">Notre support WhatsApp répond vite, tous les jours.</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Écrire sur WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
