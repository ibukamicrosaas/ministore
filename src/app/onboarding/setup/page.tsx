import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupWizard } from './SetupWizard'
import { APP_NAME } from '@/constants'
import type { Profile } from '@/types'

export const metadata = {
  title: `Configuration du salon — ${APP_NAME}`,
}

export default async function SetupPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id, first_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id' | 'first_name'> | null
  if (!profile?.salon_id) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E85D04] text-white text-xl font-bold mb-4">
            B
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configurons votre salon</h1>
          <p className="mt-2 text-sm text-gray-500">
            2 étapes rapides pour démarrer
          </p>
        </div>
        <SetupWizard />
      </div>
    </div>
  )
}
