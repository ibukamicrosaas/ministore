'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, Share2, Star, CheckCircle2, Download } from 'lucide-react'

const SCREEN_DURATION = 3800
const VIOLET = '#7A5AF8'

export function DigitalProductPhoneMockup() {
  const [screen, setScreen] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setScreen(s => (s + 1) % 4), SCREEN_DURATION)
    return () => clearTimeout(timer)
  }, [screen])

  return (
    <div className="relative shrink-0" style={{ width: 300 }}>
      <div
        className="relative rounded-[48px] bg-[#0A1628]"
        style={{ padding: '12px', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.08), 0 40px 80px -15px rgba(0,0,0,0.5), 0 15px 30px -10px rgba(0,0,0,0.35)' }}
      >
        <div className="absolute -right-[3px] top-24 w-[3px] h-12 rounded-r-sm bg-[#1a1a1a]" />
        <div className="absolute -left-[3px] top-20 w-[3px] h-8 rounded-l-sm bg-[#1a1a1a]" />
        <div className="absolute -left-[3px] top-32 w-[3px] h-8 rounded-l-sm bg-[#1a1a1a]" />

        <div className="relative rounded-[38px] overflow-hidden bg-gray-50" style={{ height: 574 }}>
          {/* Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-[88px] h-[22px] rounded-full bg-[#0A1628]" />

          {/* Step dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: screen === i ? 18 : 6,
                  backgroundColor: screen === i ? VIOLET : 'rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>

          {/* ── SCREEN 0 — Fiche produit ── */}
          <Screen active={screen === 0}>
            <div className="pt-8 px-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
                <Share2 className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div
                className="rounded-xl h-28 flex items-center justify-center text-3xl mb-2.5"
                style={{ background: 'linear-gradient(135deg, #F4F1FF 0%, #E5DEFF 100%)' }}
              >
                📘
              </div>
              <div className="flex gap-1.5 mb-2.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`h-7 w-7 rounded-lg bg-violet-50 border ${i === 0 ? 'border-violet-400' : 'border-gray-100'}`} />
                ))}
              </div>
              <p className="text-[10px] font-bold text-gray-900 mb-1">Guide business Afrique 2026 (ebook)</p>
              <div className="flex items-center gap-1 mb-1.5">
                <Download className="h-2.5 w-2.5 text-violet-600 shrink-0" />
                <p className="text-[8px] text-gray-500">Téléchargement numérique · 2,7 Mo</p>
              </div>
              <p className="text-[8px] text-amber-600 font-semibold mb-1.5">🔥 7 personnes ont déjà commandé</p>
              <div className="flex items-baseline gap-1.5 mb-2">
                <p className="text-base font-black text-violet-700">4 500 FCFA</p>
                <p className="text-[9px] text-gray-300 line-through">7 500 FCFA</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                {['120 pages', 'Format PDF', 'Mise à jour 2026', 'Accès immédiat'].map(b => (
                  <span key={b} className="text-[7px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2 py-1 text-center">✓ {b}</span>
                ))}
              </div>
              <button className="w-full rounded-lg py-2.5 text-[10px] font-bold text-white mb-2" style={{ backgroundColor: '#0B1B32' }}>
                Acheter
              </button>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[7px] text-gray-400">Paiement accepté :</span>
                <div className="relative h-3 w-5"><Image src="/logo-payments/wave_1.svg" alt="Wave" fill className="object-contain" sizes="20px" /></div>
                <div className="relative h-3 w-5"><Image src="/logo-payments/maxit.webp" alt="MaxIt" fill className="object-contain" sizes="20px" /></div>
              </div>
            </div>
          </Screen>

          {/* ── SCREEN 1 — Paiement ── */}
          <Screen active={screen === 1}>
            <div className="pt-14 px-4 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-xl mb-3">📘</div>
              <p className="text-[11px] font-bold text-gray-900 mb-1">Comment voulez-vous payer ?</p>
              <p className="text-[8px] text-gray-400 mb-3">Paiement chez Coach Aminata</p>
              <div className="rounded-full px-4 py-2 text-white text-[11px] font-bold mb-4" style={{ backgroundColor: '#0B1B32' }}>
                4 500 FCFA
              </div>
              <div className="w-full rounded-xl border border-gray-200 p-2.5 flex items-center gap-2.5 mb-2">
                <div className="relative h-7 w-7 rounded-lg bg-sky-50 shrink-0 p-1.5"><Image src="/logo-payments/wave_1.svg" alt="Wave" fill className="object-contain p-1" sizes="28px" /></div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-gray-800">Wave</p>
                  <p className="text-[7px] text-gray-400">Paiement instantané</p>
                </div>
              </div>
              <div className="w-full rounded-xl border border-gray-200 p-2.5 flex items-center gap-2.5 mb-4">
                <div className="relative h-7 w-7 rounded-lg bg-orange-50 shrink-0 p-1.5"><Image src="/logo-payments/maxit.webp" alt="MaxIt" fill className="object-contain p-1" sizes="28px" /></div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-gray-800">MaxIt</p>
                  <p className="text-[7px] text-gray-400">Paiement instantané</p>
                </div>
              </div>
              <button className="w-full rounded-lg py-2.5 text-[10px] font-bold text-white mb-2" style={{ backgroundColor: VIOLET }}>
                Payer 4 500 FCFA
              </button>
              <p className="text-[7px] text-gray-400">Vos données sont sécurisées par Bictorys</p>
            </div>
          </Screen>

          {/* ── SCREEN 2 — Achat confirmé ── */}
          <Screen active={screen === 2}>
            <div className="pt-10 px-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-[11px] font-bold text-gray-900">Achat confirmé ✓</p>
              <p className="text-[8px] text-gray-400 mb-2 max-w-[200px]">Votre paiement a été reçu. Téléchargez votre fichier ci-dessous.</p>
              <p className="text-[7px] text-gray-400 bg-gray-50 rounded-full px-2 py-1 mb-3">Référence #0B8132A9</p>

              <div className="w-full rounded-xl bg-violet-50 border border-violet-100 p-3 mb-3 text-left">
                <p className="text-[7px] font-bold text-violet-700 uppercase tracking-wide mb-1">Téléchargement numérique</p>
                <p className="text-[9px] font-semibold text-gray-800">guide-business-afrique.pdf</p>
                <p className="text-[7px] text-gray-400 mb-2">2,7 Mo · Expire dans 48h · 5 téléchargements restants</p>
                <div className="flex items-center justify-center gap-1.5 rounded-lg py-2" style={{ backgroundColor: '#0B1B32' }}>
                  <Download className="h-3 w-3 text-white" />
                  <span className="text-[9px] font-bold text-white">Télécharger</span>
                </div>
              </div>

              <div className="w-full rounded-lg border border-gray-100 p-2.5 text-left mb-2">
                <div className="flex justify-between text-[8px] text-gray-500">
                  <span>Guide business Afrique 2026</span><span>4 500 FCFA</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-gray-900 pt-1.5 mt-1.5 border-t border-gray-100">
                  <span>Total</span><span>4 500 FCFA</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[8px] text-emerald-600 font-semibold">4 365 FCFA reçus sur Wave</p>
              </div>
            </div>
          </Screen>

          {/* ── SCREEN 3 — Avis ── */}
          <Screen active={screen === 3}>
            <div className="pt-10 px-4">
              <p className="text-[11px] font-bold text-gray-900 mb-1">Bonjour Fatou 👋</p>
              <p className="text-[8px] text-gray-400 mb-3">Ton avis aide les autres clients à choisir.</p>
              <div className="rounded-xl border border-gray-100 p-3 mb-3">
                <p className="text-[9px] font-semibold text-gray-800 mb-2">Guide business Afrique 2026</p>
                <div className="flex gap-1 mb-2.5">
                  {[0, 1, 2, 3, 4].map(i => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                  <p className="text-[7px] text-gray-400">« Reçu en 2 minutes, super guide ! »</p>
                </div>
              </div>
              <button className="w-full rounded-lg py-2.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#0B1B32' }}>
                Publier mon avis
              </button>
            </div>
          </Screen>
        </div>
      </div>
    </div>
  )
}

function Screen({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 bg-gray-50 transition-all duration-500"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(-10px)',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  )
}
