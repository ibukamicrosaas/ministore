'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, ChevronLeft, Scissors } from 'lucide-react'

const SCREEN_DURATION = 3200

export function AnimatedPhoneMockup() {
  const [screen, setScreen] = useState(0)
  const [tapping, setTapping] = useState(false)

  useEffect(() => {
    // Tap animation just before leaving screen 0
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
    <div className="relative shrink-0" style={{ width: 240 }}>
      {/* Frame téléphone */}
      <div
        className="relative rounded-[38px] bg-[#1A0A00] shadow-2xl"
        style={{ padding: '10px', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 60px -10px rgba(0,0,0,0.4)' }}
      >
        <div className="absolute -right-[3px] top-24 w-[3px] h-10 rounded-r-sm bg-[#2a2a2a]" />
        <div className="absolute -left-[3px] top-20 w-[3px] h-7 rounded-l-sm bg-[#2a2a2a]" />
        <div className="absolute -left-[3px] top-32 w-[3px] h-7 rounded-l-sm bg-[#2a2a2a]" />

        {/* Écran */}
        <div className="relative rounded-[30px] overflow-hidden bg-[#FAF7F2]" style={{ height: 460 }}>
          {/* Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-14 h-4 rounded-full bg-[#1A0A00]" />

          {/* Step indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: screen === i ? 20 : 6,
                  backgroundColor: screen === i ? '#E85D04' : 'rgba(26,10,0,0.2)',
                }}
              />
            ))}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[#1A0A00]/15 z-20" />

          {/* ── SCREEN 0 — Services ── */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              opacity: screen === 0 ? 1 : 0,
              transform: screen === 0 ? 'translateY(0)' : screen < 0 ? 'translateY(16px)' : 'translateY(-16px)',
              pointerEvents: screen === 0 ? 'auto' : 'none',
            }}
          >
            {/* Header salon */}
            <div className="bg-[#E85D04] px-3.5 pb-4 pt-8">
              <div className="flex items-center gap-2.5 mt-1">
                <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">K</div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-tight">Keur Beauté Dakar</p>
                  <p className="text-[9px] text-white/60 flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />Ouvert jusqu&apos;à 19h00
                  </p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="px-3 pt-3.5 space-y-2">
              <p className="text-[9px] font-bold text-[#1A0A00]/40 uppercase tracking-wider">Nos prestations</p>

              {/* Service 1 — tappable */}
              <div
                className="relative flex items-center gap-2 rounded-xl border bg-white p-2.5 transition-all duration-200"
                style={{
                  borderColor: tapping ? '#E85D04' : 'rgba(26,10,0,0.08)',
                  boxShadow: tapping ? '0 0 0 2px rgba(232,93,4,0.2)' : undefined,
                  transform: tapping ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Scissors className="h-3.5 w-3.5 text-[#E85D04]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#1A0A00]">Tresses box braids</p>
                  <p className="text-[9px] text-[#1A0A00]/40">3h · 15 000 FCFA</p>
                </div>
                <span className="text-[#1A0A00]/20 text-xs">›</span>
                {tapping && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-[#E85D04] animate-ping opacity-60" />
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#1A0A00]/8 bg-white p-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Scissors className="h-3.5 w-3.5 text-[#E85D04]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#1A0A00]">Défrisage</p>
                  <p className="text-[9px] text-[#1A0A00]/40">1h30 · 8 000 FCFA</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#1A0A00]/8 bg-white p-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Scissors className="h-3.5 w-3.5 text-[#E85D04]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#1A0A00]">Tissage brésilien</p>
                  <p className="text-[9px] text-[#1A0A00]/40">2h · 12 000 FCFA</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── SCREEN 1 — Date & heure ── */}
          <div
            className="absolute inset-0 bg-[#FAF7F2] transition-all duration-500"
            style={{
              opacity: screen === 1 ? 1 : 0,
              transform: screen === 1 ? 'translateY(0)' : screen < 1 ? 'translateY(16px)' : 'translateY(-16px)',
              pointerEvents: 'none',
            }}
          >
            <div className="pt-8 px-3.5">
              <div className="flex items-center gap-2 mb-3">
                <ChevronLeft className="h-4 w-4 text-[#1A0A00]/40" />
                <div>
                  <p className="text-[10px] font-bold text-[#1A0A00]">Tresses box braids</p>
                  <p className="text-[9px] text-[#E85D04] font-semibold">15 000 FCFA · 3h</p>
                </div>
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#1A0A00]/40 mb-2">Choisissez une date</p>

              {/* Mini calendar */}
              <div className="rounded-xl border border-[#1A0A00]/8 bg-white p-2.5 mb-3">
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {['L','M','M','J','V','S','D'].map((d, i) => (
                    <p key={i} className="text-[8px] text-[#1A0A00]/30 font-medium pb-1">{d}</p>
                  ))}
                  {[21,22,23,24,25,26,27].map((d) => (
                    <div
                      key={d}
                      className="text-[9px] py-0.5 rounded-full text-center font-medium transition-colors"
                      style={{
                        backgroundColor: d === 25 ? '#E85D04' : 'transparent',
                        color: d === 25 ? 'white' : d === 21 || d === 22 ? 'rgba(26,10,0,0.2)' : '#1A0A00',
                      }}
                    >{d}</div>
                  ))}
                </div>
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#1A0A00]/40 mb-2">Choisissez un créneau</p>
              <div className="grid grid-cols-3 gap-1.5">
                {['09:00','10:30','11:00','13:00','14:30','16:00'].map((t) => (
                  <div
                    key={t}
                    className="rounded-lg py-1.5 text-center text-[9px] font-semibold border transition-colors"
                    style={{
                      backgroundColor: t === '11:00' ? '#E85D04' : 'white',
                      borderColor: t === '11:00' ? '#E85D04' : 'rgba(26,10,0,0.1)',
                      color: t === '11:00' ? 'white' : '#1A0A00',
                    }}
                  >{t}</div>
                ))}
              </div>

              <div className="mt-3 rounded-xl bg-[#E85D04] py-2.5 text-center">
                <p className="text-[10px] font-bold text-white">Continuer →</p>
              </div>
            </div>
          </div>

          {/* ── SCREEN 2 — Paiement ── */}
          <div
            className="absolute inset-0 bg-[#FAF7F2] transition-all duration-500"
            style={{
              opacity: screen === 2 ? 1 : 0,
              transform: screen === 2 ? 'translateY(0)' : screen < 2 ? 'translateY(16px)' : 'translateY(-16px)',
              pointerEvents: 'none',
            }}
          >
            <div className="pt-8 px-3.5">
              <div className="flex items-center gap-2 mb-4">
                <ChevronLeft className="h-4 w-4 text-[#1A0A00]/40" />
                <p className="text-[10px] font-bold text-[#1A0A00]">Paiement de l&apos;acompte</p>
              </div>

              {/* Récap */}
              <div className="rounded-xl border border-[#1A0A00]/8 bg-white p-3 mb-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-[#1A0A00]/40">Prestation</p>
                  <p className="text-[9px] font-semibold text-[#1A0A00]">Tresses box braids</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-[#1A0A00]/40">Date</p>
                  <p className="text-[9px] font-semibold text-[#1A0A00]">Mer 25 avr · 11h00</p>
                </div>
                <div className="h-px bg-[#1A0A00]/5" />
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-bold text-[#1A0A00]">Acompte (50%)</p>
                  <p className="text-[10px] font-bold text-[#E85D04]">7 500 FCFA</p>
                </div>
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#1A0A00]/40 mb-2">Payer via</p>
              <div className="space-y-1.5 mb-3">
                {[
                  { name: 'Wave', color: '#1AB1ED', active: true },
                  { name: 'Orange Money', color: '#FF6600', active: false },
                ].map(m => (
                  <div
                    key={m.name}
                    className="flex items-center gap-2 rounded-xl border p-2.5"
                    style={{
                      borderColor: m.active ? m.color : 'rgba(26,10,0,0.1)',
                      backgroundColor: m.active ? `${m.color}10` : 'white',
                    }}
                  >
                    <div className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[8px] font-black shrink-0"
                      style={{ backgroundColor: m.color }}>
                      {m.name === 'Wave' ? 'W~' : 'OM'}
                    </div>
                    <p className="text-[9px] font-semibold text-[#1A0A00]">{m.name}</p>
                    {m.active && <div className="ml-auto h-3 w-3 rounded-full border-2 border-[#1AB1ED] bg-[#1AB1ED]" />}
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-[#1AB1ED] py-2.5 text-center">
                <p className="text-[10px] font-bold text-white">Payer 7 500 FCFA par Wave</p>
              </div>
            </div>
          </div>

          {/* ── SCREEN 3 — Confirmation ── */}
          <div
            className="absolute inset-0 bg-[#FAF7F2] transition-all duration-500"
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
              <p className="mt-3 text-[11px] font-bold text-[#1A0A00]">Réservation confirmée !</p>
              <div className="mt-3 w-full rounded-xl border border-[#1A0A00]/8 bg-white p-3 space-y-1.5">
                <div className="flex justify-between">
                  <p className="text-[9px] text-[#1A0A00]/40">Prestation</p>
                  <p className="text-[9px] font-semibold text-[#1A0A00]">Tresses box braids</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] text-[#1A0A00]/40">Date</p>
                  <p className="text-[9px] font-semibold text-[#1A0A00]">Mer 25 avr · 11h00</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] text-[#1A0A00]/40">Acompte payé</p>
                  <p className="text-[9px] font-semibold text-green-600">7 500 FCFA ✓</p>
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
                  <p className="text-[9px] font-bold text-[#1A0A00]">Keur Beauté Dakar</p>
                  <p className="text-[8px] text-[#1A0A00]/60 mt-0.5 leading-relaxed">
                    Votre RDV est confirmé ✓ Acompte Wave reçu. À mercredi ! 💆‍♀️
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Label étape */}
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-[#1A0A00]/40 font-medium">
          {['Choisir une prestation', 'Sélectionner un créneau', 'Payer l\'acompte', 'Confirmation WhatsApp'][screen]}
        </p>
      </div>
    </div>
  )
}
