'use server'

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

  const supabase = await createServerClient()
  const email = phoneToEmail(phone)
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

  // Vérifier que le compte existe — réponse identique si non (évite de révéler l'existence du compte)
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
  if (listError) return { error: 'Erreur serveur.' }

  const existingUser = users.find(u => u.email === phoneEmail)
  if (!existingUser) {
    // Réponse générique : ne pas révéler que le compte n'existe pas
    return { success: true }
  }

  // Générer un code à 6 chiffres (usage manuel — compensé par le rate limiting strict)
  const token = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  // Invalider les anciens tokens non utilisés
  await admin.from('pin_resets').update({ used: true }).eq('phone_email', phoneEmail).eq('used', false)

  const { error: insertError } = await admin.from('pin_resets').insert({
    phone_email: phoneEmail,
    token,
    expires_at: expiresAt,
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

  // Vérifier le token
  const { data: resetData, error: fetchError } = await admin
    .from('pin_resets')
    .select('*')
    .eq('phone_email', phoneEmail)
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !resetData) {
    return { error: 'Code invalide ou expiré.' }
  }

  // Trouver l'utilisateur Supabase
  const { data: { users } } = await admin.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === phoneEmail)
  if (!existingUser) return { error: 'Compte introuvable.' }

  // Mettre à jour le mot de passe (PIN)
  const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
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
