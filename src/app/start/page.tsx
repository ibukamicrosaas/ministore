import { createAdminClient } from '@/lib/supabase/admin'
import { StartFlow } from './StartFlow'

export const dynamic = 'force-dynamic'

export default async function StartPage() {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('shops')
    .select('id', { count: 'exact', head: true })

  const shopCount = count ?? 1000

  return <StartFlow shopCount={shopCount} />
}
