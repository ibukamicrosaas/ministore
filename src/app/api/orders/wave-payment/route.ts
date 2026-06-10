import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, { key: 'payment', maxRequests: 10, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  try {
    const { orderId, customerPhone, amount, method } = await req.json() as {
      orderId: string
      customerPhone: string
      amount: number
      method: string
    }

    if (!orderId || !customerPhone || !amount) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Enregistrer la tentative de paiement Wave
    const { error } = await supabase
      .from('orders')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      console.error('[wave-payment] Erreur:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[wave-payment] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
