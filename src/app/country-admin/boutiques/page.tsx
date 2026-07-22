import { requireCountryManager, getCountryShops, getShopProductCounts } from '@/lib/actions/country-admin'
import { MessageCircle, ExternalLink, Search } from 'lucide-react'
import { ShopsTable } from './ShopsTable'

export const revalidate = 300

export default async function CountryAdminBoutiquesPage() {
  const { country } = await requireCountryManager()
  const shops = await getCountryShops(country)
  const shopIds = shops.map(s => s.id)
  const productCounts = await getShopProductCounts(shopIds)

  const shopsWithCounts = shops.map(s => ({
    ...s,
    product_count: productCounts[s.id] ?? 0,
  }))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Boutiques</h1>
        <p className="text-sm text-gray-500 mt-1">{shops.length} boutique{shops.length > 1 ? 's' : ''} au total</p>
      </div>

      <ShopsTable shops={shopsWithCounts} />
    </div>
  )
}
