import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { fixShopCountriesByCity } from '@/lib/actions/fix-shop-countries'

/**
 * Admin endpoint to fix shop countries based on city
 * Protected: requires admin authentication
 */
export async function POST(req: NextRequest) {
  // Verify admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  if (!user || !adminIds.includes(user.id)) {
    return NextResponse.json(
      { error: 'Unauthorized - admin access required' },
      { status: 401 }
    )
  }

  try {
    const result = await fixShopCountriesByCity()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[fix-countries] Error:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la correction des pays' },
      { status: 500 }
    )
  }
}
