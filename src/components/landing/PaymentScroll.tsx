'use client'

import Image from 'next/image'

const LOGOS: { src?: string; icon?: string; name: string }[] = [
  { src: '/logo-payments/wave_1.svg', name: 'Wave' },
  { src: '/logo-payments/maxit.webp', name: 'MaxIt' },
  { src: '/logo-payments/om_1.svg', name: 'Orange Money' },
  { src: '/logo-payments/mtn_1.svg', name: 'MTN Money' },
  { src: '/logo-payments/moov_1.svg', name: 'Moov' },
  { icon: '🚚', name: 'À la livraison' },
]

function LogoBadge({ src, icon, name }: { src?: string; icon?: string; name: string }) {
  return (
    <div className="shrink-0 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
      <div className="relative h-7 w-16 flex items-center justify-center">
        {src ? (
          <Image src={src} alt={name} fill className="object-contain" sizes="64px" />
        ) : (
          <span className="text-lg">{icon}</span>
        )}
      </div>
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{name}</span>
    </div>
  )
}

export function PaymentScroll() {
  const doubled = [...LOGOS, ...LOGOS]

  return (
    <>
      <style>{`
        @keyframes payment-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .payment-track {
          animation: payment-marquee 18s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* Mobile — défilement automatique */}
      <div className="md:hidden overflow-hidden">
        <div className="payment-track flex gap-3" style={{ width: 'max-content' }}>
          {doubled.map((l, i) => <LogoBadge key={i} src={l.src} icon={l.icon} name={l.name} />)}
        </div>
      </div>

      {/* Desktop — grille centrée */}
      <div className="hidden md:flex flex-wrap items-center justify-center gap-4">
        {LOGOS.map((l) => <LogoBadge key={l.name} src={l.src} icon={l.icon} name={l.name} />)}
      </div>
    </>
  )
}
