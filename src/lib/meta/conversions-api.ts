import crypto from 'crypto'
import { headers, cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptApiKey } from '@/lib/crypto/encrypt'
import { APP_URL } from '@/constants'

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
  /** Pixel/jeton du MARCHAND — sinon repli sur le pixel/jeton plateforme (funnel inscription). */
  pixelId?: string
  accessToken?: string
  /**
   * URL de la page où l'événement a eu lieu — à fournir explicitement pour
   * tout appel serveur-à-serveur (le `referer` de la requête HTTP en cours
   * est celui de l'appelant du webhook, pas celui du client, cf. plus bas).
   * Sinon lu depuis le `referer` (contexte navigateur) ou, en dernier
   * recours, `NEXT_PUBLIC_APP_URL` (repli générique, jamais l'URL réelle de
   * la page pour un appel serveur — à éviter en fournissant ce champ).
   */
  eventSourceUrl?: string
  /**
   * fbp/fbc fournis explicitement (contexte webhook, sans cookie navigateur
   * disponible) — dès que la clé est présente (même à `null`), la fonction
   * n'essaie plus de lire les cookies pour ce champ. Absent (clé omise) =
   * comportement historique, lu depuis les cookies de la requête en cours.
   */
  fbp?: string | null
  fbc?: string | null
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/**
 * Envoie un événement à l'API Conversions Meta (server-side), en complément
 * du pixel navigateur. Ne lance jamais d'exception — un échec d'envoi à Meta
 * ne doit jamais casser le flux applicatif (inscription, onboarding, paiement).
 *
 * Retourne `true` seulement si Meta a confirmé avoir reçu l'événement
 * (`events_received >= 1`), jamais sur simple absence d'exception — un
 * appelant qui doit savoir si l'envoi a réellement abouti (ex. garde
 * anti-doublon avant d'écrire une trace en base) doit se fier à ce retour,
 * pas seulement au fait que la fonction n'a pas levé.
 */
export async function sendMetaConversionEvent(input: SendMetaConversionEventInput): Promise<boolean> {
  const pixelId     = input.pixelId     ?? process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = input.accessToken ?? process.env.META_CONVERSIONS_API_TOKEN
  if (!pixelId || !accessToken) return false

  // Appel serveur-à-serveur (webhook) dès que pixel/jeton sont fournis explicitement —
  // les headers/cookies de la requête HTTP en cours sont alors ceux de l'appelant du
  // webhook (Bictorys/Stripe), pas ceux du navigateur du client : inutile et trompeur
  // de les lire pour l'attribution (user-agent, IP, referer).
  const isServerToServer = input.pixelId !== undefined || input.accessToken !== undefined

  let userAgent: string | null = null
  let clientIp: string | null = null
  let eventSourceUrl: string | null = input.eventSourceUrl ?? null
  let fbc: string | null = input.fbc !== undefined ? input.fbc : null
  let fbp: string | null = input.fbp !== undefined ? input.fbp : null

  try {
    if (!isServerToServer) {
      const h = await headers()
      userAgent      = h.get('user-agent')
      clientIp       = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip')
      eventSourceUrl = eventSourceUrl ?? h.get('referer')
    }

    if (input.fbc === undefined || input.fbp === undefined) {
      const c = await cookies()
      if (input.fbc === undefined) fbc = c.get('_fbc')?.value ?? null
      if (input.fbp === undefined) fbp = c.get('_fbp')?.value ?? null
    }
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
    const res  = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const body = await res.json().catch(() => null) as { events_received?: number } | null

    if (!res.ok || !body || typeof body.events_received !== 'number' || body.events_received < 1) {
      console.error('[meta-capi]', res.status, body)
      return false
    }
    return true
  } catch (err) {
    console.error('[meta-capi] network error', err)
    return false
  }
}

/** Identifiant partagé entre l'événement navigateur (pixel) et serveur (CAPI) pour la déduplication. */
export function generateMetaEventId(): string {
  return crypto.randomUUID()
}

interface PurchaseCapiOrder {
  id: string
  shop_id: string
  /** Montant réellement encaissé sur CETTE transaction (acompte ou total selon le cas) — jamais total_price brut. */
  amountCharged: number
  fbp: string | null
  fbc: string | null
  meta_purchase_event_id: string | null
  shops: { meta_pixel_id: string | null; meta_capi_configured: boolean; currency: string | null; slug: string } | null
}

/**
 * Envoie l'événement Purchase server-side vers le pixel Conversions API du
 * MARCHAND (pas le pixel plateforme), depuis un webhook de paiement confirmé
 * (Bictorys/Stripe). Ne lance jamais d'exception — un échec ici ne doit
 * jamais faire échouer la confirmation de la commande elle-même.
 *
 * `event_id` déterministe (`purchase_{order.id}`), recalculé indépendamment
 * ici et côté pixel navigateur (PixelPurchase.tsx) pour la déduplication
 * Meta — voir REPRISE.md §130/migration 105_meta_purchase_capi.sql.
 */
export async function sendPurchaseCapiEvent(admin: SupabaseClient, order: PurchaseCapiOrder): Promise<void> {
  try {
    if (order.meta_purchase_event_id) return
    if (!order.shops?.meta_capi_configured || !order.shops.meta_pixel_id) return

    const { data: secrets } = await admin
      .from('shop_payment_secrets')
      .select('meta_conversions_api_token')
      .eq('shop_id', order.shop_id)
      .single()

    const storedToken = (secrets as { meta_conversions_api_token: string | null } | null)?.meta_conversions_api_token
    if (!storedToken) return

    let accessToken: string
    try {
      accessToken = decryptApiKey(storedToken)
    } catch (err) {
      console.error('[meta-capi] decrypt failed', order.shop_id, err)
      return
    }

    const eventId = `purchase_${order.id}`
    // URL réelle de la page où l'achat a eu lieu — jamais NEXT_PUBLIC_APP_URL
    // seul (repli générique de sendMetaConversionEvent) : ce serait le domaine
    // plateforme TEKKIShop, pas celui de la boutique du marchand, incohérent
    // avec le domaine enregistré sur son Pixel Meta.
    const eventSourceUrl = `${APP_URL}/${order.shops.slug}/commander/success?order_id=${order.id}`

    const sent = await sendMetaConversionEvent({
      eventName:   'Purchase',
      eventId,
      pixelId:     order.shops.meta_pixel_id,
      accessToken,
      fbp:         order.fbp,
      fbc:         order.fbc,
      eventSourceUrl,
      customData: {
        value:    order.amountCharged,
        currency: order.shops.currency ?? 'XOF',
        order_id: order.id,
      },
    })

    if (sent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('orders') as any)
        .update({ meta_purchase_event_id: eventId })
        .eq('id', order.id)
    }
  } catch (err) {
    console.error('[meta-capi] sendPurchaseCapiEvent failed', order.id, err)
  }
}
