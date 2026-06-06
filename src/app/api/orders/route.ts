import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendWhatsApp,
  buildOrderConfirmationMessage,
  buildNewOrderAlertMessage,
  buildLowStockAlertMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

interface OrderItemInput {
  product_id: string
  product_name: string
  variant_label: string | null
  unit_price: number
  quantity: number
}

interface CreateOrderBody {
  shopId: string
  items: OrderItemInput[]
  delivery_date: string | null
  delivery_type: 'home_delivery' | 'store_pickup'
  delivery_address: string | null
  delivery_zone_name: string | null
  delivery_price: number
  client_first_name: string
  client_phone: string
  client_whatsapp: string
  notes: string | null
  payment_type: 'online_full' | 'online_deposit' | 'on_delivery' | 'on_site'
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  // ── Rate limiting par IP : max 20 commandes / heure ──────────────────
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown').slice(0, 64)

  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentOrders } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', `order:${ip}`)
    .eq('attempt_type', 'order')
    .gte('attempted_at', oneHourAgo)

  if ((recentOrders ?? 0) >= 20) {
    return NextResponse.json({ error: 'Trop de commandes. Réessayez dans 1 heure.' }, { status: 429 })
  }

  const body = await req.json() as CreateOrderBody

  const { shopId, items, delivery_date, delivery_type, delivery_address,
    delivery_zone_name,
    client_first_name, client_phone, client_whatsapp, notes, payment_type } = body

  // ── Validation des entrées ────────────────────────────────────────────
  if (!shopId || !UUID_RE.test(shopId)) {
    return NextResponse.json({ error: 'Boutique invalide.' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return NextResponse.json({ error: 'Nombre de produits invalide (max 50).' }, { status: 400 })
  }
  if (!client_first_name || typeof client_first_name !== 'string' || client_first_name.length > 100) {
    return NextResponse.json({ error: 'Prénom invalide.' }, { status: 400 })
  }
  if (!client_phone || typeof client_phone !== 'string' || client_phone.length > 30) {
    return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 })
  }
  if (notes && (typeof notes !== 'string' || notes.length > 1000)) {
    return NextResponse.json({ error: 'Notes trop longues (max 1000 caractères).' }, { status: 400 })
  }
  if (delivery_address && (typeof delivery_address !== 'string' || delivery_address.length > 500)) {
    return NextResponse.json({ error: 'Adresse trop longue (max 500 caractères).' }, { status: 400 })
  }

  // Validation de chaque article
  for (const item of items) {
    if (!item.product_id || typeof item.product_id !== 'string' || !UUID_RE.test(item.product_id)) {
      return NextResponse.json({ error: 'Identifiant produit invalide.' }, { status: 400 })
    }
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      return NextResponse.json({ error: 'Quantité invalide (entre 1 et 100).' }, { status: 400 })
    }
  }

  // Vérifier que la boutique existe et est active
  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, phone_whatsapp, slug, deposit_percentage, delivery_zones')
    .eq('id', shopId)
    .eq('is_active', true)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 404 })
  }

  // Vérifier le stock et récupérer les prix réels depuis la DB (ignorer les prix du client)
  const productIds = items.map(i => i.product_id).filter(Boolean)
  if (!productIds.length) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, name, price, variants, deposit_percentage, stock_count')
    .in('id', productIds)
    .eq('shop_id', shopId)

  if (!dbProducts || dbProducts.length === 0) {
    return NextResponse.json({ error: 'Produits introuvables.' }, { status: 400 })
  }

  type DbProduct = { id: string; name: string; price: number; variants: unknown; deposit_percentage: number | null; stock_count: number | null }
  const productMap = new Map(dbProducts.map(p => [p.id, p as DbProduct]))

  // Stock check + calcul des prix serveur
  type ServerItem = { product_id: string; product_name: string; variant_label: string | null; unit_price: number; quantity: number }
  const serverItems: ServerItem[] = []

  for (const it of items) {
    const p = productMap.get(it.product_id)
    if (!p) {
      return NextResponse.json({ error: 'Produit introuvable.' }, { status: 400 })
    }
    if (p.stock_count !== null) {
      if (p.stock_count === 0) {
        return NextResponse.json({ error: `${p.name} est en rupture de stock.` }, { status: 400 })
      }
      if (it.quantity > p.stock_count) {
        return NextResponse.json({ error: `Stock insuffisant pour ${p.name} (${p.stock_count} disponible(s)).` }, { status: 400 })
      }
    }
    // Prix réel depuis la DB — ignorer it.unit_price envoyé par le client
    let unit_price = p.price
    if (it.variant_label && Array.isArray(p.variants)) {
      const variant = (p.variants as { label: string; price: number }[]).find(v => v.label === it.variant_label)
      if (variant) unit_price = variant.price
    }
    serverItems.push({ product_id: it.product_id, product_name: p.name, variant_label: it.variant_label, unit_price, quantity: it.quantity })
  }

  // Prix de livraison depuis la DB — ignorer delivery_price envoyé par le client
  let serverDeliveryPrice = 0
  if (delivery_type === 'home_delivery' && delivery_zone_name) {
    const zones = Array.isArray(shop.delivery_zones)
      ? (shop.delivery_zones as { id: string; name: string; price: number }[])
      : []
    const zone = zones.find(z => z.name === delivery_zone_name)
    serverDeliveryPrice = zone?.price ?? 0
  }

  // Calculer les totaux côté serveur
  const itemsTotal = serverItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
  const total_price = itemsTotal + serverDeliveryPrice

  // Calculer l'acompte si paiement en ligne
  let deposit_amount = 0
  if (payment_type === 'online_deposit') {
    deposit_amount = serverItems.reduce((sum, it) => {
      const p = productMap.get(it.product_id)
      const pct = p?.deposit_percentage ?? shop.deposit_percentage ?? 0
      return sum + Math.floor(it.unit_price * it.quantity * pct / 100)
    }, 0)
  } else if (payment_type === 'online_full') {
    deposit_amount = total_price
  }

  // ── Phase 1 : Réservation atomique du stock AVANT création de la commande ─
  // Chaque décrément est atomique en DB (UPDATE … WHERE stock_count >= qty).
  // Si l'un échoue, on restore les précédents → zéro survente possible.
  type DecrementedItem = { product_id: string; quantity: number }
  const decrementedItems: DecrementedItem[] = []

  for (const it of serverItems) {
    if (!it.product_id) continue
    const p = productMap.get(it.product_id)
    if (p?.stock_count === null) continue  // stock illimité, rien à décrémenter

    const { data: ok } = await supabase.rpc('decrement_product_stock', {
      p_product_id: it.product_id,
      p_shop_id:    shopId,
      p_quantity:   it.quantity,
    })

    if (!ok) {
      // Décrément échoué (course entre deux requêtes simultanées) : on rollback
      for (const prev of decrementedItems) {
        await supabase.rpc('increment_product_stock', {
          p_product_id: prev.product_id,
          p_shop_id:    shopId,
          p_quantity:   prev.quantity,
        })
      }
      return NextResponse.json(
        { error: `Stock insuffisant pour ${p?.name ?? it.product_id}. Veuillez actualiser et réessayer.` },
        { status: 409 }
      )
    }
    decrementedItems.push({ product_id: it.product_id, quantity: it.quantity })
  }

  // ── Phase 2 : Upsert client ──────────────────────────────────────────────
  const { data: clientId } = await supabase.rpc('upsert_client_from_order', {
    p_shop_id:    shopId,
    p_first_name: client_first_name,
    p_last_name:  '',
    p_phone:      client_phone,
    p_whatsapp:   client_whatsapp,
    p_email:      '',
  })

  // ── Phase 3 : Créer la commande (stock déjà réservé) ────────────────────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      shop_id:          shopId,
      client_id:        clientId ?? null,
      status:             'pending',
      delivery_type,
      delivery_address:   delivery_address ?? null,
      delivery_date:      delivery_date ?? null,
      delivery_zone_name: delivery_zone_name ?? null,
      delivery_price:     serverDeliveryPrice,
      payment_type,
      deposit_amount,
      deposit_paid:       false,
      total_price,
      notes:              notes ?? null,
    })
    .select('id, client_token')
    .single()

  if (orderError || !order) {
    console.error('[api/orders]', orderError?.message)
    // Création échouée → restaurer le stock réservé
    for (const item of decrementedItems) {
      await supabase.rpc('increment_product_stock', {
        p_product_id: item.product_id,
        p_shop_id:    shopId,
        p_quantity:   item.quantity,
      })
    }
    return NextResponse.json({ error: 'Impossible de créer la commande.' }, { status: 500 })
  }

  // Enregistrer la commande pour le rate limiting
  void supabase.from('login_attempts').insert({
    identifier:   `order:${ip}`,
    attempt_type: 'order',
    success:      true,
  })

  // Créer les lignes (avec les prix serveur — jamais les prix client)
  const { error: itemsError } = await supabase.from('order_items').insert(
    serverItems.map(it => ({
      order_id:      order.id,
      product_id:    it.product_id || null,
      product_name:  it.product_name,
      variant_label: it.variant_label,
      unit_price:    it.unit_price,
      quantity:      it.quantity,
      line_total:    it.unit_price * it.quantity,
    }))
  )

  if (itemsError) {
    console.error('[api/orders items]', itemsError.message)
  }

  // ── Alertes stock faible (fire-and-forget, seuil = 3 unités) ──────────────
  if (shop.phone_whatsapp && decrementedItems.length > 0) {
    void (async () => {
      const decrementedIds = decrementedItems.map(d => d.product_id)
      const { data: stockCheck } = await supabase
        .from('products')
        .select('id, name, stock_count')
        .in('id', decrementedIds)
        .eq('shop_id', shopId)
        .lte('stock_count', 3)  // seuil d'alerte
        .gt('stock_count', 0)   // ne pas alerter sur 0 (rupture déjà gérée)

      for (const p of stockCheck ?? []) {
        const msg = buildLowStockAlertMessage({
          shopName:    shop.name,
          productName: p.name,
          stockCount:  p.stock_count ?? 0,
        })
        sendWhatsApp(shop.phone_whatsapp!, msg).catch(err =>
          console.error('[orders] low stock SMS failed:', err)
        )
      }
    })()
  }

  // Si paiement en ligne → renvoyer vers la page de paiement
  if (payment_type === 'online_full' || payment_type === 'online_deposit') {
    return NextResponse.json({ orderId: order.id, clientToken: order.client_token, redirect: 'pay' })
  }

  // Paiement à la réception → envoyer les notifications WhatsApp
  const orderUrl     = `${APP_URL}/${shop.slug}/commander/success?order_id=${order.id}&token=${order.client_token}`
  const itemsSummary = serverItems
    .map(i => `• ${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''}${i.quantity > 1 ? ` ×${i.quantity}` : ''} — ${(i.unit_price * i.quantity).toLocaleString('fr-FR')} FCFA`)
    .join('\n')

  const confirmMsg = buildOrderConfirmationMessage({
    shopName:     shop.name,
    clientName:   client_first_name,
    items:        itemsSummary,
    totalPrice:   total_price,
    deliveryType: delivery_type,
    deliveryDate: delivery_date ?? undefined,
    paymentType:  payment_type,
    orderUrl,
  })

  const clientNotif = await sendWhatsApp(client_whatsapp, confirmMsg)
  await supabase.from('notification_logs').insert({
    shop_id:           shopId,
    order_id:          order.id,
    recipient_phone:   client_whatsapp,
    notification_type: 'order_confirmation',
    channel:           'sms',
    message:           confirmMsg,
    status:            clientNotif.success ? 'sent' : 'failed',
    error_message:     clientNotif.error ?? null,
  })

  if (shop.phone_whatsapp) {
    const alertMsg = buildNewOrderAlertMessage({
      clientName:   client_first_name,
      clientPhone:  client_phone,
      items:        itemsSummary,
      totalPrice:   total_price,
      deliveryType: delivery_type,
      deliveryDate: delivery_date ?? undefined,
      paymentType:  payment_type,
    })

    const shopNotif = await sendWhatsApp(shop.phone_whatsapp, alertMsg)
    await supabase.from('notification_logs').insert({
      shop_id:           shopId,
      order_id:          order.id,
      recipient_phone:   shop.phone_whatsapp,
      notification_type: 'new_order_shop',
      channel:           'sms',
      message:           alertMsg,
      status:            shopNotif.success ? 'sent' : 'failed',
      error_message:     shopNotif.error ?? null,
    })
  }

  return NextResponse.json({ orderId: order.id, clientToken: order.client_token, redirect: 'success' })
}
