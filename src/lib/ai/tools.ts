import { tool, zodSchema, stepCountIs } from 'ai'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { TEKKISHOP_COMMISSION_RATE, APP_URL } from '@/constants'

// Tous les tools sont en LECTURE SEULE.
// Le shop_id est toujours injecté côté serveur depuis la session — jamais depuis le client.
// En cas d'erreur Supabase, on lève une exception : l'agent répond qu'il ne peut pas accéder aux données.
export function buildAiTools(shopId: string) {
  const admin = createAdminClient()

  return {
    get_shop_info: tool({
      description:
        "Récupère les informations générales de la boutique : nom, plan, pays, statut d'activation, URL du site, moyens de paiement configurés, logo uploadé.",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { data: shop, error } = await admin
          .from('shops')
          .select(
            'name, plan, country, is_active, slug, logo_url, payout_wave_number, payout_om_number, accept_online_payment, accept_cash_on_delivery, created_at'
          )
          .eq('id', shopId)
          .single()

        if (error || !shop) throw new Error('Impossible de récupérer les infos boutique')

        return {
          name: shop.name,
          plan: shop.plan,
          country: shop.country,
          is_active: shop.is_active,
          site_url: `${APP_URL}/${shop.slug}`,
          has_logo: shop.logo_url != null,
          wave_configured: shop.payout_wave_number != null,
          om_configured: shop.payout_om_number != null,
          accept_online_payment: shop.accept_online_payment,
          accept_cash_on_delivery: shop.accept_cash_on_delivery,
          created_at: shop.created_at,
        }
      },
    }),

    get_setup_checklist: tool({
      description:
        "Vérifie l'état de configuration de la boutique : quelles étapes sont complètes et lesquelles manquent pour activer le site.",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const [shopResult, productsResult] = await Promise.all([
          admin
            .from('shops')
            .select('logo_url, is_active, payout_wave_number, payout_om_number, custom_domain')
            .eq('id', shopId)
            .single(),
          admin
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('is_active', true),
        ])

        if (!shopResult.data) throw new Error('Boutique introuvable')

        const shop = shopResult.data
        const has_logo = shop.logo_url != null
        const has_products = (productsResult.count ?? 0) > 0
        const product_count = productsResult.count ?? 0
        const wave_configured = shop.payout_wave_number != null
        const om_configured = shop.payout_om_number != null
        const has_payment_method = wave_configured || om_configured
        const site_active = shop.is_active
        const domain_configured = shop.custom_domain != null

        const missing_steps: string[] = []
        if (!has_logo) missing_steps.push('Uploader un logo (Paramètres → Apparence)')
        if (!has_products) missing_steps.push('Ajouter au moins un produit actif (Produits → Ajouter)')
        if (!has_payment_method)
          missing_steps.push(
            'Configurer un moyen de paiement Wave ou Orange Money (Paramètres → Paiements)'
          )
        if (!site_active && missing_steps.length === 0)
          missing_steps.push('Activer le site depuis le tableau de bord principal')

        return {
          has_logo,
          has_products,
          product_count,
          has_payment_method,
          wave_configured,
          om_configured,
          site_active,
          domain_configured,
          missing_steps,
          setup_complete: missing_steps.length === 0,
        }
      },
    }),

    get_orders: tool({
      description:
        'Récupère les commandes de la boutique : nombre total, montant total, commandes récentes, répartition par statut.',
      inputSchema: zodSchema(
        z.object({
          days: z.number().optional().describe('Nombre de jours à analyser (défaut: 30)'),
        })
      ),
      execute: async ({ days = 30 }) => {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

        const { data: orders, error } = await admin
          .from('orders')
          .select('id, status, total_price, created_at')
          .eq('shop_id', shopId)
          .gte('created_at', since)
          .order('created_at', { ascending: false })

        if (error) throw new Error('Impossible de récupérer les commandes')

        const byStatus = { pending: 0, confirmed: 0, preparing: 0, ready: 0, delivered: 0, cancelled: 0 }
        let total_revenue = 0

        for (const o of orders ?? []) {
          const s = o.status as keyof typeof byStatus
          if (s in byStatus) byStatus[s]++
          if (o.status === 'delivered') total_revenue += o.total_price
        }

        return {
          total_orders: orders?.length ?? 0,
          total_revenue,
          orders_by_status: byStatus,
          recent_orders: (orders ?? []).slice(0, 5).map((o) => ({
            id: o.id.slice(0, 8),
            amount: o.total_price,
            status: o.status,
            created_at: o.created_at,
          })),
          period_days: days,
        }
      },
    }),

    get_products: tool({
      description:
        'Récupère les produits de la boutique : nombre total, actifs/inactifs, ruptures de stock, produits les plus commandés.',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { data: products, error } = await admin
          .from('products')
          .select('id, name, is_active, stock_count, price')
          .eq('shop_id', shopId)

        if (error) throw new Error('Impossible de récupérer les produits')

        const total = products?.length ?? 0
        const active = products?.filter((p) => p.is_active).length ?? 0
        const inactive = total - active
        const out_of_stock =
          products?.filter((p) => p.is_active && p.stock_count !== null && p.stock_count <= 0).length ?? 0

        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: items } = await admin
          .from('order_items')
          .select('product_id, product_name, quantity, line_total')
          .in('product_id', (products ?? []).map((p) => p.id))
          .gte('created_at', since)

        const productSales: Record<string, { name: string; qty: number; revenue: number }> = {}
        for (const item of items ?? []) {
          if (!item.product_id) continue
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 }
          }
          productSales[item.product_id].qty += item.quantity
          productSales[item.product_id].revenue += item.line_total
        }

        return {
          total_products: total,
          active_products: active,
          inactive_products: inactive,
          out_of_stock,
          top_products: Object.values(productSales)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5)
            .map((p) => ({ name: p.name, sales_count: p.qty, revenue: p.revenue })),
        }
      },
    }),

    get_customers: tool({
      description:
        'Récupère les statistiques clients de la boutique : nombre total, nouveaux clients récents, clients récurrents.',
      inputSchema: zodSchema(
        z.object({
          days: z.number().optional().describe('Nombre de jours à analyser (défaut: 30)'),
        })
      ),
      execute: async ({ days = 30 }) => {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

        const [totalRes, newRes, returningRes] = await Promise.all([
          admin.from('clients').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
          admin
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .gte('created_at', since),
          admin
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .gt('total_orders', 1),
        ])

        return {
          total_customers: totalRes.count ?? 0,
          new_customers_period: newRes.count ?? 0,
          returning_customers: returningRes.count ?? 0,
          period_days: days,
        }
      },
    }),

    get_revenues: tool({
      description:
        'Récupère les revenus de la boutique : total collecté, solde disponible, historique des reversements.',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const [paymentsRes, payoutsRes, shopRes] = await Promise.all([
          admin.from('payments').select('amount').eq('shop_id', shopId).eq('status', 'completed'),
          admin
            .from('payouts')
            .select('net_amount, status, created_at')
            .eq('shop_id', shopId)
            .in('status', ['pending', 'processing', 'completed'])
            .order('created_at', { ascending: false }),
          admin.from('shops').select('plan').eq('id', shopId).single(),
        ])

        const total_collected = (paymentsRes.data ?? []).reduce((s, p) => s + p.amount, 0)
        const total_paid_out = (payoutsRes.data ?? []).reduce((s, p) => s + p.net_amount, 0)
        const available_balance = Math.max(0, total_collected - total_paid_out)
        const pending_payout = (payoutsRes.data ?? [])
          .filter((p) => p.status === 'pending' || p.status === 'processing')
          .reduce((s, p) => s + p.net_amount, 0)

        const plan = shopRes.data?.plan ?? 'trial'
        const commission_rate = plan === 'pro' ? 0 : TEKKISHOP_COMMISSION_RATE

        return {
          total_collected,
          available_balance,
          pending_payout,
          total_paid_out,
          commission_rate,
          recent_payouts: (payoutsRes.data ?? []).slice(0, 3).map((p) => ({
            amount: p.net_amount,
            status: p.status,
            created_at: p.created_at,
          })),
        }
      },
    }),
  }
}

export { stepCountIs }
