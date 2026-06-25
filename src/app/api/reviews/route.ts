import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    order_token: string
    product_id:  string
    rating:      number
    comment?:    string
  }

  const { order_token, product_id, rating, comment } = body

  if (!order_token || !product_id || !rating) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Note invalide (1–5).' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Vérifier que le token correspond à une vraie commande livrée (ou confirmée)
  // MED-2 : seules les commandes livrées ou complétées peuvent recevoir un avis
  const { data: order } = await admin
    .from('orders')
    .select('id, shop_id, status, clients(first_name)')
    .eq('client_token', order_token)
    .in('status', ['delivered', 'completed'])
    .single() as { data: {
      id: string; shop_id: string; status: string
      clients: { first_name: string } | null
    } | null }

  if (!order) {
    return NextResponse.json({ error: 'Commande introuvable ou non encore livrée.' }, { status: 404 })
  }

  // Vérifier que le produit commandé appartient bien à cette commande
  const { count } = await admin
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', order.id)
    .eq('product_id', product_id)

  if (!count || count === 0) {
    return NextResponse.json({ error: 'Produit non commandé.' }, { status: 403 })
  }

  // Un seul avis par commande × produit
  const { count: existing } = await admin
    .from('product_reviews' as never)
    .select('id', { count: 'exact', head: true })
    .eq('order_id', order.id)
    .eq('product_id', product_id) as unknown as { count: number | null }

  if (existing && existing > 0) {
    return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour ce produit.' }, { status: 409 })
  }

  const clientName = order.clients?.first_name ?? 'Client'

  const { error } = await admin
    .from('product_reviews' as never)
    .insert({
      product_id,
      shop_id:     order.shop_id,
      order_id:    order.id,
      client_name: clientName,
      rating,
      comment:     comment?.trim() || null,
    } as never)

  if (error) {
    console.error('[reviews] insert error:', error)
    return NextResponse.json({ error: 'Impossible d\'enregistrer l\'avis.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
