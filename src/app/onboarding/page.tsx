import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './OnboardingWizard'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `Créer ton site — ${APP_NAME}`,
}

type Props = { searchParams: Promise<{ name?: string; slug?: string }> }

export default async function OnboardingPage({ searchParams }: Props) {
  const { name: initialName } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id, phone, onboarding_step, onboarding_completed')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    shop_id: string | null
    phone: string | null
    onboarding_step: number
    onboarding_completed: boolean
  } | null

  let shopData: {
    name: string
    slug: string
    business_type: string | null
    specialty: string | null
    country: string | null
    currency: string | null
  } | null = null

  if (profile?.shop_id) {
    const { data: shop } = await supabase
      .from('shops')
      .select('name, slug, business_type, specialty, country, currency, onboarding_completed')
      .eq('id', profile.shop_id)
      .single()

    if ((shop as { onboarding_completed?: boolean } | null)?.onboarding_completed) redirect('/dashboard')
    shopData = shop as typeof shopData
  }

  const currentStep = (profile?.onboarding_step ?? 1) as 1 | 2 | 3 | 4 | 5

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <OnboardingWizard
          initialStep={currentStep}
          userPhone={profile?.phone ?? null}
          salon={shopData}
          initialName={shopData ? undefined : (initialName ?? undefined)}
        />
      </div>
    </div>
  )
}
