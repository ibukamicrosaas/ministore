'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useInView } from '@/hooks/useInView'
import type { StepsConfig } from '@/data/country-configs'

const DEFAULT_CONFIG: StepsConfig = {
  boutiqueName:  'Keur Mode Dakar',
  phone:         '+221 77 000 00 00',
  slug:          'keur-mode',
  pay1:          { method: 'Wave',  logo: '/logo-payments/wave_1.svg', color: 'text-blue-600'  },
  pay2:          { method: 'MaxIt', logo: '/logo-payments/maxit.webp', color: 'text-orange-500' },
  step4PayText:  'Wave, Orange Money, ou à la livraison.',
  step4Bullets:  ['Wave, Orange Money, Maxit', 'Paiement à la livraison possible', 'Tu vois tout dans ton tableau de bord'],
}

export function StepsSection({ config: cfg = DEFAULT_CONFIG }: { config?: StepsConfig } = {}) {

  return (
    <section id="comment" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)' }}>
      <style>{`
        @keyframes tekki-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">C&apos;est simple</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 mb-4"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Ça marche en 4 étapes
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-lg">
            Pas besoin d&apos;un développeur. Pas besoin d&apos;un ordinateur.
          </p>
        </div>

        <div className="space-y-12 lg:space-y-20">
          {/* Étape 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 lg:order-1 order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white text-sm font-black shadow-lg shadow-sky-200">01</div>
                <div className="h-px flex-1 bg-gradient-to-r from-sky-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Crée ta boutique
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Tu donnes le nom de ton business, tu ajoutes tes produits avec description, photo et prix. Ta boutique est en ligne. <strong className="text-gray-700">Ça prend 5 minutes.</strong>
              </p>
              <ul className="space-y-2">
                {['Nom + logo de ta boutique', 'Photos et prix de tes produits', 'Couleur aux couleurs de ton business'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 lg:order-2 order-1 w-full max-w-xs lg:max-w-sm">
              <Step1Illustration boutiqueName={cfg.boutiqueName} phone={cfg.phone} />
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
              <Step2Illustration />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white text-sm font-black shadow-lg shadow-violet-200">02</div>
                <div className="h-px flex-1 bg-gradient-to-r from-violet-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Ta boutique est déjà en ligne
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Dès ton premier produit publié, tes clients peuvent voir ta boutique et passer commande. Tes 3 premières commandes sont offertes — <strong className="text-gray-700">tu ne payes rien pour commencer.</strong>
              </p>
              <ul className="space-y-2">
                {['Publiée automatiquement, sans étape supplémentaire', 'Tes 3 premières commandes sont offertes', 'Ton lien unique est prêt à partager'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 lg:order-1 order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white text-sm font-black shadow-lg shadow-amber-200">03</div>
                <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Partage ton lien
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Tu envoies ton lien à tes clients, et tu l&apos;ajoutes sur WhatsApp, Instagram ou Facebook. <strong className="text-gray-700">Tes clients cliquent et commandent directement.</strong>
              </p>
              <ul className="space-y-2">
                {['Copie-colle ton lien sur WhatsApp', 'Partage sur Instagram ou Facebook', 'Tes clients commandent sans appli'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 lg:order-2 order-1 w-full max-w-xs lg:max-w-sm">
              <Step3Illustration slug={cfg.slug} />
            </div>
          </div>

          {/* Étape 4 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
              <Step4Illustration pay1={cfg.pay1} pay2={cfg.pay2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-200">04</div>
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                Reçois tes paiements
              </h3>
              <p className="text-gray-500 leading-relaxed mb-5">
                Tes clients paient par {cfg.step4PayText} <strong className="text-gray-700">L&apos;argent arrive directement sur ton téléphone. C&apos;est automatique.</strong>
              </p>
              <ul className="space-y-2">
                {cfg.step4Bullets.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Illustrations animées ── */

function Step1Illustration({ boutiqueName, phone }: { boutiqueName: string; phone: string }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!inView) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setTyped(boutiqueName.slice(0, i))
      if (i >= boutiqueName.length) clearInterval(interval)
    }, 70)
    return () => clearInterval(interval)
  }, [inView, boutiqueName])

  return (
    <div ref={ref} className="relative rounded-3xl overflow-hidden shadow-xl shadow-sky-100 border border-sky-100">
      <div className="bg-gradient-to-br from-sky-50 to-white p-6">
        {/* Header mockup */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-red-300" />
          <div className="h-2 w-2 rounded-full bg-yellow-300" />
          <div className="h-2 w-2 rounded-full bg-green-300" />
          <div className="flex-1 mx-2 h-5 rounded-md bg-sky-100/80 flex items-center px-2">
            <span className="text-[9px] text-sky-400 font-medium">tekki.shop/mon-business</span>
          </div>
        </div>
        {/* Form mockup */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Crée ta boutique</p>
          <div className="space-y-2.5">
            <div>
              <p className="text-[9px] text-gray-400 mb-1">Nom de ta boutique</p>
              <div className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 flex items-center gap-2 min-h-[30px]">
                <span className="text-[11px] font-semibold text-gray-800">{typed}</span>
                <span className="ml-auto h-3.5 w-0.5 bg-sky-500 animate-pulse shrink-0" />
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 mb-1">Ton WhatsApp</p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-[11px] text-gray-600">{phone}</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 mb-1">Couleur de ta boutique</p>
              <div className="flex gap-1.5">
                {['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'].map((c, i) => (
                  <div key={i} className={`h-5 w-5 rounded-full ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-sky-500' : ''}`} />
                ))}
              </div>
            </div>
            <button className="w-full rounded-xl bg-sky-500 py-2 text-[11px] font-bold text-white shadow-sm">
              Créer ma boutique →
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <p className="text-[10px] text-emerald-600 font-semibold">Prend moins de 5 minutes</p>
        </div>
      </div>
    </div>
  )
}

const STEP2_PRODUCTS = [
  { name: 'Robe wax bleue', price: '12 000', stock: 8 },
  { name: 'Sac bandoulière', price: '8 500', stock: 3 },
  { name: 'Chaussures sandales', price: '6 000', stock: 0 },
]

function Step2Illustration() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [online, setOnline] = useState(false)
  const [active, setActive] = useState([false, false, false])

  useEffect(() => {
    if (!inView) return
    const timers = [
      setTimeout(() => setActive([true, false, false]), 500),
      setTimeout(() => setActive([true, true, false]), 1000),
      setTimeout(() => setOnline(true), 1500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [inView])

  return (
    <div ref={ref} className="relative rounded-3xl overflow-hidden shadow-xl shadow-violet-100 border border-violet-100">
      <div className="bg-gradient-to-br from-violet-50 to-white p-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-gray-800">Mon tableau de bord</p>
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
              <span className={`text-[9px] font-semibold transition-colors duration-300 ${online ? 'text-emerald-600' : 'text-gray-400'}`}>
                {online ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
          {/* Products list */}
          {STEP2_PRODUCTS.map((p, i) => (
            <div key={p.name} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm shrink-0">🛍️</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-800 truncate">{p.name}</p>
                <p className="text-[9px] text-gray-400">{p.price} FCFA · stock: {p.stock}</p>
              </div>
              <div className={`h-4 w-7 rounded-full relative shrink-0 transition-colors duration-300 ${active[i] ? 'bg-emerald-400' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-300 ${active[i] ? 'left-3.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
          <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 p-2.5 text-center">
            <p className="text-[10px] font-bold text-violet-700">✅ Ta boutique est visible par tes clients</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step3Illustration({ slug }: { slug: string }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView) return
    const timers = [500, 1300, 2100].map((delay, i) => setTimeout(() => setStep(i + 1), delay))
    return () => timers.forEach(clearTimeout)
  }, [inView])

  return (
    <div ref={ref} className="relative rounded-3xl overflow-hidden shadow-xl shadow-amber-100 border border-amber-100">
      <div className="bg-gradient-to-br from-amber-50 to-white p-6">
        {/* WhatsApp mockup */}
        <div className="bg-[#111b21] rounded-2xl overflow-hidden">
          <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-white">M</div>
            <div>
              <p className="text-white text-[10px] font-semibold">Ma boutique</p>
              <p className={`text-[8px] transition-colors duration-300 ${step > 0 ? 'text-emerald-400' : 'text-white/40'}`}>
                {step > 0 ? 'en ligne' : 'hors ligne'}
              </p>
            </div>
          </div>
          <div className="p-3 space-y-2 min-h-[150px]">
            {step >= 1 && (
              <div className="max-w-[85%] rounded-tl-lg rounded-tr-lg rounded-br-lg bg-[#202c33] p-2.5" style={{ animation: 'tekki-msg-in .35s ease-out' }}>
                <p className="text-white/80 text-[10px]">Bonsoir ! C&apos;est quoi ton lien pour commander ?</p>
                <p className="text-white/30 text-[8px] text-right mt-1">18:32</p>
              </div>
            )}
            {step >= 2 && (
              <div className="max-w-[85%] ml-auto rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-[#005c4b] p-2.5" style={{ animation: 'tekki-msg-in .35s ease-out' }}>
                <p className="text-white text-[10px]">Voilà ma boutique 👇</p>
                <div className="mt-1.5 rounded-md bg-[#025C4C] p-2 border border-white/10">
                  <p className="text-amber-300 text-[9px] font-bold">🛍️ tekki.shop/{slug}</p>
                  <p className="text-white/60 text-[8px]">Commande directement ici !</p>
                </div>
                <p className="text-white/30 text-[8px] text-right mt-1">18:33 ✓✓</p>
              </div>
            )}
            {step >= 3 && (
              <div className="max-w-[85%] rounded-tl-lg rounded-tr-lg rounded-br-lg bg-[#202c33] p-2.5" style={{ animation: 'tekki-msg-in .35s ease-out' }}>
                <p className="text-white/80 text-[10px]">Waaaw c&apos;est beau ! Je commande tout de suite 😍</p>
                <p className="text-white/30 text-[8px] text-right mt-1">18:35</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="text-sm">📲</span>
          <p className="text-[10px] text-gray-500 font-medium">Partage sur WhatsApp, Insta, Facebook</p>
        </div>
      </div>
    </div>
  )
}

function useCountUp(target: number, inView: boolean, duration = 1300) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start: number | null = null
    let raf: number
    function tick(ts: number) {
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.round(target * progress))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration])

  return value
}

function Step4Illustration({ pay1, pay2 }: { pay1: StepsConfig['pay1']; pay2: StepsConfig['pay2'] }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const today = useCountUp(47500, inView, 1300)
  const month = useCountUp(312000, inView, 1700)
  const amount1 = useCountUp(12000, inView, 1100)
  const amount2 = useCountUp(8500, inView, 1100)
  const amount3 = useCountUp(15000, inView, 1100)

  const payments = [
    { method: pay1.method, logo: pay1.logo, amount: amount1, time: 'Il y a 5 min', color: pay1.color },
    { method: pay2.method, logo: pay2.logo, amount: amount2, time: 'Il y a 23 min', color: pay2.color },
    { method: pay1.method, logo: pay1.logo, amount: amount3, time: 'Il y a 1h', color: pay1.color },
  ]

  return (
    <div ref={ref} className="relative rounded-3xl overflow-hidden shadow-xl shadow-emerald-100 border border-emerald-100">
      <div className="bg-gradient-to-br from-emerald-50 to-white p-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Tes revenus</p>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-100">
              <p className="text-[9px] text-emerald-600 font-medium">Aujourd&apos;hui</p>
              <p className="text-base font-black text-emerald-700">{today.toLocaleString('fr-FR')}</p>
              <p className="text-[8px] text-emerald-500">FCFA reçus</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-2.5 border border-sky-100">
              <p className="text-[9px] text-sky-600 font-medium">Ce mois</p>
              <p className="text-base font-black text-sky-700">{month.toLocaleString('fr-FR')}</p>
              <p className="text-[8px] text-sky-500">FCFA reçus</p>
            </div>
          </div>
          {/* Payments */}
          <div className="space-y-1.5">
            {payments.map((t, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="relative h-4 w-6 shrink-0">
                  <Image src={t.logo} alt={t.method} fill className="object-contain" sizes="24px" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-600">{t.method}</p>
                  <p className="text-[8px] text-gray-400">{t.time}</p>
                </div>
                <p className={`text-[11px] font-bold ${t.color}`}>+{t.amount.toLocaleString('fr-FR')} FCFA</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[10px] text-emerald-600 font-semibold">L&apos;argent arrive sur ton téléphone</p>
        </div>
      </div>
    </div>
  )
}
