'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    redirect('/dashboard')
  }
}

export async function addCountryManager(formData: FormData) {
  await assertAdmin()

  const phone   = (formData.get('phone')   as string | null)?.trim().replace(/\s+/g, '')
  const country = (formData.get('country') as string | null)?.trim().toUpperCase()

  if (!phone || !country) {
    redirect('/admin/country-managers?error=missing_fields')
  }

  const admin = createAdminClient()

  // Trouver l'utilisateur par téléphone via l'API admin Supabase
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) redirect('/admin/country-managers?error=lookup_failed')

  // Supabase stocke le téléphone en format E.164 (+22690000000)
  const normalize = (p: string) => p.replace(/\s+/g, '')
  const targetUser = users.find(u => u.phone && normalize(u.phone) === normalize(phone))
  if (!targetUser) redirect(`/admin/country-managers?error=user_not_found&phone=${encodeURIComponent(phone)}`)

  const { error: insertError } = await admin
    .from('country_managers' as never)
    .insert({ user_id: targetUser.id, country } as never)

  if (insertError) {
    // Contrainte unique : ce manager existe déjà pour ce pays
    if (insertError.code === '23505') {
      redirect('/admin/country-managers?error=already_exists')
    }
    redirect('/admin/country-managers?error=insert_failed')
  }

  redirect('/admin/country-managers?success=added')
}

export async function removeCountryManager(formData: FormData) {
  await assertAdmin()

  const id = formData.get('id') as string | null
  if (!id) redirect('/admin/country-managers?error=missing_id')

  const admin = createAdminClient()
  await admin.from('country_managers' as never).delete().eq('id', id)

  redirect('/admin/country-managers?success=removed')
}
