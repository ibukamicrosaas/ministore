'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, Truck, Phone, CheckCircle2, Share2 } from 'lucide-react'

const SCREEN_DURATION = 3600
const PRIMARY = '#2E90FA'

export function OrderFlowPhoneMockup() {
  const [screen, setScreen] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setScreen(s => (s + 1) % 5), SCREEN_DURATION)
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
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: screen === i ? 18 : 6,
                  backgroundColor: screen === i ? PRIMARY : 'rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>

          {/* ── SCREEN 0 — Dashboard ── */}
          <Screen active={screen === 0}>
            <div className="pt-8 px-3.5">
              <p className="text-[8px] text-gray-400 mb-0.5">Aujourd&apos;hui</p>
              <p className="text-[11px] font-bold text-gray-900 mb-3">Bonsoir, Keur Mode Dakar</p>

              <div className="rounded-xl p-3 mb-2.5" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #175CD3 100%)` }}>
                <p className="text-[8px] text-white/70">Ventes — Aujourd&apos;hui · 4 ventes</p>
                <p className="text-lg font-black text-white">32 500 F</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="rounded-xl border border-gray-100 bg-white p-2.5">
                  <p className="text-[8px] text-gray-400">Produits actifs</p>
                  <p className="text-sm font-black text-gray-900">12</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-2.5">
                  <p className="text-[8px] text-gray-400">En attente</p>
                  <p className="text-sm font-black text-gray-900">1</p>
                </div>
              </div>

              <div className="rounded-xl p-2.5 mb-2.5" style={{ backgroundColor: '#EFF6FF' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Share2 className="h-3 w-3" style={{ color: PRIMARY }} />
                  <p className="text-[8px] font-bold text-gray-700">Lien de ta boutique</p>
                </div>
                <p className="text-[7px] text-gray-400 truncate">tekki.shop/keur-mode-dakar</p>
              </div>

              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Commandes en cours</p>
              <div className="rounded-lg border border-gray-100 bg-white p-2 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-semibold text-gray-800">Aïcha Ndiaye</p>
                  <p className="text-[7px] text-gray-400">2 articles</p>
                </div>
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600">Confirmée</span>
              </div>
            </div>
          </Screen>

          {/* ── SCREEN 1 — Détail commande ── */}
          <Screen active={screen === 1}>
            <div className="pt-8 px-3.5">
              <div className="flex items-center gap-2 mb-3">
                <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-[9px] text-gray-400">Commandes</p>
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-gray-900">Aïcha Ndiaye</p>
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600">Confirmée</span>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-2.5 mb-3">
                <div className="flex items-center justify-between">
                  {['1', '2', '3', '4', '5'].map((n, i) => (
                    <div key={n} className="flex flex-col items-center gap-1">
                      <div
                        className="h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold"
                        style={{ backgroundColor: i <= 1 ? PRIMARY : '#E4EAF2', color: i <= 1 ? '#fff' : '#9CA3AF' }}
                      >
                        {i === 0 ? '✓' : n}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full rounded-lg py-2 text-[9px] font-bold text-white mb-2" style={{ backgroundColor: PRIMARY }}>
                Marquer en préparation
              </button>
              <button className="w-full rounded-lg py-2 text-[9px] font-bold border border-gray-200 text-gray-500 mb-3">
                Envoyer au livreur
              </button>

              <div className="rounded-lg border border-gray-100 bg-white p-2.5">
                <p className="text-[8px] font-bold text-gray-700 mb-1.5">Articles commandés</p>
                <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                  <span>Robe wax bordeaux</span><span>14 000 F</span>
                </div>
                <div className="flex justify-between text-[8px] text-gray-500 mb-1.5">
                  <span>Sac raphia tissé</span><span>8 500 F</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-gray-900 pt-1.5 border-t border-gray-100">
                  <span>Total</span><span>22 500 F</span>
                </div>
              </div>
            </div>
          </Screen>

          {/* ── SCREEN 2 — Envoyer au livreur (modal) ── */}
          <Screen active={screen === 2}>
            <div className="pt-8 px-3.5 relative h-full">
              <div className="opacity-40">
                <div className="flex items-center gap-2 mb-3">
                  <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-[9px] text-gray-400">Commandes</p>
                </div>
                <p className="text-[11px] font-bold text-gray-900 mb-3">Aïcha Ndiaye</p>
              </div>

              {/* Modal */}
              <div className="absolute left-2.5 right-2.5 bottom-8 rounded-2xl bg-white shadow-2xl p-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Truck className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                  <p className="text-[9px] font-bold text-gray-900">Envoyer au livreur</p>
                </div>
                <div className="rounded-lg p-2.5 mb-2.5" style={{ backgroundColor: '#0B1B32' }}>
                  <p className="text-[7px] text-white/50 mb-1">APERÇU</p>
                  <p className="text-[8px] text-white font-semibold">🛵 Livraison à effectuer</p>
                  <p className="text-[7px] text-white/70 mt-1">Aïcha Ndiaye · Sacré-Cœur 3, Dakar</p>
                  <p className="text-[7px] text-white/70">2 articles · 22 500 F</p>
                </div>
                <div className="rounded-lg border border-gray-200 px-2.5 py-2 mb-2.5">
                  <p className="text-[7px] text-gray-400">Numéro WhatsApp du livreur</p>
                  <p className="text-[8px] text-gray-700 font-medium">+221 77 000 00 00</p>
                </div>
                <button className="w-full rounded-lg py-2 text-[9px] font-bold text-white bg-[#12B76A]">
                  Envoyer sur WhatsApp
                </button>
              </div>
            </div>
          </Screen>

          {/* ── SCREEN 3 — Fiche livreur ── */}
          <Screen active={screen === 3}>
            <div className="pt-8 px-3.5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-[#0B1B32] flex items-center justify-center text-white text-[9px] font-bold">K</div>
                <div>
                  <p className="text-[9px] font-bold text-gray-900">Keur Mode Dakar</p>
                  <p className="text-[7px] text-gray-400">Fiche de livraison</p>
                </div>
              </div>

              <div className="rounded-xl p-3 mb-2.5" style={{ backgroundColor: PRIMARY }}>
                <p className="text-[8px] text-white/70">🛵 À livrer</p>
                <p className="text-[11px] font-bold text-white">Aïcha Ndiaye</p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-2.5 mb-2">
                <p className="text-[7px] text-gray-400">Adresse</p>
                <p className="text-[9px] font-semibold text-gray-800 mb-1">Sacré-Cœur 3, Dakar</p>
                <p className="text-[7px] text-gray-400">Date</p>
                <p className="text-[9px] font-semibold text-gray-800">Aujourd&apos;hui</p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-2.5 mb-3 flex items-center justify-between">
                <p className="text-[9px] font-semibold text-gray-800">Aïcha Ndiaye</p>
                <div className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1">
                  <Phone className="h-2.5 w-2.5 text-gray-500" />
                  <span className="text-[7px] font-semibold text-gray-600">Appeler</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex flex-col items-center text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1.5" />
                <p className="text-[9px] font-bold text-emerald-700">Livraison confirmée !</p>
                <p className="text-[7px] text-emerald-600 mt-0.5">Le marchand a été notifié</p>
              </div>
            </div>
          </Screen>

          {/* ── SCREEN 4 — Dashboard mis à jour ── */}
          <Screen active={screen === 4}>
            <div className="pt-8 px-3.5">
              <p className="text-[8px] text-gray-400 mb-0.5">Aujourd&apos;hui</p>
              <p className="text-[11px] font-bold text-gray-900 mb-3">Bonsoir, Keur Mode Dakar</p>

              <div className="rounded-xl p-3 mb-2.5" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #175CD3 100%)` }}>
                <p className="text-[8px] text-white/70">Ventes — Aujourd&apos;hui · 5 ventes</p>
                <p className="text-lg font-black text-white">55 000 F</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="rounded-xl border border-gray-100 bg-white p-2.5">
                  <p className="text-[8px] text-gray-400">Produits actifs</p>
                  <p className="text-sm font-black text-gray-900">12</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-2.5">
                  <p className="text-[8px] text-gray-400">En attente</p>
                  <p className="text-sm font-black text-gray-900">0</p>
                </div>
              </div>

              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Dernières commandes</p>
              <div className="rounded-lg border border-gray-100 bg-white p-2 flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-[9px] font-semibold text-gray-800">Aïcha Ndiaye</p>
                  <p className="text-[7px] text-gray-400">22 500 F</p>
                </div>
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Livrée</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[8px] text-emerald-600 font-semibold">Boutique ouverte 24h/24</p>
              </div>
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
