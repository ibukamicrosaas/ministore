import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './OnboardingWizard'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `Configurer votre salon — ${APP_NAME}`,
}

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger le profil avec la progression
  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id, phone, onboarding_step, onboarding_completed')
    .eq('id', user.id)
    .single()

  // Déjà terminé → le middleware redirige vers /dashboard à la prochaine navigation

  // Charger le salon si existant (pour reprendre)
  let salonData: {
    name: string
    slug: string
    business_type: string | null
    specialty: string | null
  } | null = null

  if (profile?.salon_id) {
    const { data: salon } = await supabase
      .from('salons')
      .select('name, slug, business_type, specialty, onboarding_completed')
      .eq('id', profile.salon_id)
      .single()

    if (salon?.onboarding_completed) redirect('/dashboard')
    salonData = salon
  }

  const currentStep = (profile?.onboarding_step ?? 1) as 1 | 2 | 3 | 4 | 5

  return (
    <OnboardingWizard
      initialStep={currentStep}
      userPhone={profile?.phone ?? null}
      salon={salonData}
    />
  )
}
