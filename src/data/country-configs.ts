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
      badge1: { text: 'Paiement reçu', sub: 'Flooz · 12 500 FCFA — Abla K.' },
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

  ML: {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',

    meta: {
      title: 'TEKKIShop Mali — Crée ta boutique en ligne à Bamako en 5 minutes',
      description:
        "Vends en ligne depuis Bamako, Ségou ou Mopti. Tes clients paient par Wave ou Orange Money. Boutique en ligne en 5 minutes, sans développeur.",
      locale: 'fr_ML',
    },

    hero: {
      headline: 'Crée ta boutique en ligne au Mali en 5 minutes, avec ton téléphone.',
      highlightedText: 'au Mali',
      subtext:
        "Tu vends à Bamako, Ségou, Mopti ou ailleurs ? Tes clients commandent seuls, même quand tu dors, paient par Wave ou Orange Money, et tu retires ton argent sur ton téléphone.",
      flagsLabel: 'Disponible au Mali et dans 6 autres pays africains :',
      flags: ['🇲🇱', '🇸🇳', '🇨🇮', '🇹🇬', '🇧🇯', '🇧🇫', '🇨🇲'],
      avatarNote: 'noté par des marchands à Bamako, Ségou, Mopti et partout au Mali',
      badge1: { text: 'Paiement reçu', sub: 'Wave · 18 000 FCFA — Aminata C.' },
      badge3Text: 'Commande envoyée au coursier',
    },

    paymentSection: {
      label: 'Tes clients paient comme ils veulent — Wave, Orange Money, paiement à la livraison :',
      logos: [
        { src: '/logo-payments/wave_1.svg', name: 'Wave' },
        { src: '/logo-payments/om_1.svg',   name: 'Orange Money' },
        { icon: '🚚', name: 'À la livraison' },
      ],
    },

    avantApres: {
      headline: "Ta journée de vendeur au Mali, avant et après TEKKIShop.",
      highlightedText: 'avant et après',
      subtitle:
        "Si tu vends déjà sur WhatsApp ou en boutique physique, tu connais la colonne de gauche par cœur.",
    },

    steps: {
      boutiqueName: 'Aminata Mode Bamako',
      phone: '+223 70 00 00 00',
      slug: 'aminata-mode',
      pay1: { method: 'Wave',         logo: '/logo-payments/wave_1.svg', color: 'text-blue-700'   },
      pay2: { method: 'Orange Money', logo: '/logo-payments/om_1.svg',   color: 'text-orange-600' },
      step4PayText: 'Wave, Orange Money, ou à la livraison.',
      step4Bullets: [
        'Wave et Orange Money acceptés',
        'Paiement à la livraison possible',
        'Tu vois tout dans ton tableau de bord',
      ],
    },

    orderFlow: {
      boutiqueName:   'Aminata Mode Bamako',
      initial:        'A',
      slug:           'aminata-mode',
      customerName:   'Fatoumata Diarra',
      address:        'Hamdallaye, Bamako',
      delivererPhone: '+223 70 00 00 00',
    },

    shopsSection: {
      eyebrow:  'Ils vendent déjà avec TEKKIShop Mali',
      headline: 'Des marchands maliens comme toi.',
      subtitle: 'Découvre les boutiques qui vendent avec succès via TEKKIShop au Mali',
    },

    journee: {
      badge:    'Pendant que tu vis ta vie à Bamako',
      subtitle: 'Voici une vraie journée avec TEKKIShop au Mali.',
      items: [
        {
          heure: '07h30',
          titre: 'Tu publies ton lien dans ton statut WhatsApp',
          texte: '« Nouveaux arrivages 🔥 commandez ici » — et tu pars au grand marché de Bamako chercher ta marchandise.',
        },
        {
          heure: '10h15',
          titre: 'Première commande, déjà payée par Wave',
          texte: "Fatoumata a commandé 2 boubous et payé par Wave. Tu reçois la notification. Tu n'as parlé à personne.",
        },
        {
          heure: '10h17',
          titre: 'Tu envoies les livraisons en 1 clic',
          texte: 'Les 3 commandes du matin partent sur le WhatsApp de ton coursier, avec les adresses et les montants.',
        },
        {
          heure: '11h20',
          titre: 'Le livreur confirme, tout est compté',
          texte: 'Il clique « Livraison effectuée ✅ », le paiement est enregistré. Tu sais exactement qui a payé quoi.',
        },
        {
          heure: '22h00',
          titre: 'Tu regardes tes chiffres du jour',
          texte: '5 commandes, 65 000 FCFA. Et pendant que tu dors, la boutique reste ouverte.',
        },
      ],
    },

    walletFeature: {
      title: 'Wave & Orange Money intégrés',
      description:
        "Les paiements mobiles maliens sont déjà disponibles. Tes clients paient par Wave ou Orange Money, et tu retires ton argent instantanément.",
    },

    testimonials: [
      {
        quote: "Avant TEKKIShop, je prenais les commandes sur WhatsApp et je perdais la moitié. Maintenant mes clients commandent sur mon lien et je vois tout en temps réel.",
        name: 'Aminata C.', role: 'Mode & Bazin, Bamako', initial: 'A', color: '#0EA5E9',
      },
      {
        quote: "J'ai partagé mon lien dans mon groupe WhatsApp à Ségou. En 2 jours j'avais 8 commandes. TEKKIShop a changé ma façon de vendre.",
        name: 'Modibo T.', role: 'Épicerie Modibo, Ségou', initial: 'M', color: '#D97706',
      },
      {
        quote: "Le paiement Wave à la commande, c'est révolutionnaire. Fini les retards et les impayés. Mes clients paient avant même que je prépare leur colis.",
        name: 'Kadiatou S.', role: 'Cosmétiques naturels, Bamako', initial: 'K', color: '#7C3AED',
      },
      {
        quote: "Je vends mes tissus depuis Mopti. Mes clientes commandent la veille et je prépare les colis le matin. Simple, efficace, et tout depuis mon téléphone.",
        name: 'Oumou D.', role: 'Tissu & Bazin, Mopti', initial: 'O', color: '#059669',
      },
      {
        quote: "J'ai configuré ma boutique en 10 minutes. Mes clients me disent que c'est beau et professionnel — ils ont confiance pour commander et payer en ligne.",
        name: 'Ibrahim K.', role: 'Artisanat Mali, Bamako', initial: 'I', color: '#DB2777',
      },
      {
        quote: "Les notifications WhatsApp automatiques, c'est la meilleure fonctionnalité. Mes clients reçoivent leur récap de commande et ça évite 100 questions.",
        name: 'Awa B.', role: 'Pâtisserie maison, Bamako', initial: 'A', color: '#2563EB',
      },
    ],

    testimonialSection: {
      eyebrow:  'Les marchands maliens en parlent mieux',
      headline: "Vendre en ligne au Mali n'a jamais été aussi simple",
      stats: [
        { value: '🇲🇱 Mali',            label: 'Bamako, Ségou, Mopti et partout' },
        { value: 'Wave · Orange Money', label: 'Paiements mobiles maliens' },
        { value: '5 minutes',           label: 'Pour lancer ta boutique en ligne' },
      ],
    },

    cta: {
      headline: 'Prêt à vendre tes produits en ligne au Mali ?',
      subtitle: 'Ta boutique prête en 5 minutes. Tes clients commandent et paient par Wave ou Orange Money.',
      flagsLabel: 'Disponible au Mali et dans 6 autres pays africains',
      flags: ['🇲🇱', '🇸🇳', '🇨🇮', '🇹🇬', '🇧🇯', '🇧🇫', '🇨🇲'],
    },
  },

  BJ: {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',

    meta: {
      title: 'TEKKIShop Bénin — Crée ta boutique en ligne à Cotonou en 5 minutes',
      description:
        "Vends en ligne depuis Cotonou, Porto-Novo ou Parakou. Tes clients paient par MTN Money ou Moov Money. Boutique en ligne en 5 minutes, sans développeur.",
      locale: 'fr_BJ',
    },

    hero: {
      headline: 'Crée ta boutique en ligne au Bénin en 5 minutes, avec ton téléphone.',
      highlightedText: 'au Bénin',
      subtext:
        "Tu vends à Cotonou, Porto-Novo, Parakou ou ailleurs ? Tes clients commandent seuls, même quand tu dors, paient par MTN Money ou Moov Money, et tu retires ton argent sur ton téléphone.",
      flagsLabel: 'Disponible au Bénin et dans 6 autres pays africains :',
      flags: ['🇧🇯', '🇸🇳', '🇨🇮', '🇹🇬', '🇲🇱', '🇧🇫', '🇨🇲'],
      avatarNote: 'noté par des marchands à Cotonou, Porto-Novo, Parakou et partout au Bénin',
      badge1: { text: 'Paiement reçu', sub: 'MTN Money · 15 000 FCFA — Chimène A.' },
      badge3Text: 'Commande envoyée au zémidjan',
    },

    paymentSection: {
      label: 'Tes clients paient comme ils veulent — MTN Money, Moov Money, paiement à la livraison :',
      logos: [
        { src: '/logo-payments/mtn_1.svg',  name: 'MTN Money' },
        { src: '/logo-payments/moov_1.svg', name: 'Moov Money' },
        { icon: '🚚', name: 'À la livraison' },
      ],
    },

    avantApres: {
      headline: "Ta journée de vendeur au Bénin, avant et après TEKKIShop.",
      highlightedText: 'avant et après',
      subtitle:
        "Si tu vends déjà sur WhatsApp ou en boutique physique, tu connais la colonne de gauche par cœur.",
    },

    steps: {
      boutiqueName: 'Chimène Mode Cotonou',
      phone: '+229 97 00 00 00',
      slug: 'chimene-mode',
      pay1: { method: 'MTN Money',  logo: '/logo-payments/mtn_1.svg',  color: 'text-yellow-600' },
      pay2: { method: 'Moov Money', logo: '/logo-payments/moov_1.svg', color: 'text-blue-600'   },
      step4PayText: 'MTN Money, Moov Money, ou à la livraison.',
      step4Bullets: [
        'MTN Money et Moov Money acceptés',
        'Paiement à la livraison possible',
        'Tu vois tout dans ton tableau de bord',
      ],
    },

    orderFlow: {
      boutiqueName:   'Chimène Mode Cotonou',
      initial:        'C',
      slug:           'chimene-mode',
      customerName:   'Rachidatou Sero',
      address:        'Fidjrossè, Cotonou',
      delivererPhone: '+229 97 00 00 00',
    },

    shopsSection: {
      eyebrow:  'Ils vendent déjà avec TEKKIShop Bénin',
      headline: 'Des marchands béninois comme toi.',
      subtitle: 'Découvre les boutiques qui vendent avec succès via TEKKIShop au Bénin',
    },

    journee: {
      badge:    'Pendant que tu vis ta vie à Cotonou',
      subtitle: 'Voici une vraie journée avec TEKKIShop au Bénin.',
      items: [
        {
          heure: '07h30',
          titre: 'Tu publies ton lien dans ton statut WhatsApp',
          texte: '« Nouveaux arrivages 🔥 commandez ici » — et tu pars au marché Dantokpa chercher ta marchandise.',
        },
        {
          heure: '10h15',
          titre: 'Première commande, déjà payée par MTN Money',
          texte: "Chimène a commandé 2 pagnes et payé par MTN Money. Tu reçois la notification. Tu n'as parlé à personne.",
        },
        {
          heure: '10h17',
          titre: 'Tu envoies les livraisons en 1 clic',
          texte: 'Les 3 commandes du matin partent sur le WhatsApp de ton zémidjan, avec les adresses et les montants.',
        },
        {
          heure: '11h20',
          titre: 'Le livreur confirme, tout est compté',
          texte: 'Il clique « Livraison effectuée ✅ », le paiement est enregistré. Tu sais exactement qui a payé quoi.',
        },
        {
          heure: '22h00',
          titre: 'Tu regardes tes chiffres du jour',
          texte: '7 commandes, 84 000 FCFA. Et pendant que tu dors, la boutique reste ouverte.',
        },
      ],
    },

    walletFeature: {
      title: 'MTN Money & Moov Money intégrés',
      description:
        "Les paiements mobiles béninois sont déjà disponibles. Tes clients paient par MTN Money ou Moov Money, et tu retires ton argent instantanément.",
    },

    testimonials: [
      {
        quote: "Avant TEKKIShop, je prenais les commandes sur WhatsApp et je perdais la moitié. Maintenant mes clients commandent sur mon lien et je vois tout en temps réel.",
        name: 'Chimène A.', role: 'Mode & Pagnes, Cotonou', initial: 'C', color: '#0EA5E9',
      },
      {
        quote: "J'ai partagé mon lien dans mon groupe WhatsApp à Porto-Novo. En 2 jours j'avais 8 commandes. TEKKIShop a changé ma façon de vendre.",
        name: 'Roméo H.', role: 'Épicerie Roméo, Porto-Novo', initial: 'R', color: '#D97706',
      },
      {
        quote: "Le paiement MTN Money à la commande, c'est révolutionnaire. Fini les retards et les impayés. Mes clients paient avant même que je prépare leur colis.",
        name: 'Bernadette K.', role: 'Cosmétiques naturels, Cotonou', initial: 'B', color: '#7C3AED',
      },
      {
        quote: "Je vends mes tissus depuis Parakou. Mes clientes commandent la veille et je prépare les colis le matin. Simple, efficace, et tout depuis mon téléphone.",
        name: 'Fadilatou M.', role: 'Tissu & Wax, Parakou', initial: 'F', color: '#059669',
      },
      {
        quote: "J'ai configuré ma boutique en 10 minutes. Mes clients me disent que c'est beau et professionnel — ils ont confiance pour commander et payer en ligne.",
        name: 'Gilchrist A.', role: 'Artisanat Bénin, Cotonou', initial: 'G', color: '#DB2777',
      },
      {
        quote: "Les notifications WhatsApp automatiques, c'est la meilleure fonctionnalité. Mes clients reçoivent leur récap de commande et ça évite 100 questions.",
        name: 'Nadège E.', role: 'Pâtisserie maison, Cotonou', initial: 'N', color: '#2563EB',
      },
    ],

    testimonialSection: {
      eyebrow:  'Les marchands béninois en parlent mieux',
      headline: "Vendre en ligne au Bénin n'a jamais été aussi simple",
      stats: [
        { value: '🇧🇯 Bénin',                label: 'Cotonou, Porto-Novo, Parakou et partout' },
        { value: 'MTN Money · Moov Money',   label: 'Paiements mobiles béninois' },
        { value: '5 minutes',                label: 'Pour lancer ta boutique en ligne' },
      ],
    },

    cta: {
      headline: 'Prêt à vendre tes produits en ligne au Bénin ?',
      subtitle: 'Ta boutique prête en 5 minutes. Tes clients commandent et paient par MTN Money ou Moov Money.',
      flagsLabel: 'Disponible au Bénin et dans 6 autres pays africains',
      flags: ['🇧🇯', '🇸🇳', '🇨🇮', '🇹🇬', '🇲🇱', '🇧🇫', '🇨🇲'],
    },
  },

  // Code 'BK' — seul code accepté par Bictorys pour le Burkina Faso (migration
  // 093, REPRISE.md §4.30). Ne jamais utiliser 'BF' ici, même si le nom
  // affiché reste "Burkina Faso" et que meta.locale utilise le vrai code
  // ISO 'fr_BF' (une balise de langue, sans rapport avec le code Bictorys).
  BK: {
    code: 'BK',
    name: 'Burkina Faso',
    flag: '🇧🇫',

    meta: {
      title: 'TEKKIShop Burkina Faso — Crée ta boutique en ligne à Ouagadougou en 5 minutes',
      description:
        "Vends en ligne depuis Ouagadougou, Bobo-Dioulasso ou Koudougou. Tes clients paient par Wave, Orange Money ou Moov Money. Boutique en ligne en 5 minutes, sans développeur.",
      locale: 'fr_BF',
    },

    hero: {
      headline: 'Crée ta boutique en ligne au Burkina Faso en 5 minutes, avec ton téléphone.',
      highlightedText: 'au Burkina Faso',
      subtext:
        "Tu vends à Ouagadougou, Bobo-Dioulasso, Koudougou ou ailleurs ? Tes clients commandent seuls, même quand tu dors, paient par Wave, Orange Money ou Moov Money, et tu retires ton argent sur ton téléphone.",
      flagsLabel: 'Disponible au Burkina Faso et dans 6 autres pays africains :',
      flags: ['🇧🇫', '🇸🇳', '🇨🇮', '🇹🇬', '🇧🇯', '🇲🇱', '🇨🇲'],
      avatarNote: 'noté par des marchands à Ouagadougou, Bobo-Dioulasso, Koudougou et partout au Burkina Faso',
      badge1: { text: 'Paiement reçu', sub: 'Orange Money · 16 000 FCFA — Awa O.' },
      badge3Text: 'Commande envoyée au livreur',
    },

    paymentSection: {
      label: 'Tes clients paient comme ils veulent — Wave, Orange Money, Moov Money, paiement à la livraison :',
      logos: [
        { src: '/logo-payments/wave_1.svg', name: 'Wave' },
        { src: '/logo-payments/om_1.svg',   name: 'Orange Money' },
        { src: '/logo-payments/moov_1.svg', name: 'Moov Money' },
        { icon: '🚚', name: 'À la livraison' },
      ],
    },

    avantApres: {
      headline: "Ta journée de vendeur au Burkina Faso, avant et après TEKKIShop.",
      highlightedText: 'avant et après',
      subtitle:
        "Si tu vends déjà sur WhatsApp ou en boutique physique, tu connais la colonne de gauche par cœur.",
    },

    steps: {
      boutiqueName: 'Awa Mode Ouaga',
      phone: '+226 70 00 00 00',
      slug: 'awa-mode',
      pay1: { method: 'Orange Money', logo: '/logo-payments/om_1.svg',   color: 'text-orange-600' },
      pay2: { method: 'Moov Money',   logo: '/logo-payments/moov_1.svg', color: 'text-blue-600'   },
      step4PayText: 'Wave, Orange Money, Moov Money, ou à la livraison.',
      step4Bullets: [
        'Wave, Orange Money et Moov Money acceptés',
        'Paiement à la livraison possible',
        'Tu vois tout dans ton tableau de bord',
      ],
    },

    orderFlow: {
      boutiqueName:   'Awa Mode Ouaga',
      initial:        'A',
      slug:           'awa-mode',
      customerName:   'Salimata Ouédraogo',
      address:        'Gounghin, Ouagadougou',
      delivererPhone: '+226 70 00 00 00',
    },

    shopsSection: {
      eyebrow:  'Ils vendent déjà avec TEKKIShop Burkina Faso',
      headline: 'Des marchands burkinabè comme toi.',
      subtitle: 'Découvre les boutiques qui vendent avec succès via TEKKIShop au Burkina Faso',
    },

    journee: {
      badge:    'Pendant que tu vis ta vie à Ouagadougou',
      subtitle: 'Voici une vraie journée avec TEKKIShop au Burkina Faso.',
      items: [
        {
          heure: '07h30',
          titre: 'Tu publies ton lien dans ton statut WhatsApp',
          texte: '« Nouveaux arrivages 🔥 commandez ici » — et tu pars au grand marché de Ouagadougou chercher ta marchandise.',
        },
        {
          heure: '10h15',
          titre: 'Première commande, déjà payée par Orange Money',
          texte: "Awa a commandé 2 boubous et payé par Orange Money. Tu reçois la notification. Tu n'as parlé à personne.",
        },
        {
          heure: '10h17',
          titre: 'Tu envoies les livraisons en 1 clic',
          texte: 'Les 3 commandes du matin partent sur le WhatsApp de ton livreur, avec les adresses et les montants.',
        },
        {
          heure: '11h20',
          titre: 'Le livreur confirme, tout est compté',
          texte: 'Il clique « Livraison effectuée ✅ », le paiement est enregistré. Tu sais exactement qui a payé quoi.',
        },
        {
          heure: '22h00',
          titre: 'Tu regardes tes chiffres du jour',
          texte: '6 commandes, 78 000 FCFA. Et pendant que tu dors, la boutique reste ouverte.',
        },
      ],
    },

    walletFeature: {
      title: 'Wave, Orange Money & Moov Money intégrés',
      description:
        "Les paiements mobiles burkinabè sont déjà disponibles. Tes clients paient par Wave, Orange Money ou Moov Money, et tu retires ton argent instantanément.",
    },

    testimonials: [
      {
        quote: "Avant TEKKIShop, je prenais les commandes sur WhatsApp et je perdais la moitié. Maintenant mes clients commandent sur mon lien et je vois tout en temps réel.",
        name: 'Awa O.', role: 'Mode & Boubous, Ouagadougou', initial: 'A', color: '#0EA5E9',
      },
      {
        quote: "J'ai partagé mon lien dans mon groupe WhatsApp à Bobo-Dioulasso. En 2 jours j'avais 8 commandes. TEKKIShop a changé ma façon de vendre.",
        name: 'Boureima S.', role: 'Épicerie Boureima, Bobo-Dioulasso', initial: 'B', color: '#D97706',
      },
      {
        quote: "Le paiement Orange Money à la commande, c'est révolutionnaire. Fini les retards et les impayés. Mes clients paient avant même que je prépare leur colis.",
        name: 'Salimata K.', role: 'Cosmétiques naturels, Ouagadougou', initial: 'S', color: '#7C3AED',
      },
      {
        quote: "Je vends mes tissus depuis Koudougou. Mes clientes commandent la veille et je prépare les colis le matin. Simple, efficace, et tout depuis mon téléphone.",
        name: 'Aïcha T.', role: 'Tissu & Faso Dan Fani, Koudougou', initial: 'A', color: '#059669',
      },
      {
        quote: "J'ai configuré ma boutique en 10 minutes. Mes clients me disent que c'est beau et professionnel — ils ont confiance pour commander et payer en ligne.",
        name: 'Issa Z.', role: 'Artisanat Burkina, Ouagadougou', initial: 'I', color: '#DB2777',
      },
      {
        quote: "Les notifications WhatsApp automatiques, c'est la meilleure fonctionnalité. Mes clients reçoivent leur récap de commande et ça évite 100 questions.",
        name: 'Mariam D.', role: 'Pâtisserie maison, Ouagadougou', initial: 'M', color: '#2563EB',
      },
    ],

    testimonialSection: {
      eyebrow:  'Les marchands burkinabè en parlent mieux',
      headline: "Vendre en ligne au Burkina Faso n'a jamais été aussi simple",
      stats: [
        { value: '🇧🇫 Burkina Faso', label: 'Ouagadougou, Bobo-Dioulasso et partout' },
        { value: 'Wave · OM · Moov', label: 'Paiements mobiles burkinabè' },
        { value: '5 minutes',        label: 'Pour lancer ta boutique en ligne' },
      ],
    },

    cta: {
      headline: 'Prêt à vendre tes produits en ligne au Burkina Faso ?',
      subtitle: 'Ta boutique prête en 5 minutes. Tes clients commandent et paient par Wave, Orange Money ou Moov Money.',
      flagsLabel: 'Disponible au Burkina Faso et dans 6 autres pays africains',
      flags: ['🇧🇫', '🇸🇳', '🇨🇮', '🇹🇬', '🇧🇯', '🇲🇱', '🇨🇲'],
    },
  },

  // ── Ajouter les prochains pays ici ────────────────────────────────────────
  // CM: { code: 'CM', name: 'Cameroun', ... },
}
