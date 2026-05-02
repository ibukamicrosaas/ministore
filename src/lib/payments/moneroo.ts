const MONEROO_BASE_URL = 'https://api.moneroo.io/v1'

export interface MonerooInitPayload {
  amount: number
  currency: string
  description: string
  customer: {
    email?: string
    first_name: string
    last_name?: string
    phone?: string
  }
  metadata?: Record<string, string>
  return_url: string
  cancel_url?: string
  notify_url?: string
}

export interface MonerooInitResponse {
  status: string
  data: {
    id: string
    checkout_url: string
    status: string
  }
}

export interface MonerooWebhookPayload {
  id: string
  status: 'success' | 'failed' | 'pending'
  amount: number
  currency: string
  metadata?: Record<string, string>
}

export async function createMonerooPayment(
  apiKey: string,
  payload: MonerooInitPayload,
): Promise<{ checkoutUrl: string; transactionId: string }> {
  const res = await fetch(`${MONEROO_BASE_URL}/payments/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moneroo error ${res.status}: ${text}`)
  }

  const json = (await res.json()) as MonerooInitResponse
  return {
    checkoutUrl: json.data.checkout_url,
    transactionId: json.data.id,
  }
}

export async function createMonerooRefund(
  apiKey: string,
  transactionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${MONEROO_BASE_URL}/payments/${transactionId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    })
    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Moneroo refund error ${res.status}: ${text}` }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function verifyMonerooSignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const msgData = encoder.encode(rawBody)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const computed = Buffer.from(signatureBuffer).toString('hex')
  return computed === signature
}
