'use client'

import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote: "Avant TekkiShop, je prenais les commandes sur WhatsApp et je perdais la moitié. Maintenant mes clients commandent sur mon lien et je vois tout en temps réel.",
    name: "Aminata S.",
    role: "Cuisine maison Aminata, Dakar",
    initial: 'A',
    color: '#0EA5E9',
  },
  {
    quote: "J'ai partagé mon lien sur Instagram un vendredi soir. Le lendemain matin j'avais 12 commandes. TekkiShop a changé ma façon de vendre.",
    name: "Fatou K.",
    role: "Mode & Accessoires Fatou, Thiès",
    initial: 'F',
    color: '#D97706',
  },
  {
    quote: "Le paiement Wave à la commande, c'est révolutionnaire. Fini les retards et les impayés. Mes clients paient avant même que je prépare leur colis.",
    name: "Marie N.",
    role: "Cosmétiques naturels Marie, Dakar",
    initial: 'M',
    color: '#7C3AED',
  },
  {
    quote: "Je vends mes légumes depuis chez moi. Mes clientes du quartier commandent la veille et je prépare les paniers le matin. Simple et efficace !",
    name: "Rokhaya D.",
    role: "Maraîchère Rokhaya, Pikine",
    initial: 'R',
    color: '#059669',
  },
  {
    quote: "J'ai configuré ma boutique en 10 minutes depuis mon téléphone. Le mini site est beau et mes clients me disent qu'ils ont confiance pour commander.",
    name: "Khadija B.",
    role: "Artisanat & Déco, Dakar",
    initial: 'K',
    color: '#DB2777',
  },
  {
    quote: "Les notifications WhatsApp automatiques, c'est la meilleure fonctionnalité. Mes clients reçoivent leur récap de commande et ça évite 100 questions.",
    name: "Ndéye M.",
    role: "Boulangerie Ndéye, Ziguinchor",
    initial: 'N',
    color: '#2563EB',
  },
]

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div
      className="shrink-0 rounded-3xl border border-white/10 bg-white/5 p-5"
      style={{ width: 280 }}
    >
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, j) => (
          <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm text-white/70 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: t.color }}
        >
          {t.initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{t.name}</p>
          <p className="text-xs text-white/40">{t.role}</p>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsCarousel() {
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS]

  return (
    <>
      <style>{`
        @keyframes testimonials-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .testimonials-inner {
          animation: testimonials-scroll 40s linear infinite;
          will-change: transform;
        }
        .testimonials-inner:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="overflow-hidden px-4">
        <div
          className="testimonials-inner flex gap-4"
          style={{ width: 'max-content' }}
        >
          {doubled.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </>
  )
}
