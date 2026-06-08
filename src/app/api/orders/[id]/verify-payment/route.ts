import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const method = req.nextUrl.searchParams.get('method')

    if (!orderId || !method) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Vérifier si la commande a été confirmée (webhook Bictorys)
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (!orderData) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Si le statut est 'confirmed', le paiement a réussi
    const confirmed = orderData.status === 'confirmed'

    return NextResponse.json({ confirmed })
  } catch (err) {
    console.error('[verify-payment] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
