import * as Sentry from '@sentry/nextjs'
import crypto from 'crypto'

const BICTORYS_BASE_URL = process.env.BICTORYS_API_URL ?? 'https://api.bictorys.com/pay/v1'

export type BictorysPaymentType = 'wave_money' | 'orange_money' | 'maxit' | 'mtn_money' | 'moov' | 'mobicash' | 'togocell'
export type BictorysMethod = BictorysPaymentType
export type BictorysCountry = 'SN' | 'CI' | 'BK' | 'ML' | 'TG' | 'BJ'

export function normalizePhoneForBictorys(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[\s().\-]/g, '')

  let result: string
  if (cleaned.startsWith('+')) {
    result = cleaned
  } else if (cleaned.startsWith('00')) {
    result = `+${cleaned.slice(2)}`
  } else {
    result = `+${cleaned}`
  }

  // CI (+225) : les numéros locaux sont 10 chiffres (07xx, 05xx, 01xx).
  // Si on a seulement 9 chiffres après l'indicatif (zéro supprimé par erreur), on le réinsère.
  // Ex : +225701234567 (13 car.) → +2250701234567 (14 car.)
  if (result.startsWith('+225') && result.length === 13) {
    result = `+225${`0${result.slice(4)}`}`
  }

  return result
}

export function detectCountryFromPhone(phone: string): BictorysCountry | null {
  if (!phone) return null
  const normalized = normalizePhoneForBictorys(phone)
  if (normalized.startsWith('+221')) return 'SN'
  if (normalized.startsWith('+225')) return 'CI'
  if (normalized.startsWith('+226')) return 'BK'
  if (normalized.startsWith('+223')) return 'ML'
  if (normalized.startsWith('+228')) return 'TG'
  if (normalized.startsWith('+229')) return 'BJ'
  return null
}

export interface BictorysChargePayload {
  amount: number
  currency: string
  country: string
  paymentReference: string
  successRedirectUrl: string
  errorRedirectUrl: string
  webhookUrl?: string
  merchantReference?: string
  otp?: string
  orderDetails?: { name: string; price: number; quantity: number; taxRate: number }[]
  customerObject?: {
    name?: string
    phone?: string
    email?: string
    locale?: string
    country?: string
  }
}

export interface BictorysWebhookPayload {
  id: string
  status: 'succeed' | 'succeeded' | 'authorized' | 'failed' | 'pending' | 'processing' | 'cancelled'
  amount: number
  currency: string
  merchantReference?: string
  paymentReference?: string
  type?: string
  customerPhone?: string
  payerPhone?: string
  phone?: string
  customer?: { phone?: string }
  [key: string]: unknown
}

export async function createBictorysCharge(
  apiKey: string,
  payload: BictorysChargePayload,
  paymentType?: BictorysPaymentType,
): Promise<{ checkoutUrl?: string; transactionId: string; message?: string }> {
  const url = paymentType
    ? `${BICTORYS_BASE_URL}/charges?payment_type=${paymentType}`
    : `${BICTORYS_BASE_URL}/charges`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  let res: Response
  try {
    console.log('[createBictorysCharge] 📤 Envoi à Bictorys:', { url, webhookUrl: payload.webhookUrl, merchantReference: payload.merchantReference })
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    const isAbort = (err as Error).name === 'AbortError'
    const wrapped = isAbort ? new Error('Bictorys: délai dépassé (10s)') : (err as Error)
    Sentry.captureException(wrapped, { extra: { merchantReference: payload.merchantReference } })
    throw wrapped
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Bictorys error ${res.status}: ${text}`)
    Sentry.captureException(err, { extra: { status: res.status, merchantReference: payload.merchantReference } })
    throw err
  }

  const json = await res.json() as Record<string, unknown>

  console.log('[createBictorysCharge] 📥 Réponse Bictorys:', JSON.stringify(json, null, 2))

  // Wave → 'link' (deep link direct), autres → 'redirectUrl' si dispo
  // MoMo push (Orange Money SN/BK, MTN Money CI) → 'message' sans URL
  const checkoutUrl = (json.link ?? json.url ?? json.confirmationLink ?? json.redirectUrl) as string | undefined
  const message = (json.message as string | undefined) || undefined

  const transactionId = (
    json.chargeId ??
    json.charge_id ??
    json.id ??
    json.transactionId ??
    json.transaction_id ??
    json.paymentId ??
    json.payment_id
  ) as string | undefined

  // Échec total : aucune URL, aucun message, aucun transactionId
  if (!checkoutUrl && !message && !transactionId) {
    throw new Error(`Bictorys: réponse invalide: ${JSON.stringify(json)}`)
  }

  if (!transactionId) {
    console.warn('[createBictorysCharge] ⚠️ Pas d\'ID de transaction dans la réponse Bictorys:', json)
  }

  console.log('[createBictorysCharge] ✅ Succès:', {
    checkoutUrl: checkoutUrl ? checkoutUrl.slice(0, 50) + '...' : '(aucune)',
    transactionId,
    message: message ? message.slice(0, 60) : '(aucun)',
  })
  return { checkoutUrl, transactionId: transactionId ?? '', message }
}

export async function getBictorysCharge(
  apiKey: string,
  chargeId: string,
): Promise<BictorysWebhookPayload> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  let res: Response
  try {
    res = await fetch(`${BICTORYS_BASE_URL}/charges/${encodeURIComponent(chargeId)}`, {
      headers: { 'X-Api-Key': apiKey },
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    if ((err as Error).name === 'AbortError') throw new Error('Bictorys: délai dépassé (10s)')
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new Error(`Bictorys error ${res.status}`)
  return res.json() as Promise<BictorysWebhookPayload>
}

// Format de l'API Bictorys Payout
export interface BictorysPayoutPayload {
  amount: number
  currency: string
  country: string
  customerObject: {
    name: string
    phone: string
    country?: string
    locale?: string
  }
  paymentReason?: string
  merchantReference?: string
  merchant?: { secretCode: string }  // optionnel — non requis par l'API
}

export type BictorysPayoutPaymentType = 'wave_money' | 'orange_money' | 'mtn_money' | 'moov' | 'togocell' | 'mobicash' | 'maxit'

export async function createBictorysPayout(
  privateKey: string,  // BICTORYS_PRIVATE_KEY — la clé publique retourne 401 sur les payouts
  payload: BictorysPayoutPayload,
  paymentType: BictorysPayoutPaymentType,
  // idempotencyKey : toute la protection contre le double virement en
  // dépend — un rejeu (même payoutId) doit produire le même effet chez
  // Bictorys qu'un seul appel. Ce comportement n'est PAS confirmé côté
  // Bictorys (honoré sur les transferts sortants ? pendant combien de
  // temps ? que renvoie l'API si la clé est réutilisée après succès ?).
  // Tant que ce n'est pas vérifié auprès de Bictorys, les statuts
  // 'processing'/'uncertain' ci-dessous sont la seule protection réelle.
  idempotencyKey: string,
  // uncertain=true : on n'a reçu aucune réponse exploitable de Bictorys —
  // timeout/erreur réseau (aucune réponse) ou réponse HTTP illisible
  // (page WAF/proxy, pas du JSON de l'application Bictorys). Dans les deux
  // cas, le virement a pu partir malgré tout — l'appelant ne doit pas le
  // traiter comme un refus définitif.
): Promise<{ success: boolean; transactionId?: string; error?: string; uncertain?: boolean }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(`${BICTORYS_BASE_URL}/payouts?payment_type=${encodeURIComponent(paymentType)}`, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'accept':          'application/json',
        'X-API-Key':       privateKey,
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const rawText = await res.text()
    let json: Record<string, unknown> = {}
    let parsedJson = false
    try { json = JSON.parse(rawText) as Record<string, unknown>; parsedJson = true } catch { /* HTML WAF response */ }

    if (res.ok || res.status === 201) {
      return {
        success:       true,
        transactionId: (json.id ?? json.transactionId) as string | undefined,
      }
    }

    if (!parsedJson) {
      // Réponse HTTP reçue, mais pas du JSON exploitable — probablement une
      // page WAF/proxy plutôt qu'une réponse de l'application Bictorys. On
      // ne sait pas si la demande a été vue par Bictorys, donc pas si le
      // virement a pu partir : à traiter comme incertain, pas comme un refus.
      return { success: false, uncertain: true, error: `Bictorys payout ${res.status}: réponse illisible — ${rawText.slice(0, 200)}` }
    }

    // Réponse JSON reçue de l'application Bictorys (même en erreur) = refus
    // explicite, pas une incertitude sur ce qui s'est passé côté prestataire.
    return { success: false, error: `Bictorys payout ${res.status}: ${rawText}` }
  } catch (err) {
    // Aucune réponse reçue (timeout 30s ou erreur réseau) : on ne sait pas
    // si Bictorys a traité le virement avant que la connexion ne tombe.
    return { success: false, uncertain: true, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  } finally {
    clearTimeout(timeout)
  }
}

export function verifyBictorysSignature(headerSecret: string, envSecret: string): boolean {
  try {
    const bufA = Buffer.from(headerSecret)
    const bufB = Buffer.from(envSecret)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export type PaymentMethodInfo = {
  type: BictorysPaymentType
  label: string
  requiresOtp: boolean
  description?: string
}

export function getPaymentMethodsByCountry(country: BictorysCountry): PaymentMethodInfo[] {
  const methods: Record<BictorysCountry, PaymentMethodInfo[]> = {
    SN: [
      { type: 'wave_money',   label: 'Wave',          requiresOtp: false, description: 'Paiement instantané via Wave' },
      { type: 'maxit',        label: 'MaxIt',         requiresOtp: false, description: 'Paiement direct depuis votre téléphone' },
    ],
    CI: [
      { type: 'wave_money',   label: 'Wave',          requiresOtp: false, description: 'Paiement instantané via Wave' },
      { type: 'orange_money', label: 'Orange Money',  requiresOtp: true,  description: 'Tapez #144*82# puis entrez le code OTP' },
      { type: 'mtn_money',    label: 'MTN Money',     requiresOtp: false, description: 'Paiement push sur votre téléphone' },
      { type: 'moov',          label: 'Moov Money',    requiresOtp: false, description: 'Paiement push sur votre téléphone' },
    ],
    BK: [
      { type: 'wave_money',   label: 'Wave',          requiresOtp: false, description: 'Paiement instantané via Wave' },
      { type: 'orange_money', label: 'Orange Money',  requiresOtp: true,  description: 'Via code OTP (*144*4*6*montant#)' },
      { type: 'moov',         label: 'Moov Money',    requiresOtp: false, description: 'Paiement push sur votre téléphone' },
    ],
    ML: [
      { type: 'orange_money', label: 'Orange Money',  requiresOtp: false, description: 'Paiement push sur votre téléphone' },
      { type: 'mobicash',     label: 'Mobicash',      requiresOtp: false, description: 'Paiement push sur votre téléphone' },
    ],
    TG: [
      { type: 'moov',         label: 'Flooz',    requiresOtp: false, description: 'Flooz (Moov Togo) — push sur votre téléphone' },
      { type: 'togocell',     label: 'T-Money',  requiresOtp: false, description: 'T-Money (Togocel) — push sur votre téléphone' },
    ],
    BJ: [
      { type: 'mtn_money',    label: 'MTN Money',     requiresOtp: false, description: 'Paiement push sur votre téléphone' },
      { type: 'moov',         label: 'Moov Money',    requiresOtp: false, description: 'Paiement push sur votre téléphone' },
    ],
  }
  return methods[country] ?? []
}

export function needsOtpForPayment(country: BictorysCountry, paymentType: BictorysPaymentType): boolean {
  return paymentType === 'orange_money' && (country === 'CI' || country === 'BK')
}

export function getOtpInstruction(country: BictorysCountry, amount?: number): string {
  if (country === 'BK') {
    const code = amount ? `*144*4*6*${amount}#` : '*144*4*6*[montant]#'
    return `Composez ${code} sur votre téléphone Orange Money pour générer votre code OTP.`
  }
  // CI
  return 'Composez #144*82# sur votre téléphone Orange Money pour recevoir votre code OTP.'
}
