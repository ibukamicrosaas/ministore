import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_URL } from '@/constants'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${APP_URL}/login`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/legal/cgu`,     lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/legal/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const supabase = createAdminClient()

    // Boutiques actives avec plan payant
    const { data: shops } = await supabase
      .from('shops')
      .select('slug, updated_at')
      .eq('is_active', true)
      .neq('plan', 'trial')
      .limit(1000)

    const shopRoutes: MetadataRoute.Sitemap = (shops ?? []).map(s => ({
      url:             `${APP_URL}/${s.slug}`,
      lastModified:    new Date(s.updated_at ?? Date.now()),
      changeFrequency: 'daily',
      priority:        0.8,
    }))

    // Produits actifs avec slug SEO (jointure implicite via shop_id)
    const shopIds = (shops ?? []).map(s => s.slug)

    // On récupère les produits via les slugs de boutiques — max 2000 produits
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, updated_at, shops!inner(slug, is_active, plan)')
      .eq('is_active', true)
      .not('slug', 'is', null)
      .limit(2000) as unknown as {
        data: { id: string; slug: string | null; updated_at: string; shops: { slug: string; is_active: boolean; plan: string } }[] | null
      }

    const productRoutes: MetadataRoute.Sitemap = (products ?? [])
      .filter(p => p.slug && p.shops.is_active && p.shops.plan !== 'trial')
      .map(p => ({
        url:             `${APP_URL}/${p.shops.slug}/produit/${p.slug}`,
        lastModified:    new Date(p.updated_at ?? Date.now()),
        changeFrequency: 'weekly',
        priority:        0.6,
      }))

    return [...staticRoutes, ...shopRoutes, ...productRoutes]
  } catch {
    return staticRoutes
  }
}
