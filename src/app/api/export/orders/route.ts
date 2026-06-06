import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return new NextResponse('Non authentifié', { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('shop_id, role').eq('id', user.id).single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    return new NextResponse('Accès non autorisé', { status: 403 })
  }

  const { data: shop } = await admin
    .from('shops').select('plan, name').eq('id', profile.shop_id).single()

  if (!shop || shop.plan !== 'pro') {
    return new NextResponse('Réservé au plan Pro', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') // YYYY-MM-DD
  const to   = searchParams.get('to')   // YYYY-MM-DD

  let query = admin
    .from('orders')
    .select(`
      id, created_at, status, total_price, payment_type, delivery_type, delivery_address, delivery_date, notes,
      clients(first_name, last_name, phone),
      order_items(product_name, variant_label, quantity, unit_price, line_total)
    `)
    .eq('shop_id', profile.shop_id)
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`)
  if (to)   query = query.lte('created_at', `${to}T23:59:59.999Z`)

  const { data, error } = await query
  if (error) {
    console.error('[export/orders]', error.message)
    return new NextResponse('Erreur serveur', { status: 500 })
  }

  const orders = data ?? []

  const STATUS_LABELS: Record<string, string> = {
    pending:   'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready:     'Prête',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  }
  const PAYMENT_LABELS: Record<string, string> = {
    online_full:    'Paiement en ligne (total)',
    online_deposit: 'Paiement en ligne (acompte)',
    on_delivery:    'Paiement à la livraison',
    on_site:        'Paiement en boutique',
  }
  const DELIVERY_LABELS: Record<string, string> = {
    home_delivery: 'Livraison à domicile',
    store_pickup:  'Retrait en boutique',
  }

  // BOM UTF-8 pour compatibilité Excel
  const BOM = '﻿'
  const headers = [
    'Date', 'Référence', 'Client', 'Téléphone',
    'Produits', 'Total (FCFA)', 'Statut', 'Paiement',
    'Livraison', 'Adresse', 'Date livraison', 'Notes',
  ]

  type OrderItem = { product_name: string; variant_label: string | null; quantity: number; unit_price: number; line_total: number }
  type Client    = { first_name: string; last_name: string | null; phone: string } | null

  const rows = orders.map(o => {
    const client = o.clients as unknown as Client
    const items  = (o.order_items as unknown as OrderItem[] | null) ?? []
    const products = items.map(i => {
      const name = i.variant_label ? `${i.product_name} (${i.variant_label})` : i.product_name
      return `${name} x${i.quantity} = ${i.line_total.toLocaleString('fr-FR')} FCFA`
    }).join(' | ')

    const date         = new Date(o.created_at).toLocaleDateString('fr-FR')
    const ref          = `#${o.id.slice(0, 8).toUpperCase()}`
    const clientName   = client ? `${client.first_name} ${client.last_name ?? ''}`.trim() : ''
    const deliveryDate = o.delivery_date
      ? new Date(o.delivery_date + 'T12:00:00').toLocaleDateString('fr-FR')
      : ''

    return [
      date,
      ref,
      clientName,
      client?.phone ?? '',
      products,
      (o.total_price ?? 0).toString(),
      STATUS_LABELS[o.status] ?? o.status,
      PAYMENT_LABELS[o.payment_type] ?? o.payment_type,
      DELIVERY_LABELS[o.delivery_type] ?? o.delivery_type,
      o.delivery_address ?? '',
      deliveryDate,
      o.notes ?? '',
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`)
  })

  const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const filename = `commandes-${shop.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
