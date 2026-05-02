'use client'

import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote: "Avant Sheka, je passais mon dimanche à calculer les commissions de mes 4 coiffeuses. Maintenant ça se fait tout seul. Je n'y pense même plus.",
    name: "Aminata S.",
    role: "Salon Beauté Fatou, Dakar",
    initial: 'A',
    color: '#E85D04',
  },
  {
    quote: "Mes clientes adorent pouvoir réserver depuis WhatsApp sans télécharger d'application. Mon carnet de RDV est plein deux semaines à l'avance.",
    name: "Fatou K.",
    role: "Chez Fatou Coiffure, Thiès",
    initial: 'F',
    color: '#D97706',
  },
  {
    quote: "J'avais peur que ce soit compliqué. J'ai configuré mon salon en 20 minutes depuis mon téléphone. Vraiment simple et efficace.",
    name: "Marie N.",
    role: "Salon Prestige, Dakar",
    initial: 'M',
    color: '#7C3AED',
  },
  {
    quote: "Depuis que j'utilise Sheka, je n'ai plus de no-show. L'acompte Wave change tout. Mes clientes prennent leurs RDV au sérieux.",
    name: "Rokhaya D.",
    role: "Nails & Beauty, Rufisque",
    initial: 'R',
    color: '#059669',
  },
  {
    quote: "Je travaille à domicile et Sheka me permet de gérer mes clientes comme un vrai salon. Le lien WhatsApp, c'est magique.",
    name: "Khadija B.",
    role: "Prestataire à domicile, Dakar",
    initial: 'K',
    color: '#DB2777',
  },
  {
    quote: "Mes employées voient leurs commissions en temps réel depuis leur téléphone. Plus de disputes en fin de semaine. La paix dans le salon !",
    name: "Ndéye M.",
    role: "Studio Beauté Ndéye, Ziguinchor",
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
