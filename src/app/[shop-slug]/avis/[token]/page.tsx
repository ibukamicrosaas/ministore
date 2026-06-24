import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ReviewForm } from './ReviewForm'
import type { Shop } from '@/types'

export const metadata = { title: 'Laisser un avis', robots: { index: false } }

type Props = {
  params: Promise<{ 'shop-slug': string; token: string }>
}

export default async function ReviewPage({ params }: Props) {
  const { 'shop-slug': slug, token } = await params

  if (!token || token.length < 10) notFound()

  const admin = createAdminClient()

  // Récupérer la commande et ses articles (avec le produit pour avoir l'image)
  const { data: orderData } = await admin
    .from('orders')
    .select(`
      id, status, client_token,
      clients(first_name),
      order_items(product_id, product_name),
      shops(id, name, slug, primary_color, logo_url)
    `)
    .eq('client_token', token)
    .single()

  if (!orderData) notFound()

  const order = orderData as unknown as {
    id: string
    status: string
    clients: { first_name: string } | null
    order_items: { product_id: string; product_name: string }[]
    shops: (Pick<Shop, 'id' | 'name' | 'slug' | 'primary_color' | 'logo_url'>) | null
  }

  if (!order.shops || order.shops.slug !== slug) notFound()

  // On peut laisser un avis seulement pour les commandes confirmées ou livrées
  if (!['confirmed', 'preparing', 'ready', 'delivered'].includes(order.status)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-12">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-base font-semibold text-gray-900">Commande en attente</p>
          <p className="text-sm text-gray-500 mt-2">
            Tu pourras laisser un avis une fois ta commande confirmée.
          </p>
        </div>
      </div>
    )
  }

  // Vérifie quels produits ont déjà reçu un avis pour cette commande
  const { data: existingReviews } = await admin
    .from('product_reviews' as never)
    .select('product_id')
    .eq('order_id', order.id) as unknown as { data: { product_id: string }[] | null }

  const alreadyReviewed = new Set((existingReviews ?? []).map(r => r.product_id))
  const pendingItems = order.order_items.filter(i => !alreadyReviewed.has(i.product_id))

  const shop  = order.shops
  const color = shop.primary_color ?? '#0EA5E9'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* En-tête boutique */}
        <div className="flex items-center gap-3">
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logo_url} alt={shop.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold"
              style={{ backgroundColor: color }}
            >
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{shop.name}</p>
            <p className="text-xs text-gray-500">Laisser un avis</p>
          </div>
        </div>

        {pendingItems.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm font-semibold text-gray-900">Merci pour tes avis !</p>
            <p className="text-xs text-gray-500 mt-1">Tu as déjà noté tous les produits de cette commande.</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Bonjour {order.clients?.first_name ?? ''} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Ton avis aide les autres clients à choisir.
              </p>
            </div>
            <ReviewForm
              items={pendingItems}
              orderToken={token}
              color={color}
            />
          </>
        )}
      </div>
    </div>
  )
}
