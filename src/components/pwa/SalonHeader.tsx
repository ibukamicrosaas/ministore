import type { Salon } from '@/types'
import { MapPin, Clock, MessageCircle } from 'lucide-react'
import type { OpeningHours } from '@/types'

interface SalonHeaderProps {
  salon: Salon
}

function getTodayStatus(openingHours: OpeningHours): { isOpen: boolean; label: string } {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  const today = days[new Date().getDay()]
  const todayHours = openingHours[today]

  if (!todayHours || todayHours.closed) {
    return { isOpen: false, label: 'Fermé aujourd\'hui' }
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  if (currentTime >= todayHours.open && currentTime < todayHours.close) {
    return { isOpen: true, label: `Ouvert jusqu'à ${todayHours.close}` }
  }

  if (currentTime < todayHours.open) {
    return { isOpen: false, label: `Ouvre à ${todayHours.open}` }
  }

  return { isOpen: false, label: `Fermé (rouvre demain)` }
}

export function SalonHeader({ salon }: SalonHeaderProps) {
  const openingHours = salon.opening_hours as OpeningHours
  const { isOpen, label } = getTodayStatus(openingHours)

  const whatsappUrl = salon.phone_whatsapp
    ? `https://wa.me/${salon.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${salon.name}, j'aimerais avoir des informations.`)}`
    : null

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 80%, black) 100%)` }}
    >
      <div className="px-4 pt-12 pb-6">
        {/* Logo + nom */}
        <div className="flex items-start gap-4 mb-4">
          {salon.logo_url ? (
            <img
              src={salon.logo_url}
              alt={salon.name}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-white/30 shrink-0"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white text-2xl font-bold shrink-0">
              {salon.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 pt-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{salon.name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {salon.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-white/70 shrink-0" />
                  <span className="text-sm text-white/70">{salon.city}</span>
                </div>
              )}
              {salon.address && (
                <span className="text-sm text-white/60 truncate">{salon.address}</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {salon.description && (
          <p className="text-sm text-white/80 mb-4 leading-relaxed">{salon.description}</p>
        )}

        {/* Statut + WhatsApp */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full shrink-0 ${isOpen ? 'bg-green-400' : 'bg-white/40'}`} />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-white/70 shrink-0" />
              <span className={`text-sm font-medium ${isOpen ? 'text-green-300' : 'text-white/60'}`}>
                {label}
              </span>
            </div>
          </div>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors shrink-0"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Contacter
            </a>
          )}
        </div>
      </div>

      {/* Décorations */}
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-4 right-4 h-20 w-20 rounded-full bg-white/5" />
    </div>
  )
}
