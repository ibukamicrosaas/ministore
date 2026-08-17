'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/**
 * Connexion country manager — e-mail + mot de passe, espace séparé des
 * marchands (téléphone + PIN, /login). Même bassin auth.users, mécanisme
 * de session identique côté Supabase, mais jamais le même formulaire ni
 * la même convention d'identifiant. Voir REPRISE.md §4 pour le contexte.
 */
export async function cmSignIn(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { error: 'E-mail et mot de passe requis.' }
  }

  const admin = createAdminClient()

  // Rate limiting : max 10 tentatives échouées sur 15 minutes — même schéma
  // que login_attempts pour signIn marchand, attempt_type distinct pour ne
  // jamais mélanger les métriques.
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count: failedCount } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', email)
    .eq('attempt_type', 'cm_login')
    .eq('success', false)
    .gte('attempted_at', windowStart)

  if ((failedCount ?? 0) >= 10) {
    return { error: 'Trop de tentatives. Réessaie dans 15 minutes.' }
  }

  const supabase = await createServerClient()
  const { error, data } = await supabase.auth.signInWithPassword({ email, password })

  await admin.from('login_attempts').insert({
    identifier: email,
    attempt_type: 'cm_login',
    success: !error,
  })

  if (error || !data.user) {
    return { error: 'E-mail ou mot de passe incorrect.' }
  }

  const { data: cm } = await (admin
    .from('country_managers' as never)
    .select('id')
    .eq('user_id' as never, data.user.id)
    .single() as unknown as Promise<{ data: { id: string } | null }>)

  if (!cm) {
    // Le compte existe et le mot de passe est correct, mais ce n'est pas un
    // country manager — ne jamais laisser cette session ouverte sur cet espace.
    await supabase.auth.signOut()
    return { error: "Ce compte n'a pas accès à l'espace country manager." }
  }

  redirect('/country-admin')
}

export async function cmSignOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/cm/login')
}
