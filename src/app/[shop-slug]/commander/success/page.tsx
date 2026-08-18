import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, MessageCircle, ShoppingBag, Home, MapPin, Download, Clock } from 'lucide-react'
import { PixelPurchase } from './PixelPurchase'
import { DigitalDownloadPoller } from './DigitalDownloadPoller'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Shop, OrderItem, Product, ProductPhoto, ProductVariant } from '@/types'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { getShopBasePath } from '@/lib/utils/custom-domain'
import { OrderSummary } from '@/components/shop/OrderSummary'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ order_id?: string; token?: string }>
}

export const metadata = { title: 'Commande confirmée ✓' }

export default async function SuccessPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { order_id, token } = await searchParams

  if (!order_id || !token) notFound()

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderData } = await (supabase.from('orders') as any)
    .select(`
      id, status, delivery_type, delivery_address, delivery_date,
      payment_type, deposit_amount, total_price, notes, is_held,
      delivery_price, delivery_zone_name, promo_code, promo_discount_pct, discount_amount,
      clients(first_name, phone, whatsapp),
      order_items(product_name, variant_label, unit_price, quantity, line_total),
      shops(id, name, slug, primary_color, phone_whatsapp, currency)
    `)
    .eq('id', order_id)
    .eq('client_token', token)
    .single()

  if (!orderData) notFound()

  const order = orderData as unknown as {
    id: string
    status: string
    delivery_type: 'home_delivery' | 'store_pickup'
    delivery_address: string | null
    delivery_date: string | null
    payment_type: string
    deposit_amount: number
    total_price: number
    notes: string | null
    is_held: boolean
    delivery_price: number | null
    delivery_zone_name: string | null
    promo_code: string | null
    promo_discount_pct: number | null
    discount_amount: number | null
    clients: { first_name: string; phone: string; whatsapp: string | null } | null
    order_items: OrderItem[]
    shops: (Pick<Shop, 'id' | 'name' | 'slug' | 'primary_color' | 'phone_whatsapp'> & { currency?: string | null }) | null
  }

  // Relevé (§6 de la spec) — décomposition depuis les colonnes déjà persistées à la
  // création (api/orders/route.ts). Pas de ligne "remise sur quantité" ici : seul le
  // prix déjà remisé est stocké par article, jamais le montant économisé ni le prix
  // d'origine — voir REPRISE.md pour la décision et le chantier de migration séparé
  // envisagé pour la persister à la source.
  const itemsSubtotal = order.order_items.reduce((sum, it) => sum + it.line_total, 0)
  const isOnlinePayment = order.payment_type === 'online_full' || order.payment_type === 'online_deposit'
  const summaryAmountNow = isOnlinePayment
    ? (order.payment_type === 'online_deposit' ? order.deposit_amount : order.total_price)
    : 0
  const summaryAmountLater = isOnlinePayment
    ? (order.payment_type === 'online_deposit' ? order.total_price - order.deposit_amount : 0)
    : order.total_price

  // Téléchargements digitaux — tokens créés par le webhook après confirmation paiement
  const { data: rawTokens } = await (supabase as any)
    .from('download_tokens')
    .select('token, expires_at, download_count, max_downloads, products(name, digital_file_name, digital_file_size)')
    .eq('order_id', order_id)

  type DownloadToken = {
    token: string
    expires_at: string
    download_count: number
    max_downloads: number
    products: { name: string; digital_file_name: string | null; digital_file_size: number | null } | null
  }
  const downloadTokens = (rawTokens ?? []) as DownloadToken[]

  // Détection : produit digital = token présent OU status completed OU product_type='digital'
  // Note : digital_file_path n'est jamais sélectionné côté client (chemin Storage interne)
  const { data: rawOrderItems } = await (supabase as any)
    .from('order_items')
    .select('product_id, products(product_type)')
    .eq('order_id', order_id)

  const hasDigitalProducts = ((rawOrderItems ?? []) as Array<{
    product_id: string
    products: { product_type: string | null } | null
  }>).some(item => item.products?.product_type === 'digital')

  const isDigitalOrder = downloadTokens.length > 0 || order.status === 'completed' || hasDigitalProducts

  const shop     = order.shops
  const color    = 'var(--brand)'
  const currency = (shop?.currency ?? 'XOF') as ShopCurrency

  const basePath = await getShopBasePath(slug)

  // Produits upsell — exclure les articles déjà commandés (par nom)
  const orderedNames = new Set(order.order_items.map((i: OrderItem) => i.product_name))
  const { data: upsellData } = shop?.id
    ? await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('is_active', true)
        .or('stock_count.is.null,stock_count.gt.0')
        .order('display_order', { ascending: true })
        .limit(8)
    : { data: [] }

  const upsellProducts = ((upsellData ?? []) as unknown as (Product & { slug?: string | null })[])
    .filter(p => !orderedNames.has(p.name))
    .slice(0, 3)

  const isOnline   = order.payment_type === 'online_full' || order.payment_type === 'online_deposit'
  const isPaid     = order.status === 'confirmed' || order.status === 'completed'
  const clientWa   = order.clients?.whatsapp ?? order.clients?.phone
  const waShopLink = shop?.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`
    : null

  // Commande retenue : c'est le seul message qui atteint vraiment le client
  // (affiché à l'écran, ne dépend d'aucun envoi) — le rappel automatique à
  // 48h passe par le même canal SMS confirmé non délivré (REPRISE.md
  // §15/§16). Message préempli avec référence + montant, jamais de mention
  // du statut d'abonnement/essai du marchand (§13 de la spec).
  const orderRef      = order.id.slice(0, 8).toUpperCase()
  const heldWaMessage = `Bonjour, je viens de passer la commande #${orderRef} (${formatPrice(order.total_price, currency)}) sur votre boutique.`
  const heldWaLink    = shop?.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(heldWaMessage)}`
    : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-12 text-center">
      <PixelPurchase
        orderId={order.id}
        total={order.total_price}
        items={order.order_items.map(i => ({
          productName: i.product_name,
          unitPrice:   i.unit_price,
          quantity:    i.quantity,
        }))}
      />

      {/* Icône succès */}
      <div
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: 'color-mix(in srgb, var(--brand) 12%, white)' }}
      >
        <CheckCircle2 className="h-10 w-10" style={{ color }} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {order.is_held
          ? 'Commande enregistrée'
          : isDigitalOrder && isPaid
          ? 'Achat confirmé ✓'
          : isOnline && isPaid
          ? 'Paiement reçu ✓'
          : 'Commande confirmée !'}
      </h1>
      <p className="text-sm text-gray-500 mb-3">
        {order.is_held
          ? 'Le vendeur va te contacter pour confirmer.'
          : isDigitalOrder && isPaid
          ? 'Ton paiement a été reçu. Télécharge ton fichier ci-dessous.'
          : isOnline && isPaid
          ? 'Ton paiement a été reçu. La boutique prépare ta commande.'
          : isOnline
          ? 'Ton paiement mobile money est en cours de vérification.'
          : 'Ta commande a bien été enregistrée.'}
        {order.is_held && heldWaLink && (
          <>
            {' '}Tu peux aussi le joindre directement :{' '}
            <a
              href={heldWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ color }}
            >
              WhatsApp
            </a>
          </>
        )}
      </p>
      <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 mb-6">
        <span className="text-xs text-gray-500">Référence</span>
        <span className="text-xs font-bold font-mono text-gray-800 tracking-widest">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Section téléchargements — produits digitaux uniquement */}
      {isDigitalOrder && (
        downloadTokens.length > 0 ? (
          // Tokens déjà disponibles au chargement (webhook rapide ou retour sur la page)
          <div className="space-y-3 mb-6">
            {downloadTokens.map((dt) => {
              const prod = dt.products
              const remaining = dt.max_downloads - dt.download_count
              const expiresAt = new Date(dt.expires_at)
              const fileSizeStr = prod?.digital_file_size
                ? prod.digital_file_size > 1024 * 1024
                  ? `${(prod.digital_file_size / (1024 * 1024)).toFixed(1)} MB`
                  : `${Math.round(prod.digital_file_size / 1024)} KB`
                : null
              return (
                <div key={dt.token} className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-500 mb-2">
                    Téléchargement numérique
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">
                    {prod?.digital_file_name ?? prod?.name ?? 'Fichier'}
                    {fileSizeStr && <span className="text-gray-400 font-normal ml-1">({fileSizeStr})</span>}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expire le {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </span>
                    <span>{remaining} téléchargement{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</span>
                  </div>
                  <a
                    href={`/api/download/${dt.token}`}
                    download
                    className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: color }}
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </div>
              )
            })}
          </div>
        ) : (
          // Tokens pas encore créés (timing webhook) → polling côté client
          <DigitalDownloadPoller
            orderId={order_id}
            clientToken={token}
            color={color}
            trackingUrl={`/${slug}/commande/${token}`}
          />
        )
      )}

      {/* Récap */}
      <div className="rounded-2xl border border-gray-200 bg-white text-left divide-y divide-gray-100 mb-6">

        {/* Articles */}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Articles commandés</p>
          <div className="space-y-2">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{item.product_name}</span>
                  {item.variant_label && (
                    <span className="text-gray-500 ml-1">({item.variant_label})</span>
                  )}
                  {item.quantity > 1 && <span className="text-gray-500 ml-1">×{item.quantity}</span>}
                </div>
                <span className="font-medium text-gray-900 shrink-0">
                  {formatPrice(item.line_total, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Livraison — masqué pour commandes digitales */}
        {!isDigitalOrder && (
        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Livraison</p>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {order.delivery_type === 'home_delivery'
              ? <Home className="h-4 w-4 text-gray-400 shrink-0" />
              : <MapPin className="h-4 w-4 text-gray-400 shrink-0" />}
            <span>{order.delivery_type === 'home_delivery' ? 'À domicile' : 'Retrait en boutique'}</span>
          </div>
          {order.delivery_date && (
            <p className="text-sm text-gray-600 pl-6">
              {format(new Date(order.delivery_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          )}
          {order.delivery_address && (
            <p className="text-xs text-gray-500 pl-6">{order.delivery_address}</p>
          )}
        </div>
        )}

        {/* Relevé — §6 de la spec, décomposition complète depuis les colonnes persistées */}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Ce que tu as payé</p>
          {isOnline && !isPaid && (
            <p className="mb-2 text-sm text-amber-600">Paiement en attente de confirmation</p>
          )}
          <OrderSummary
            currency={currency}
            itemCount={order.order_items.length}
            itemsSubtotal={itemsSubtotal}
            promoCode={order.promo_code}
            promoDiscountPct={order.promo_discount_pct}
            promoAmount={order.discount_amount}
            deliveryAmount={order.delivery_price}
            deliveryZoneName={order.delivery_zone_name}
            total={order.total_price}
            amountNow={summaryAmountNow}
            amountLater={summaryAmountLater}
            laterContext={isDigitalOrder ? null : order.delivery_type}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Lien de suivi / téléchargement */}
        <Link
          href={`/${slug}/commande/${token}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: color }}
        >
          {isDigitalOrder ? <Download className="h-4 w-4" /> : <Home className="h-4 w-4" />}
          {isDigitalOrder ? 'Accéder à mon téléchargement' : 'Suivre ma commande'}
        </Link>

        {/* Commande retenue : le bouton WhatsApp préempli est déjà affiché plus haut, pas de doublon ici */}
        {!order.is_held && waShopLink && (
          <a
            href={waShopLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-semibold text-white hover:bg-[#20bb5a] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter la boutique
          </a>
        )}
        <Link
          href={`/${slug}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          Continuer mes achats
        </Link>
      </div>

      {order.notes && (
        <p className="mt-6 text-xs text-gray-400">Note transmise : "{order.notes}"</p>
      )}

      {upsellProducts.length > 0 && (
        <div className="mt-8 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Tu aimeras aussi
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {upsellProducts.map(p => {
              const photos = Array.isArray(p.photos) && (p.photos as unknown as ProductPhoto[]).length > 0
                ? (p.photos as unknown as ProductPhoto[])
                : p.photo_url ? [{ url: p.photo_url, is_primary: true }] : []
              const photo    = photos.find(ph => ph.is_primary)?.url ?? photos[0]?.url ?? null
              const variants = p.variants as ProductVariant[] | null
              const price    = variants?.length
                ? `À partir de ${formatPrice(Math.min(...variants.map(v => v.price)), currency)}`
                : formatPrice(p.price, currency)
              const href = `${basePath}/produit/${(p as Product & { slug?: string | null }).slug ?? p.id}`
              return (
                <a key={p.id} href={href} className="shrink-0 w-32 group">
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={p.name}
                        fill
                        sizes="128px"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        quality={80}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="mt-0.5 text-xs font-bold" style={{ color }}>{price}</p>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
