'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Download, Star } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

export function DecouverteIllustration() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [stars, setStars] = useState(0)

  useEffect(() => {
    if (!inView) return
    const timers = [0, 1, 2, 3, 4].map(i => setTimeout(() => setStars(s => Math.max(s, i + 1)), 500 + i * 120))
    return () => timers.forEach(clearTimeout)
  }, [inView])

  return (
    <div ref={ref} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div
        className="h-14 rounded-lg mb-2 flex items-center justify-center text-xl transition-opacity duration-700"
        style={{ background: 'linear-gradient(135deg, #F4F1FF 0%, #E5DEFF 100%)', opacity: inView ? 1 : 0 }}
      >
        📘
      </div>
      <p className="text-[9px] font-bold text-gray-800 transition-opacity duration-500" style={{ opacity: inView ? 1 : 0, transitionDelay: '250ms' }}>
        Guide business Afrique 2026
      </p>
      <div className="flex gap-0.5 mt-1">
        {[0, 1, 2, 3, 4].map(i => (
          <Star key={i} className={`h-2.5 w-2.5 transition-colors duration-300 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
        ))}
      </div>
      <p className="text-[8px] text-amber-600 font-semibold mt-1 transition-opacity duration-500" style={{ opacity: stars >= 5 ? 1 : 0 }}>
        🔥 7 personnes ont commandé
      </p>
    </div>
  )
}

export function PaiementIllustration() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [selected, setSelected] = useState(false)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t1 = setTimeout(() => setSelected(true), 500)
    const t2 = setTimeout(() => setPaid(true), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [inView])

  return (
    <div ref={ref} className="rounded-xl border border-gray-100 bg-white p-3 space-y-1.5">
      <div className={`flex items-center gap-2 rounded-lg border p-2 transition-colors duration-500 ${selected ? 'border-violet-400 bg-violet-50' : 'border-gray-100'}`}>
        <div className="relative h-4 w-6 shrink-0">
          <Image src="/logo-payments/wave_1.svg" alt="Wave" fill className="object-contain" sizes="24px" />
        </div>
        <span className="text-[9px] font-semibold text-gray-700 flex-1">Wave</span>
        {selected && <CheckCircle2 className="h-3 w-3 text-violet-600 shrink-0" />}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-gray-100 p-2 opacity-40">
        <div className="relative h-4 w-6 shrink-0">
          <Image src="/logo-payments/maxit.webp" alt="MaxIt" fill className="object-contain" sizes="24px" />
        </div>
        <span className="text-[9px] font-semibold text-gray-700">MaxIt</span>
      </div>
      <div className="text-center pt-1">
        <span
          className={`text-[8px] font-bold rounded-full px-2 py-1 transition-opacity duration-500 ${paid ? 'opacity-100 text-emerald-600 bg-emerald-50' : 'opacity-0'}`}
        >
          ✓ Payé instantanément
        </span>
      </div>
    </div>
  )
}

export function ReceptionIllustration() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setConfirmed(true), 400)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <div ref={ref} className="rounded-xl border border-gray-100 bg-emerald-50/60 p-3 text-center">
      <CheckCircle2
        className="mx-auto h-7 w-7 text-emerald-500 transition-all duration-500"
        style={{ transform: confirmed ? 'scale(1)' : 'scale(0)', opacity: confirmed ? 1 : 0 }}
      />
      <p className="text-[9px] font-bold text-emerald-700 mt-1 transition-opacity duration-500" style={{ opacity: confirmed ? 1 : 0, transitionDelay: '150ms' }}>
        Achat confirmé ✓
      </p>
      <div
        className="mt-2 rounded-lg bg-white border border-gray-100 py-1.5 flex items-center justify-center gap-1 transition-all duration-500"
        style={{ opacity: confirmed ? 1 : 0, transform: confirmed ? 'translateY(0)' : 'translateY(6px)', transitionDelay: '300ms' }}
      >
        <Download className="h-2.5 w-2.5 text-gray-600" />
        <span className="text-[8px] font-semibold text-gray-700">Télécharger mon fichier</span>
      </div>
    </div>
  )
}

export function AvisIllustration() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [stars, setStars] = useState(0)

  useEffect(() => {
    if (!inView) return
    const timers = [0, 1, 2, 3, 4].map(i => setTimeout(() => setStars(s => Math.max(s, i + 1)), 900 + i * 120))
    return () => timers.forEach(clearTimeout)
  }, [inView])

  return (
    <div ref={ref} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[7px] font-bold text-gray-400 shrink-0">Achat</span>
        <div className="flex-1 h-px bg-gray-200 relative overflow-hidden rounded-full">
          <div
            className="absolute inset-y-0 left-0 bg-violet-400 transition-all duration-700"
            style={{ width: inView ? '100%' : '0%' }}
          />
        </div>
        <span className="text-[7px] font-bold text-violet-600 shrink-0">J+3</span>
      </div>
      <p className="text-[8px] text-gray-600 mb-1.5">📩 Demande d&apos;avis envoyée automatiquement</p>
      <div className="flex gap-0.5 mb-1.5">
        {[0, 1, 2, 3, 4].map(i => (
          <Star key={i} className={`h-2.5 w-2.5 transition-colors duration-300 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
        ))}
      </div>
      <p className="text-[7px] text-gray-400 leading-snug">Ou envoie-la toi-même en 1 clic depuis la commande</p>
    </div>
  )
}
