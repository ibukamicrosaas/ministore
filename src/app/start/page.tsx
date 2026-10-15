import { getPublicOrdersCount } from '@/lib/public-stats'
import { StartFlow } from './StartFlow'

export const dynamic = 'force-dynamic'

export default async function StartPage() {
  const ordersCount = await getPublicOrdersCount()

  return <StartFlow ordersCount={ordersCount} />
}
