import crypto from 'crypto'

const BICTORYS_BASE_URL = process.env.BICTORYS_API_URL ?? 'https://api.bictorys.com/pay/v1'

export type BictorysPaymentType = 'wave_money' | 'orange_money' | 'maxit'
export type BictorysMethod = BictorysPaymentType

export interface BictorysChargePayload {
  amount: number
  currency: string
  paymentReference: string
  successRedirectUrl: string
  errorRedirectUrl: string
  webhookUrl?: string
  merchantReference?: string
  orderDetails?: { name: string; price: number; quantity: number; taxRate: number }[]
  customerObject?: {
    name?: string
    phone?: string
    email?: string
    locale?: string
  }
}

export interface BictorysWebhookPayload {
  id: string
  status: 'succeed' | 'failed' | 'pending'
  amount: number
  currency: string
  merchantReference?: string
}

export async function createBictorysCharge(
  apiKey: string,
  payload: BictorysChargePayload,
  paymentType?: BictorysPaymentType,
): Promise<{ checkoutUrl: string; transactionId: string }> {
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
    if ((err as Error).name === 'AbortError') throw new Error('Bictorys: délai dépassé (10s)')
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bictorys error ${res.status}: ${text}`)
  }

  const json = await res.json() as Record<string, unknown>

  console.log('[createBictorysCharge] 📥 Réponse Bictorys:', JSON.stringify(json, null, 2))

  // L'API Bictorys retourne 'link' (CheckoutLinkObject), 'url', ou 'confirmationLink'
  const checkoutUrl = (json.link ?? json.url ?? json.confirmationLink) as string | undefined
  const transactionId = (json.chargeId ?? json.id ?? json.transactionId) as string | undefined

  if (!checkoutUrl) {
    throw new Error(`Bictorys: pas d'URL dans la réponse: ${JSON.stringify(json)}`)
  }

  console.log('[createBictorysCharge] ✅ Succès:', { checkoutUrl: checkoutUrl?.slice(0, 50) + '...', transactionId })
  return { checkoutUrl, transactionId: transactionId ?? '' }
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

export interface BictorysPayoutPayload {
  amount: number
  currency: string
  paymentReference: string
  recipientPhone: string
  recipientName?: string
  description?: string
}

export async function createBictorysPayout(
  apiKey: string,
  payload: BictorysPayoutPayload,
  paymentType: 'wave_money' | 'orange_money',
  idempotencyKey: string,
): Promise<{ transactionId: string; status: string }> {
  const res = await fetch(`${BICTORYS_BASE_URL}/payouts?payment_type=${paymentType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bictorys payout error ${res.status}: ${text}`)
  }

  const json = await res.json() as Record<string, unknown>
  return {
    transactionId: (json.transactionId ?? json.id ?? '') as string,
    status: (json.status ?? 'pending') as string,
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
