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
        "Récupère les informations générales de la boutique : nom, plan, pays, modèle d'essai, statut, URL du site, moyens de paiement configurés, logo uploadé.",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { data: shop, error } = await admin
          .from('shops')
          .select(
            'name, plan, country, is_active, slug, logo_url, payout_wave_number, payout_om_number, accept_online_payment, accept_cash_on_delivery, created_at, trial_model, status, free_orders_used, free_orders_quota'
          )
          .eq('id', shopId)
          .single()

        if (error || !shop) throw new Error('Impossible de récupérer les infos boutique')

        return {
          name: shop.name,
          plan: shop.plan,
          country: shop.country,
          is_active: shop.is_active,
          // trial_model='free_orders' : boutique publique dès le premier
          // produit, sans paiement — status fait foi, pas is_active/plan.
          // trial_model='legacy' : modèle historique, is_active/plan font foi.
          trial_model: shop.trial_model,
          status: shop.status,
          free_orders_used: shop.trial_model === 'free_orders' ? shop.free_orders_used : null,
          free_orders_quota: shop.trial_model === 'free_orders' ? shop.free_orders_quota : null,
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
        "Vérifie l'état de configuration de la boutique : quelles étapes sont complètes et lesquelles manquent pour la mettre en ligne (le sens exact de « manquant » dépend du modèle d'essai, voir trial_model dans le résultat).",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const [shopResult, productsResult] = await Promise.all([
          admin
            .from('shops')
            .select('logo_url, is_active, payout_wave_number, payout_om_number, custom_domain, trial_model, status')
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
        const isFreeOrders = shop.trial_model === 'free_orders'
        const has_logo = shop.logo_url != null
        const has_products = (productsResult.count ?? 0) > 0
        const product_count = productsResult.count ?? 0
        const wave_configured = shop.payout_wave_number != null
        const om_configured = shop.payout_om_number != null
        const has_payment_method = wave_configured || om_configured
        const domain_configured = shop.custom_domain != null
        // legacy : is_active fait foi. free_orders : is_active reste true dès
        // que status quitte 'draft' (shop-status.ts) — status='draft' est le
        // seul signal réel de "pas encore en ligne" pour ce modèle.
        const site_active = isFreeOrders ? shop.status !== 'draft' : shop.is_active

        const missing_steps: string[] = []
        if (!has_logo) missing_steps.push('Uploader un logo (Paramètres → Apparence)')
        if (isFreeOrders && !site_active) {
          // Ajouter un produit depuis le tableau de bord classique ne publie
          // pas cette boutique aujourd'hui — seul le dernier écran de /start
          // le fait (activateTrialShop). Point ouvert, voir REPRISE.md.
          missing_steps.push(
            'Terminer le parcours de création (/start) pour publier le premier produit et mettre la boutique en ligne'
          )
        } else if (!has_products) {
          missing_steps.push('Ajouter au moins un produit actif (Produits → Ajouter)')
        }
        if (!has_payment_method)
          missing_steps.push(
            'Configurer un moyen de paiement Wave ou Orange Money (Paramètres → Paiements)'
          )
        if (!isFreeOrders && !site_active && missing_steps.length === 0)
          missing_steps.push('Activer le site depuis le tableau de bord principal')

        return {
          has_logo,
          has_products,
          product_count,
          has_payment_method,
          wave_configured,
          om_configured,
          site_active,
          trial_model: shop.trial_model,
          status: shop.status,
          domain_configured,
          missing_steps,
          setup_complete: missing_steps.length === 0,
        }
      },
    }),

    get_orders: tool({
      description:
        "Récupère les commandes et le chiffre d'affaires réel de la boutique (uniquement commandes livrées ou produits digitaux complétés). " +
        "Utilise 'period' pour des périodes nommées (today, yesterday, week, month, quarter, semester, year, all) " +
        "ou 'days' pour une fenêtre glissante en jours. 'period' est prioritaire sur 'days'. " +
        "Exemples : ventes du jour → period='today', ventes de la semaine → period='week', ventes du mois → period='month'.",
      inputSchema: zodSchema(
        z.object({
          days: z.number().optional().describe("Fenêtre glissante en jours (défaut: 30). Ignoré si 'period' est fourni."),
          period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'semester', 'year', 'all'])
            .optional()
            .describe("Période nommée : today=aujourd'hui, yesterday=hier, week=semaine en cours, month=mois en cours, quarter=trimestre, semester=semestre, year=année, all=tout"),
        })
      ),
      execute: async ({ days = 30, period }) => {
        // Calcul de la plage de dates
        const now = new Date()
        const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate()
        let since: string | null = null
        let until: string | null = null

        if (period) {
          switch (period) {
            case 'today':
              since = new Date(Date.UTC(y, m, d)).toISOString(); break
            case 'yesterday':
              since = new Date(Date.UTC(y, m, d - 1)).toISOString()
              until = new Date(Date.UTC(y, m, d)).toISOString(); break
            case 'week': {
              const dow = (now.getUTCDay() + 6) % 7
              since = new Date(Date.UTC(y, m, d - dow)).toISOString(); break
            }
            case 'month':
              since = new Date(Date.UTC(y, m, 1)).toISOString(); break
            case 'quarter':
              since = new Date(Date.UTC(y, m - 2, 1)).toISOString(); break
            case 'semester':
              since = new Date(Date.UTC(y, m - 5, 1)).toISOString(); break
            case 'year':
              since = new Date(Date.UTC(y, 0, 1)).toISOString(); break
            case 'all':
              since = null; break
          }
        } else {
          since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        }

        let query = admin
          .from('orders')
          .select('id, status, total_price, created_at, payment_method, payment_type')
          .eq('shop_id', shopId)
          .not('status', 'in', '("pending","cancelled")')
          .order('created_at', { ascending: false })

        if (since) query = query.gte('created_at', since)
        if (until) query = query.lt('created_at', until)

        const { data: orders, error } = await query
        if (error) throw new Error('Impossible de récupérer les commandes')

        const byStatus: Record<string, number> = {
          pending: 0, confirmed: 0, preparing: 0, ready: 0,
          delivered: 0, completed: 0, cancelled: 0,
        }
        // CA réel = argent collecté :
        // — online (Wave/OM/Stripe) : dès 'confirmed'
        // — livraison / boutique : uniquement à 'delivered'
        // — digital : 'completed'
        const ONLINE_TYPES = ['online_full', 'online_deposit']
        const PROGRESSING  = ['confirmed', 'preparing', 'ready', 'delivered']
        let total_revenue = 0
        const methodCount: Record<string, number> = {}

        for (const o of orders ?? []) {
          const s = o.status as string
          if (s in byStatus) byStatus[s]++
          const isPaid =
            o.status === 'completed' ||
            o.status === 'delivered' ||
            (ONLINE_TYPES.includes((o as { payment_type?: string }).payment_type ?? '') &&
             PROGRESSING.includes(o.status ?? ''))
          if (isPaid) total_revenue += o.total_price
          if (o.payment_method) {
            methodCount[o.payment_method] = (methodCount[o.payment_method] ?? 0) + 1
          }
        }

        const periodLabel = period ?? `${days} derniers jours`

        return {
          period: periodLabel,
          total_orders: orders?.length ?? 0,
          total_revenue,
          orders_by_status: byStatus,
          payment_methods_used: methodCount,
          recent_orders: (orders ?? []).slice(0, 5).map((o) => ({
            id: o.id.slice(0, 8),
            amount: o.total_price,
            status: o.status,
            created_at: o.created_at,
          })),
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
