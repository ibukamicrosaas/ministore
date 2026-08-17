'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { APP_URL } from '@/constants'
import { sendCountryManagerInviteEmail } from '@/lib/notifications/email'

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

  const email   = (formData.get('email')   as string | null)?.trim().toLowerCase()
  const name    = (formData.get('name')    as string | null)?.trim()
  const country = (formData.get('country') as string | null)?.trim().toUpperCase()

  if (!email || !name || !country) {
    redirect('/admin/country-managers?error=missing_fields')
  }

  const admin = createAdminClient()

  // Chercher un compte auth.users existant pour cet e-mail — un country
  // manager peut déjà avoir un compte (deuxième pays, ré-invitation après
  // suppression). Espace d'authentification séparé des marchands (e-mail +
  // mot de passe, jamais le tour de l'e-mail synthétique téléphone) : pas
  // le même mécanisme de recherche que l'ancien flux, volontairement.
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) redirect('/admin/country-managers?error=lookup_failed')

  let userId = users.find(u => u.email?.toLowerCase() === email)?.id

  if (!userId) {
    // Nouveau compte : generateLink crée l'utilisateur ET renvoie le lien
    // d'invitation, envoyé nous-mêmes via Resend (pas le mailer intégré
    // Supabase, limité à quelques e-mails/heure — voir lib/notifications/email.ts).
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type:  'invite',
      email,
      options: { redirectTo: `${APP_URL}/cm/login` },
    })

    if (linkError || !linkData.user) {
      console.error('[addCountryManager] generateLink', linkError?.message)
      redirect('/admin/country-managers?error=invite_failed')
    }

    userId = linkData.user.id

    await sendCountryManagerInviteEmail({
      toEmail:      email,
      name,
      countryLabel: country,
      inviteLink:   linkData.properties.action_link,
    })
  }

  const { error: insertError } = await admin
    .from('country_managers' as never)
    .insert({ user_id: userId, country, name } as never)

  if (insertError) {
    // Contrainte unique : ce user_id gère déjà un pays (un CM = un seul pays)
    if (insertError.code === '23505') {
      redirect('/admin/country-managers?error=already_exists')
    }
    console.error('[addCountryManager] insert', insertError.message)
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
