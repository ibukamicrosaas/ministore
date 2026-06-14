'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ChevronLeft, Star } from 'lucide-react'

const SCREEN_DURATION = 3400
const PRIMARY = '#0EA5E9'

// Icône vérification bleue (style Instagram)
function VerifiedMini() {
  return (
    <svg viewBox="0 0 14 14" className="h-3 w-3 shrink-0" fill="none">
      <circle cx="7" cy="7" r="7" fill="#1D9BF0" />
      <path d="M5.5 10L2.5 7l.88-.88 2.12 2.12 5-5L11.4 4 5.5 10Z" fill="white" />
    </svg>
  )
}

export function AnimatedPhoneMockup() {
  const [screen, setScreen] = useState(0)
  const [tapping, setTapping] = useState(false)

  useEffect(() => {
    const tapTimer = setTimeout(() => {
      if (screen === 0) setTapping(true)
    }, SCREEN_DURATION - 800)

    const nextTimer = setTimeout(() => {
      setTapping(false)
      setScreen(s => (s + 1) % 4)
    }, SCREEN_DURATION)

    return () => {
      clearTimeout(tapTimer)
      clearTimeout(nextTimer)
    }
  }, [screen])

  return (
    <div className="relative shrink-0" style={{ width: 280 }}>
      <div
        className="relative rounded-[44px] bg-[#0A1628]"
        style={{ padding: '11px', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 60px -10px rgba(0,0,0,0.4)' }}
      >
        {/* Boutons physiques */}
        <div className="absolute -right-[3px] top-24 w-[3px] h-12 rounded-r-sm bg-[#1a1a1a]" />
        <div className="absolute -left-[3px] top-20 w-[3px] h-8 rounded-l-sm bg-[#1a1a1a]" />
        <div className="absolute -left-[3px] top-36 w-[3px] h-8 rounded-l-sm bg-[#1a1a1a]" />

        <div className="relative rounded-[34px] overflow-hidden bg-gray-50" style={{ height: 537 }}>
          {/* Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-14 h-4 rounded-full bg-[#0A1628]" />

          {/* Step dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: screen === i ? 20 : 6,
                  backgroundColor: screen === i ? PRIMARY : 'rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-black/10 z-20" />

          {/* ── SCREEN 0 — Boutique Pro ── */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              opacity: screen === 0 ? 1 : 0,
              transform: screen === 0 ? 'translateY(0)' : 'translateY(-16px)',
              pointerEvents: screen === 0 ? 'auto' : 'none',
            }}
          >
            {/* Cover image (simulée par un gradient) */}
            <div
              className="w-full relative"
              style={{
                height: 72,
                background: `linear-gradient(135deg, ${PRIMARY} 0%, #38BDF8 60%, #0369A1 100%)`,
              }}
            >
              {/* Pattern subtil */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}
              />
              <div className="absolute top-2 right-3 text-white/20 text-2xl font-black select-none" style={{ fontFamily: 'serif' }}>
                K
              </div>
            </div>

            {/* Avatar en overlap */}
            <div className="absolute left-3" style={{ top: 50 }}>
              <div
                className="h-11 w-11 rounded-xl border-2 border-white shadow-md flex items-center justify-center font-bold text-sm text-white"
                style={{ backgroundColor: PRIMARY }}
              >
                K
              </div>
            </div>

            {/* Infos boutique */}
            <div className="px-3 pt-2" style={{ marginTop: 18 }}>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-bold text-gray-900 leading-tight">Keur Aminata Couture</p>
                <VerifiedMini />
              </div>
              <p className="text-[8px] text-gray-400 mt-0.5">Mode & Wax · Dakar, Sénégal</p>

              {/* Badges */}
              <div className="flex gap-1 mt-1.5">
                {['Livraison rapide', 'Made in Sénégal'].map(b => (
                  <span key={b} className="text-[7px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-1.5 py-0.5">{b}</span>
                ))}
              </div>
            </div>

            {/* Section Coups de cœur */}
            <div className="px-3 mt-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Star className="h-3 w-3 shrink-0" style={{ color: PRIMARY }} />
                <p className="text-[8px] font-bold uppercase tracking-wider text-gray-500">Coups de cœur</p>
              </div>
              {/* Card featured horizontale */}
              <div
                className="rounded-xl border bg-white p-2 flex items-center gap-2 mb-2.5 transition-all duration-200"
                style={{
                  borderColor: tapping ? PRIMARY : 'rgba(0,0,0,0.08)',
                  boxShadow: tapping ? `0 0 0 2px ${PRIMARY}33` : undefined,
                  transform: tapping ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                <div className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)' }}>
                  👗
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-gray-900 truncate">Robe wax bordeaux « Léna »</p>
                  <p className="text-[8px] font-bold mt-0.5" style={{ color: PRIMARY }}>22 500 FCFA</p>
                </div>
                <span className="text-gray-300 text-xs shrink-0">›</span>
                {tapping && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 animate-ping opacity-60" style={{ borderColor: PRIMARY }} />
                )}
              </div>
            </div>

            {/* Autres produits */}
            <div className="px-3 space-y-1.5">
              <div className="flex items-center gap-2 rounded-xl border border-black/8 bg-white p-2">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 text-sm">👒</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-gray-900 truncate">Ensemble 2 pièces beige</p>
                  <p className="text-[8px] text-gray-400">35 000 FCFA</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-black/8 bg-white p-2">
                <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 text-sm">🛍️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-gray-900 truncate">Sac raphia tissé artisanal</p>
                  <p className="text-[8px] text-gray-400">8 500 FCFA</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── SCREEN 1 — Commande ── */}
          <div
            className="absolute inset-0 bg-gray-50 transition-all duration-500"
            style={{
              opacity: screen === 1 ? 1 : 0,
              transform: screen === 1 ? 'translateY(0)' : screen < 1 ? 'translateY(16px)' : 'translateY(-16px)',
              pointerEvents: 'none',
            }}
          >
            <div className="pt-8 px-3.5">
              <div className="flex items-center gap-2 mb-3">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-[10px] font-bold text-gray-900">Robe wax bordeaux « Léna »</p>
                  <p className="text-[9px] font-bold" style={{ color: PRIMARY }}>22 500 FCFA</p>
                </div>
              </div>

              {/* Aperçu produit */}
              <div className="rounded-xl bg-white border border-black/8 p-2.5 mb-3 flex items-center gap-2.5">
                <div className="h-12 w-12 rounded-lg shrink-0 flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)' }}>
                  👗
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-gray-900">Robe wax bordeaux « Léna »</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">Taille M · Couleur bordeaux</p>
                  <p className="text-[10px] font-bold mt-1" style={{ color: PRIMARY }}>22 500 FCFA</p>
                </div>
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Vos coordonnées</p>
              <div className="space-y-1.5 mb-3">
                <input readOnly value="Mariama Kouyaté" className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-[9px] text-gray-700" />
                <input readOnly value="+221 77 456 78 90" className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-[9px] text-gray-700" />
                <input readOnly value="Plateau, Dakar" className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-[9px] text-gray-400" />
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Date de livraison</p>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {['Sam 14', 'Lun 16', 'Mar 17'].map((d, i) => (
                  <div
                    key={d}
                    className="rounded-lg py-1.5 text-center text-[8px] font-semibold border"
                    style={{
                      backgroundColor: i === 0 ? PRIMARY : 'white',
                      borderColor: i === 0 ? PRIMARY : 'rgba(0,0,0,0.1)',
                      color: i === 0 ? 'white' : '#374151',
                    }}
                  >{d}</div>
                ))}
              </div>

              <div className="rounded-xl py-2.5 text-center" style={{ backgroundColor: PRIMARY }}>
                <p className="text-[10px] font-bold text-white">Commander — 22 500 FCFA</p>
              </div>
            </div>
          </div>

          {/* ── SCREEN 2 — Paiement ── */}
          <div
            className="absolute inset-0 bg-gray-50 transition-all duration-500"
            style={{
              opacity: screen === 2 ? 1 : 0,
              transform: screen === 2 ? 'translateY(0)' : screen < 2 ? 'translateY(16px)' : 'translateY(-16px)',
              pointerEvents: 'none',
            }}
          >
            <div className="pt-8 px-3.5">
              <div className="flex items-center gap-2 mb-4">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-900">Paiement en ligne</p>
              </div>

              <div className="rounded-xl border border-black/8 bg-white p-3 mb-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-gray-400">Article</p>
                  <p className="text-[9px] font-semibold text-gray-900">Robe wax « Léna »</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-gray-400">Livraison</p>
                  <p className="text-[9px] font-semibold text-gray-900">Sam 14 juin</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-gray-400">Client</p>
                  <p className="text-[9px] font-semibold text-gray-900">Mariama K.</p>
                </div>
                <div className="h-px bg-black/5" />
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-bold text-gray-900">Total</p>
                  <p className="text-[10px] font-bold" style={{ color: PRIMARY }}>22 500 FCFA</p>
                </div>
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Payer via</p>
              <div className="space-y-1.5 mb-3">
                {/* Wave */}
                <div className="flex items-center gap-2.5 rounded-xl border p-2.5"
                  style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'white' }}>
                  <div className="h-7 w-7 rounded-lg overflow-hidden bg-[#1AB1ED] flex items-center justify-center shrink-0 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-payments/wave_1.svg" alt="Wave" className="h-full w-full object-contain" />
                  </div>
                  <p className="text-[9px] font-semibold text-gray-400 flex-1">Wave</p>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-200" />
                </div>
                {/* Orange Money — sélectionné */}
                <div className="flex items-center gap-2.5 rounded-xl border p-2.5"
                  style={{ borderColor: '#FF6600', backgroundColor: '#FF660010' }}>
                  <div className="h-7 w-7 rounded-lg overflow-hidden bg-[#FF6600] flex items-center justify-center shrink-0 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-payments/om_1.svg" alt="Orange Money" className="h-full w-full object-contain" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-900 flex-1">Orange Money</p>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-[#FF6600] flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-[#FF6600]" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl py-2.5 text-center flex items-center justify-center gap-1.5"
                style={{ backgroundColor: '#FF6600' }}>
                <div className="h-4 w-4 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-payments/om_1.svg" alt="Orange Money" className="h-full w-full object-contain brightness-0 invert" />
                </div>
                <p className="text-[10px] font-bold text-white">Payer 22 500 FCFA par Orange Money</p>
              </div>
            </div>
          </div>

          {/* ── SCREEN 3 — Confirmation ── */}
          <div
            className="absolute inset-0 bg-gray-50 transition-all duration-500"
            style={{
              opacity: screen === 3 ? 1 : 0,
              transform: screen === 3 ? 'translateY(0)' : screen < 3 ? 'translateY(16px)' : 'translateY(-16px)',
              pointerEvents: 'none',
            }}
          >
            <div className="pt-8 flex flex-col items-center px-3.5">
              <div className="mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="mt-2.5 text-[12px] font-bold text-gray-900">Commande confirmée !</p>
              <p className="text-[9px] text-gray-400 mt-0.5 font-mono tracking-wide">REF #KA-72F9</p>

              <div className="mt-3 w-full rounded-xl border border-black/8 bg-white p-3 space-y-1.5">
                <div className="flex justify-between">
                  <p className="text-[9px] text-gray-400">Article</p>
                  <p className="text-[9px] font-semibold text-gray-900">Robe wax « Léna »</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] text-gray-400">Livraison</p>
                  <p className="text-[9px] font-semibold text-gray-900">Sam 14 juin · Dakar</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] text-gray-400">Paiement</p>
                  <p className="text-[9px] font-semibold text-orange-600">Orange Money ✓</p>
                </div>
                <div className="h-px bg-black/5 my-0.5" />
                <div className="flex justify-between">
                  <p className="text-[9px] font-bold text-gray-900">Total payé</p>
                  <p className="text-[10px] font-bold text-green-600">22 500 FCFA</p>
                </div>
              </div>

              {/* SMS marchand */}
              <div className="mt-2.5 w-full rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 p-2.5 flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-900">Keur Aminata Couture</p>
                  <p className="text-[8px] text-gray-500 mt-0.5 leading-relaxed">
                    Mariama, ta robe est réservée ! Livraison sam 14 juin. Merci pour ta confiance
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Label étape */}
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-gray-400 font-medium">
          {[
            'Boutique Pro — Coups de cœur',
            'Passer commande',
            'Payer par Orange Money',
            'Confirmation & récap WhatsApp',
          ][screen]}
        </p>
      </div>
    </div>
  )
}
