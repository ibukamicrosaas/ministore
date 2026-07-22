'use server'

import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/notifications/whatsapp'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { TRIAL_DAYS } from '@/constants'

// Normalise un numéro de téléphone en identifiant Supabase
// Ex: "+221 77 123 45 67" → "221771234567@beautydesk.app"
// IMPORTANT: ce domaine est un identifiant interne Supabase — ne pas changer
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@beautydesk.app`
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('00') ? `+${digits.slice(2)}` : `+${digits}`
}

export async function signIn(formData: FormData) {
  const phone = (formData.get('phone') as string)?.trim()
  const pin = (formData.get('pin') as string)?.trim()

  if (!phone || !pin) {
    return { error: 'Numéro de téléphone et code PIN requis.' }
  }

  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return { error: 'Le code PIN doit contenir exactement 6 chiffres.' }
  }

  const admin = createAdminClient()
  const email = phoneToEmail(phone)

  // Rate limiting : max 10 tentatives échouées sur 15 minutes
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count: failedCount } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', email)
    .eq('attempt_type', 'login')
    .eq('success', false)
    .gte('attempted_at', windowStart)

  if ((failedCount ?? 0) >= 10) {
    return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: pin })

  // Enregistrer la tentative (succès ou échec)
  await admin.from('login_attempts').insert({
    identifier: email,
    attempt_type: 'login',
    success: !error,
  })

  if (error) {
    console.error('[signIn]', error.message)
    return { error: 'Numéro ou code PIN incorrect.' }
  }

  // Country managers → espace dédié
  const { data: { user: loggedUser } } = await supabase.auth.getUser()
  if (loggedUser) {
    const { data: cm } = await (admin
      .from('country_managers' as never)
      .select('country')
      .eq('user_id' as never, loggedUser.id)
      .single() as unknown as Promise<{ data: { country: string } | null }>)
    if (cm) redirect('/country-admin')
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const phone = (formData.get('phone') as string)?.trim()
  const pin = (formData.get('pin') as string)?.trim()

  if (!phone || !pin) {
    return { error: 'Numéro de téléphone et code PIN requis.' }
  }

  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return { error: 'Le code PIN doit contenir exactement 6 chiffres.' }
  }

  const admin = createAdminClient()
  const email = phoneToEmail(phone)

  // Rate limiting : max 3 créations de compte par numéro par heure
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: signupCount } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', email)
    .eq('attempt_type', 'signup')
    .gte('attempted_at', windowStart)

  if ((signupCount ?? 0) >= 3) {
    return { error: 'Trop de tentatives. Réessayez dans 1 heure.' }
  }

  const supabase = await createServerClient()
  const normalizedPhone = normalizePhone(phone)

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pin,
    options: {
      data: { phone: normalizedPhone },
    },
  })

  // Enregistrer la tentative d'inscription (rate limiting)
  void admin.from('login_attempts').insert({
    identifier:   email,
    attempt_type: 'signup',
    success:      !error,
  })

  if (error) {
    console.error('[signUp]', error.message)
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Un compte existe déjà avec ce numéro.' }
    }
    return { error: 'Impossible de créer le compte. Réessaie.' }
  }

  if (data.user) {
    await supabase
      .from('profiles')
      .update({ phone: normalizedPhone, role: 'owner' })
      .eq('id', data.user.id)
  }

  redirect('/onboarding')
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function changePin(currentPin: string, newPin: string) {
  if (!currentPin || !newPin) return { error: 'Données manquantes.' }

  if (!/^\d{6}$/.test(currentPin)) return { error: 'Le PIN actuel doit contenir 6 chiffres.' }
  if (!/^\d{6}$/.test(newPin))     return { error: 'Le nouveau PIN doit contenir 6 chiffres.' }
  if (currentPin === newPin)       return { error: 'Le nouveau PIN doit être différent de l\'actuel.' }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Non authentifié.' }

  // MED-1 : rate limit anti-brute-force sur le PIN actuel (5 tentatives / 15 min)
  const admin = createAdminClient()
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count: changeAttempts } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', `pin_change:${user.id}`)
    .eq('attempt_type', 'pin_change')
    .gte('attempted_at', fifteenMinsAgo)

  if ((changeAttempts ?? 0) >= 5) {
    return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
  }
  void admin.from('login_attempts').insert({
    identifier:   `pin_change:${user.id}`,
    attempt_type: 'pin_change',
    success:      true,
  })

  // Vérifier le PIN actuel via re-signin silencieux
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email:    user.email,
    password: currentPin,
  })
  if (signInError) return { error: 'Code PIN actuel incorrect.' }

  // Mettre à jour le PIN
  const { error: updateError } = await supabase.auth.updateUser({ password: newPin })
  if (updateError) {
    console.error('[changePin]', updateError.message)
    return { error: 'Impossible de modifier le PIN. Réessaie.' }
  }

  return { success: true }
}

export async function getSession() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

export async function requestPinReset(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return { error: 'Numéro de téléphone requis.' }

  const normalizedPhone = normalizePhone(trimmed)
  const phoneEmail = phoneToEmail(trimmed)

  const admin = createAdminClient()

  // Rate limiting : max 3 demandes par heure — vérifier AVANT de confirmer l'existence du compte
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await admin
    .from('pin_resets')
    .select('*', { count: 'exact', head: true })
    .eq('phone_email', phoneEmail)
    .gte('created_at', oneHourAgo)

  if ((recentCount ?? 0) >= 3) {
    return { error: 'Trop de tentatives. Réessayez dans 1 heure.' }
  }

  // Vérifier l'existence du compte via la table profiles (indexée sur phone)
  // — évite de charger tous les users en mémoire (listUsers sans pagination)
  const { data: profileRecord } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', normalizedPhone)
    .single()

  if (!profileRecord) {
    // Réponse générique : ne pas révéler que le compte n'existe pas
    return { success: true }
  }

  // Code à 6 chiffres via CSPRNG (crypto.randomInt garantit une distribution uniforme)
  const token = String(crypto.randomInt(100000, 1000000))
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  // Invalider les anciens tokens non utilisés
  await admin.from('pin_resets').update({ used: true }).eq('phone_email', phoneEmail).eq('used', false)

  // HIGH-3 : stocker le hash du token — jamais le code en clair
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const { error: insertError } = await admin.from('pin_resets').insert({
    phone_email: phoneEmail,
    token:       tokenHash,
    expires_at:  expiresAt,
  })

  if (insertError) {
    console.error('[requestPinReset]', insertError.message)
    return { error: 'Impossible d\'envoyer le code. Réessaie.' }
  }

  const message = `🔐 *Réinitialisation PIN TekkiShop*\n\nVotre code de réinitialisation : *${token}*\n\nValable 15 minutes. Ne le partagez pas.`
  const { success, error: waError } = await sendWhatsApp(normalizedPhone, message)

  if (!success) {
    console.error('[requestPinReset] WhatsApp error:', waError)
    return { error: 'Impossible d\'envoyer le SMS. Vérifiez votre numéro WhatsApp.' }
  }

  return { success: true }
}

export async function confirmPinReset(phone: string, token: string, newPin: string) {
  const trimmed = phone.trim()
  if (!trimmed || !token || !newPin) return { error: 'Données manquantes.' }

  if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
    return { error: 'Le nouveau PIN doit contenir exactement 6 chiffres.' }
  }

  const phoneEmail = phoneToEmail(trimmed)
  const admin = createAdminClient()

  // CRIT-3 : rate limit anti-brute-force (5 échecs / 30 min → invalide le token)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { count: failCount } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', `pin_reset_confirm:${phoneEmail}`)
    .eq('attempt_type', 'pin_reset_confirm')
    .eq('success', false)
    .gte('attempted_at', thirtyMinsAgo)

  if ((failCount ?? 0) >= 5) {
    await admin.from('pin_resets').update({ used: true }).eq('phone_email', phoneEmail).eq('used', false)
    return { error: 'Trop de tentatives incorrectes. Demandez un nouveau code de réinitialisation.' }
  }

  // Récupérer le token par numéro seulement, puis comparer le hash en timing-safe
  const { data: resetData, error: fetchError } = await admin
    .from('pin_resets')
    .select('*')
    .eq('phone_email', phoneEmail)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // HIGH-3 : comparer SHA-256(token_soumis) === hash_stocké en temps constant
  const hashedSubmitted = crypto.createHash('sha256').update(token).digest('hex')
  const tokenValid = resetData && (() => {
    try {
      const a = Buffer.from(hashedSubmitted, 'hex')
      const b = Buffer.from(resetData.token, 'hex')
      return a.length === b.length && crypto.timingSafeEqual(a, b)
    } catch { return false }
  })()

  if (fetchError || !resetData || !tokenValid) {
    void admin.from('login_attempts').insert({
      identifier:   `pin_reset_confirm:${phoneEmail}`,
      attempt_type: 'pin_reset_confirm',
      success:      false,
    })
    return { error: 'Code invalide ou expiré.' }
  }

  // Trouver l'utilisateur via profiles (indexé) puis mettre à jour via son id
  const { data: profileToReset } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', normalizePhone(phone))
    .single()

  if (!profileToReset) return { error: 'Compte introuvable.' }

  // Mettre à jour le mot de passe (PIN)
  const { error: updateError } = await admin.auth.admin.updateUserById(profileToReset.id, {
    password: newPin,
  })

  if (updateError) {
    console.error('[confirmPinReset]', updateError.message)
    return { error: 'Impossible de mettre à jour le PIN.' }
  }

  // Marquer le token comme utilisé
  await admin.from('pin_resets').update({ used: true }).eq('id', resetData.id)

  return { success: true }
}
