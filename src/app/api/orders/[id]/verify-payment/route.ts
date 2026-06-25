import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const method      = req.nextUrl.searchParams.get('method')
    const clientToken = req.nextUrl.searchParams.get('client_token')

    if (!orderId || !method) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // HIGH-2 : valider l'appartenance de la commande avant de révéler son statut
    if (!clientToken) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: orderData } = await supabase
      .from('orders')
      .select('id, status, client_token')
      .eq('id', orderId)
      .eq('client_token', clientToken)
      .single()

    if (!orderData) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const confirmed = orderData.status === 'confirmed'

    return NextResponse.json({ confirmed })
  } catch (err) {
    console.error('[verify-payment] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
