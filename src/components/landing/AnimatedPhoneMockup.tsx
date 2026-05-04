'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ChevronLeft, ShoppingBag } from 'lucide-react'

const SCREEN_DURATION = 3200
const PRIMARY = '#0EA5E9'

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

          {/* ── SCREEN 0 — Catalogue ── */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              opacity: screen === 0 ? 1 : 0,
              transform: screen === 0 ? 'translateY(0)' : 'translateY(-16px)',
              pointerEvents: screen === 0 ? 'auto' : 'none',
            }}
          >
            {/* Header boutique */}
            <div style={{ backgroundColor: PRIMARY }} className="px-3.5 pb-4 pt-8">
              <div className="flex items-center gap-2.5 mt-1">
                <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">K</div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-tight">Keur Cuisine Dakar</p>
                  <p className="text-[9px] text-white/60 mt-0.5">Livraison lun–sam · Dakar</p>
                </div>
              </div>
            </div>

            <div className="px-3 pt-3.5 space-y-2">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nos produits</p>

              {/* Produit 1 — tappable */}
              <div
                className="relative flex items-center gap-2 rounded-xl border bg-white p-2.5 transition-all duration-200"
                style={{
                  borderColor: tapping ? PRIMARY : 'rgba(0,0,0,0.08)',
                  boxShadow: tapping ? `0 0 0 2px ${PRIMARY}33` : undefined,
                  transform: tapping ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 text-base">🍱</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-900">Thiéboudienne spécial</p>
                  <p className="text-[9px] text-gray-400">3 500 FCFA · Riz au poisson</p>
                </div>
                <span className="text-gray-300 text-xs">›</span>
                {tapping && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 animate-ping opacity-60" style={{ borderColor: PRIMARY }} />
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-black/8 bg-white p-2.5">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 text-base">🥗</div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-900">Salade composée</p>
                  <p className="text-[9px] text-gray-400">2 000 FCFA</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-black/8 bg-white p-2.5">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 text-base">🧃</div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-900">Jus de bissap</p>
                  <p className="text-[9px] text-gray-400">800 FCFA · 1 litre</p>
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
                  <p className="text-[10px] font-bold text-gray-900">Thiéboudienne spécial</p>
                  <p className="text-[9px] font-semibold" style={{ color: PRIMARY }}>3 500 FCFA</p>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-black/8 p-2.5 mb-3 flex items-center gap-2">
                <div className="h-12 w-12 rounded-lg bg-sky-50 flex items-center justify-center text-xl shrink-0">🍱</div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-gray-900">Thiéboudienne spécial</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">Riz au poisson avec légumes</p>
                  <p className="text-[10px] font-bold mt-1" style={{ color: PRIMARY }}>3 500 FCFA</p>
                </div>
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Votre commande</p>
              <div className="space-y-1.5 mb-3">
                <input readOnly value="Fatou Diallo" className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-[9px] text-gray-700" />
                <input readOnly value="+221 77 123 45 67" className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-[9px] text-gray-700" />
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Date de livraison</p>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {['Lundi 5', 'Mardi 6', 'Merc. 7'].map(d => (
                  <div
                    key={d}
                    className="rounded-lg py-1.5 text-center text-[8px] font-semibold border"
                    style={{
                      backgroundColor: d === 'Lundi 5' ? PRIMARY : 'white',
                      borderColor: d === 'Lundi 5' ? PRIMARY : 'rgba(0,0,0,0.1)',
                      color: d === 'Lundi 5' ? 'white' : '#374151',
                    }}
                  >{d}</div>
                ))}
              </div>

              <div className="rounded-xl py-2.5 text-center" style={{ backgroundColor: PRIMARY }}>
                <p className="text-[10px] font-bold text-white">Commander — 3 500 FCFA</p>
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
                  <p className="text-[9px] text-gray-400">Produit</p>
                  <p className="text-[9px] font-semibold text-gray-900">Thiéboudienne spécial</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-gray-400">Livraison</p>
                  <p className="text-[9px] font-semibold text-gray-900">Lundi 5 mai</p>
                </div>
                <div className="h-px bg-black/5" />
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-bold text-gray-900">Total</p>
                  <p className="text-[10px] font-bold" style={{ color: PRIMARY }}>3 500 FCFA</p>
                </div>
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Payer via</p>
              <div className="space-y-1.5 mb-3">
                {/* Wave — sélectionné */}
                <div
                  className="flex items-center gap-2.5 rounded-xl border p-2.5"
                  style={{ borderColor: '#1AB1ED', backgroundColor: '#1AB1ED12' }}
                >
                  <div className="h-7 w-7 rounded-lg overflow-hidden bg-[#1AB1ED] flex items-center justify-center shrink-0 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-payments/wave_1.svg" alt="Wave" className="h-full w-full object-contain" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-900 flex-1">Wave</p>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-[#1AB1ED] flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-[#1AB1ED]" />
                  </div>
                </div>
                {/* Orange Money */}
                <div
                  className="flex items-center gap-2.5 rounded-xl border p-2.5"
                  style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'white' }}
                >
                  <div className="h-7 w-7 rounded-lg overflow-hidden bg-[#FF6600] flex items-center justify-center shrink-0 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-payments/om_1.svg" alt="Orange Money" className="h-full w-full object-contain" />
                  </div>
                  <p className="text-[9px] font-semibold text-gray-500 flex-1">Orange Money</p>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-200" />
                </div>
              </div>

              <div className="rounded-xl py-2.5 text-center flex items-center justify-center gap-1.5" style={{ backgroundColor: '#1AB1ED' }}>
                <div className="h-4 w-4 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-payments/wave_1.svg" alt="Wave" className="h-full w-full object-contain brightness-0 invert" />
                </div>
                <p className="text-[10px] font-bold text-white">Payer 3 500 FCFA par Wave</p>
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
              <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <p className="mt-3 text-[11px] font-bold text-gray-900">Commande confirmée !</p>
              <div className="mt-3 w-full rounded-xl border border-black/8 bg-white p-3 space-y-1.5">
                <div className="flex justify-between">
                  <p className="text-[9px] text-gray-400">Produit</p>
                  <p className="text-[9px] font-semibold text-gray-900">Thiéboudienne spécial</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] text-gray-400">Livraison</p>
                  <p className="text-[9px] font-semibold text-gray-900">Lundi 5 mai</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] text-gray-400">Paiement</p>
                  <p className="text-[9px] font-semibold text-green-600">Wave ✓</p>
                </div>
              </div>

              {/* WhatsApp notif */}
              <div className="mt-3 w-full rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 p-2.5 flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-900">Keur Cuisine Dakar</p>
                  <p className="text-[8px] text-gray-500 mt-0.5 leading-relaxed">
                    Commande reçue ✓ Livraison lundi. Merci Fatou ! 🍱
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
          {['Parcourir le catalogue', 'Passer commande', 'Payer par Wave', 'Confirmation WhatsApp'][screen]}
        </p>
      </div>
    </div>
  )
}
