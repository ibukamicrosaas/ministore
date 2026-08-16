// ── Sub-types (also imported par les composants landing) ───────────────────

export type PaymentLogo = { src?: string; icon?: string; name: string }

export type StepsConfig = {
  boutiqueName: string
  phone: string
  slug: string
  pay1: { method: string; logo: string; color: string }
  pay2: { method: string; logo: string; color: string }
  step4PayText: string
  step4Bullets: [string, string, string]
}

export type OrderFlowConfig = {
  boutiqueName: string
  initial: string
  slug: string
  customerName: string
  address: string
  delivererPhone: string
}

export type Testimonial = {
  quote: string
  name: string
  role: string
  initial: string
  color: string
}

// ── Full country config (pour CountryLandingV6, une entrée par page pays) ──

export interface CountryConfig {
  code: string
  name: string
  flag: string

  meta: {
    title: string
    description: string
    locale: string
  }

  hero: {
    headline: string
    highlightedText: string   // span coloré dans le headline
    subtext: string
    flagsLabel: string
    flags: string[]
    avatarNote: string
    badge1: { text: string; sub: string }   // badge flottant paiement
    badge3Text: string                       // badge flottant livraison
  }

  paymentSection: {
    label: string
    logos: PaymentLogo[]
  }

  avantApres: {
    headline: string
    highlightedText: string   // span coloré dans le headline
    subtitle: string
  }

  steps: StepsConfig
  orderFlow: OrderFlowConfig

  shopsSection: {
    eyebrow: string
    headline: string
    subtitle: string
  }

  journee: {
    badge: string
    subtitle: string
    items: Array<{ heure: string; titre: string; texte: string }>
  }

  walletFeature: {
    title: string
    description: string
  }

  testimonials: Testimonial[]

  testimonialSection: {
    eyebrow: string
    headline: string
    stats: Array<{ value: string; label: string }>
  }

  cta: {
    headline: string
    subtitle: string
    flagsLabel: string
    flags: string[]
  }
}

// ── Configs par pays ───────────────────────────────────────────────────────

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {

  TG: {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',

    meta: {
      title: 'TEKKIShop Togo — Crée ta boutique en ligne à Lomé en 5 minutes',
      description:
        "Vends en ligne depuis Lomé, Kara ou Sokodé. Tes clients paient par Flooz ou T-Money. Tu reçois l'argent sur ton téléphone. Boutique en ligne en 5 minutes, sans développeur.",
      locale: 'fr_TG',
    },

    hero: {
      headline: 'Crée ta boutique en ligne au Togo en 5 minutes, avec ton téléphone.',
      highlightedText: 'au Togo',
      subtext:
        "Tu vends à Lomé, Kara, Sokodé ou ailleurs ? Tes clients commandent seuls, même quand tu dors, paient par Flooz ou T-Money, et tu retires ton argent sur ton téléphone.",
      flagsLabel: 'Disponible au Togo et dans 6 autres pays africains :',
      flags: ['🇹🇬', '🇸🇳', '🇨🇮', '🇧🇯', '🇲🇱', '🇧🇫', '🇨🇲'],
      avatarNote: 'noté par des marchands à Lomé, Kara, Sokodé et partout au Togo',
      badge1: { text: 'Paiement Flooz reçu', sub: '12 500 FCFA — Abla K.' },
      badge3Text: 'Commande envoyée au zem',
    },

    paymentSection: {
      label: 'Tes clients paient comme ils veulent — Flooz, T-Money, paiement à la livraison :',
      logos: [
        { src: '/logo-payments/flooz.png',  name: 'Flooz' },
        { src: '/logo-payments/tmoney.png', name: 'T-Money' },
        { icon: '🚚', name: 'À la livraison' },
      ],
    },

    avantApres: {
      headline: "Ta journée de vendeur au Togo, avant et après TEKKIShop.",
      highlightedText: 'avant et après',
      subtitle:
        "Si tu vends déjà sur WhatsApp ou en boutique physique, tu connais la colonne de gauche par cœur.",
    },

    steps: {
      boutiqueName: 'Abla Mode Lomé',
      phone: '+228 90 00 00 00',
      slug: 'abla-mode',
      pay1: { method: 'Flooz',   logo: '/logo-payments/flooz.png',   color: 'text-blue-700' },
      pay2: { method: 'T-Money', logo: '/logo-payments/tmoney.png',  color: 'text-green-600' },
      step4PayText: 'Flooz, T-Money, ou à la livraison.',
      step4Bullets: [
        'Flooz (Moov Togo), T-Money (Togocel)',
        'Paiement à la livraison possible',
        'Tu vois tout dans ton tableau de bord',
      ],
    },

    orderFlow: {
      boutiqueName:   'Abla Mode Lomé',
      initial:        'A',
      slug:           'abla-mode',
      customerName:   'Yawa Agbeko',
      address:        'Tokoin, Lomé',
      delivererPhone: '+228 90 00 00 00',
    },

    shopsSection: {
      eyebrow:  'Ils vendent déjà avec TEKKIShop Togo',
      headline: 'Des marchands togolais comme toi.',
      subtitle: 'Découvre les boutiques qui vendent avec succès via TEKKIShop au Togo',
    },

    journee: {
      badge:    'Pendant que tu vis ta vie à Lomé',
      subtitle: 'Voici une vraie journée avec TEKKIShop au Togo.',
      items: [
        {
          heure: '07h30',
          titre: 'Tu publies ton lien dans ton statut WhatsApp',
          texte: '« Nouveaux arrivages 🔥 commandez ici » — et tu pars au marché de Lomé chercher ta marchandise.',
        },
        {
          heure: '10h15',
          titre: 'Première commande, déjà payée par Flooz',
          texte: "Abla a commandé 2 pagnes wax et payé par Flooz. Tu reçois la notification. Tu n'as parlé à personne.",
        },
        {
          heure: '10h17',
          titre: 'Tu envoies les livraisons en 1 clic',
          texte: 'Les 3 commandes du matin partent sur le WhatsApp de ton zem, avec les adresses et les montants.',
        },
        {
          heure: '11h20',
          titre: 'Le livreur confirme, tout est compté',
          texte: 'Il clique « Livraison effectuée ✅ », le paiement est enregistré. Tu sais exactement qui a payé quoi.',
        },
        {
          heure: '22h00',
          titre: 'Tu regardes tes chiffres du jour',
          texte: '6 commandes, 72 000 FCFA. Et pendant que tu dors, la boutique reste ouverte.',
        },
      ],
    },

    walletFeature: {
      title: 'Flooz & T-Money intégrés',
      description:
        "Les paiements mobiles togolais sont déjà disponibles. Tes clients paient par Flooz (Moov) ou T-Money (Togocel), et tu retires ton argent instantanément.",
    },

    testimonials: [
      {
        quote: "Avant TEKKIShop, je prenais les commandes sur WhatsApp et je perdais la moitié. Maintenant mes clients commandent sur mon lien et je vois tout en temps réel.",
        name: 'Abla K.', role: 'Mode & Pagnes wax, Lomé', initial: 'A', color: '#0EA5E9',
      },
      {
        quote: "J'ai partagé mon lien dans mon groupe WhatsApp à Kara. En 2 jours j'avais 8 commandes. TEKKIShop a changé ma façon de vendre.",
        name: 'Koffi A.', role: 'Épicerie Koffi, Kara', initial: 'K', color: '#D97706',
      },
      {
        quote: "Le paiement Flooz à la commande, c'est révolutionnaire. Fini les retards et les impayés. Mes clients paient avant même que je prépare leur colis.",
        name: 'Mawuli D.', role: 'Cosmétiques naturels, Lomé', initial: 'M', color: '#7C3AED',
      },
      {
        quote: "Je vends mes pagnes depuis Sokodé. Mes clientes commandent la veille et je prépare les colis le matin. Simple, efficace, et tout depuis mon téléphone.",
        name: 'Afi M.', role: 'Tissu & Pagne, Sokodé', initial: 'A', color: '#059669',
      },
      {
        quote: "J'ai configuré ma boutique en 10 minutes. Mes clients me disent que c'est beau et professionnel — ils ont confiance pour commander et payer en ligne.",
        name: 'Koami B.', role: 'Artisanat Togo, Lomé', initial: 'K', color: '#DB2777',
      },
      {
        quote: "Les notifications WhatsApp automatiques, c'est la meilleure fonctionnalité. Mes clients reçoivent leur récap de commande et ça évite 100 questions.",
        name: 'Yawa E.', role: 'Pâtisserie maison, Lomé', initial: 'Y', color: '#2563EB',
      },
    ],

    testimonialSection: {
      eyebrow:  'Les marchands togolais en parlent mieux',
      headline: "Vendre en ligne au Togo n'a jamais été aussi simple",
      stats: [
        { value: '🇹🇬 Togo',          label: 'Lomé, Kara, Sokodé et partout' },
        { value: 'Flooz · T-Money',    label: 'Paiements mobiles togolais' },
        { value: '5 minutes',          label: 'Pour lancer ta boutique en ligne' },
      ],
    },

    cta: {
      headline: 'Prêt à vendre tes produits en ligne au Togo ?',
      subtitle: 'Ta boutique prête en 5 minutes. Tes clients commandent et paient par Flooz ou T-Money.',
      flagsLabel: 'Disponible au Togo et dans 6 autres pays africains',
      flags: ['🇹🇬', '🇸🇳', '🇨🇮', '🇧🇯', '🇲🇱', '🇧🇫', '🇨🇲'],
    },
  },

  // ── Ajouter les prochains pays ici ────────────────────────────────────────
  // BJ: { code: 'BJ', name: 'Bénin', ... },
  // CM: { code: 'CM', name: 'Cameroun', ... },
}
