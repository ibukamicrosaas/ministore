import crypto from 'crypto'
import { headers, cookies } from 'next/headers'

const GRAPH_API_VERSION = 'v21.0'

type MetaEventName =
  | 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
  | 'Lead' | 'CompleteRegistration'

interface SendMetaConversionEventInput {
  eventName: MetaEventName
  /** Doit être identique à l'eventID passé au pixel navigateur pour la déduplication. */
  eventId: string
  phone?: string
  externalId?: string
  customData?: Record<string, unknown>
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/**
 * Envoie un événement à l'API Conversions Meta (server-side), en complément
 * du pixel navigateur. Ne lance jamais d'exception — un échec d'envoi à Meta
 * ne doit jamais casser le flux applicatif (inscription, onboarding, etc.).
 */
export async function sendMetaConversionEvent(input: SendMetaConversionEventInput): Promise<void> {
  const pixelId     = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN
  if (!pixelId || !accessToken) return

  let userAgent: string | null = null
  let clientIp: string | null = null
  let eventSourceUrl: string | null = null
  let fbc: string | null = null
  let fbp: string | null = null

  try {
    const h = await headers()
    userAgent      = h.get('user-agent')
    clientIp       = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip')
    eventSourceUrl = h.get('referer')

    const c = await cookies()
    fbc = c.get('_fbc')?.value ?? null
    fbp = c.get('_fbp')?.value ?? null
  } catch {
    // headers()/cookies() indisponibles hors contexte requête — on continue sans
  }

  const userData: Record<string, unknown> = {}
  if (input.phone)      userData.ph          = [sha256(input.phone.replace(/\D/g, ''))]
  if (input.externalId) userData.external_id = [sha256(input.externalId)]
  if (clientIp)          userData.client_ip_address = clientIp
  if (userAgent)         userData.client_user_agent = userAgent
  if (fbc)               userData.fbc = fbc
  if (fbp)               userData.fbp = fbp

  const payload = {
    data: [{
      event_name: input.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      action_source: 'website',
      event_source_url: eventSourceUrl ?? process.env.NEXT_PUBLIC_APP_URL,
      user_data: userData,
      ...(input.customData ? { custom_data: input.customData } : {}),
    }],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    if (!res.ok) {
      console.error('[meta-capi]', res.status, await res.text())
    }
  } catch (err) {
    console.error('[meta-capi] network error', err)
  }
}

/** Identifiant partagé entre l'événement navigateur (pixel) et serveur (CAPI) pour la déduplication. */
export function generateMetaEventId(): string {
  return crypto.randomUUID()
}
