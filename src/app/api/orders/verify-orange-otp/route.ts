import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, { key: 'payment', maxRequests: 10, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  try {
    const { orderId, otp } = await req.json() as {
      orderId: string
      otp: string
    }

    if (!orderId || !otp) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Récupérer la commande pour vérifier via Bictorys
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (!orderData) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Note: La vérification réelle du code OTP se fait via le webhook Bictorys
    // Ici on vérifie juste que la commande a été confirmée

    if (orderData.status === 'confirmed') {
      return NextResponse.json({ confirmed: true })
    }

    // Attendre la confirmation Bictorys (polling côté client)
    return NextResponse.json({
      confirmed: false,
      error: 'Paiement en attente de confirmation',
    })
  } catch (err) {
    console.error('[verify-orange-otp] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
