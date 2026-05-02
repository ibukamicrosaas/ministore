import twilio from 'twilio'

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) throw new Error('Twilio credentials not configured')
  return twilio(sid, token)
}

const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM ?? ''}`

function toWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '')
  const normalized = cleaned.startsWith('+') ? cleaned : `+${cleaned}`
  return `whatsapp:${normalized}`
}

export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = getClient()
    const msg = await client.messages.create({
      from: FROM,
      to: toWhatsApp(to),
      body: message,
    })
    return { success: true, sid: msg.sid }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error('[whatsapp]', error)
    return { success: false, error }
  }
}

export function buildBookingConfirmationMessage(params: {
  salonName: string
  serviceName: string
  date: string
  time: string
  depositAmount: number
  remainingAmount: number
  bookingUrl: string
}): string {
  return `✅ *Votre réservation chez ${params.salonName} est confirmée !*

📋 Service : ${params.serviceName}
📅 Date : ${params.date} à ${params.time}
💳 Acompte payé : ${params.depositAmount.toLocaleString('fr-FR')} FCFA
💰 Solde à régler sur place : ${params.remainingAmount.toLocaleString('fr-FR')} FCFA

Gérer votre réservation : ${params.bookingUrl}`
}

export function buildNewBookingAlertMessage(params: {
  clientName: string
  serviceName: string
  date: string
  time: string
  depositAmount: number
}): string {
  return `🔔 *Nouvelle réservation !*

👤 Cliente : ${params.clientName}
📋 Service : ${params.serviceName}
📅 Date : ${params.date} à ${params.time}
💳 Acompte reçu : ${params.depositAmount.toLocaleString('fr-FR')} FCFA ✓`
}

export function buildReminderMessage(params: {
  salonName: string
  serviceName: string
  date: string
  time: string
  bookingUrl: string
}): string {
  return `⏰ *Rappel de rendez-vous*

Vous avez RDV demain chez *${params.salonName}*
📋 Service : ${params.serviceName}
📅 ${params.date} à ${params.time}

Besoin de modifier ? ${params.bookingUrl}`
}

export function buildClientCancelledAlertMessage(params: {
  clientName: string
  serviceName: string
  date: string
  time: string
  refundAmount: number
}): string {
  const refundText =
    params.refundAmount > 0
      ? `Remboursement de ${params.refundAmount.toLocaleString('fr-FR')} FCFA à traiter.`
      : `Aucun remboursement (hors délai ou pas d'acompte).`

  return `🚫 *Annulation cliente*

👤 ${params.clientName}
📋 ${params.serviceName}
📅 ${params.date} à ${params.time}

${refundText}`
}

export function buildTrialReminderMessage(params: {
  salonName: string
  daysLeft: number
  upgradeUrl: string
}): string {
  return `⏳ *Votre essai Sheka expire dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''} !*

Bonjour ${params.salonName} 👋

Votre période d'essai gratuite se termine bientôt. Pour continuer à recevoir des réservations en ligne, choisissez un plan avant la date d'expiration.

👉 ${params.upgradeUrl}

Paiement simple par Wave ou Orange Money. Des questions ? Répondez à ce message !`
}

export function buildTrialExpiredMessage(params: {
  salonName: string
  upgradeUrl: string
}): string {
  return `🔴 *Votre essai Sheka est terminé*

Bonjour ${params.salonName},

Votre période d'essai gratuite est expirée. Votre page de réservation est temporairement suspendue.

Pour la réactiver, choisissez un plan :
👉 ${params.upgradeUrl}

Paiement par Wave ou Orange Money. Répondez à ce message pour toute question.`
}

export function buildCancellationMessage(params: {
  salonName: string
  serviceName: string
  date: string
  refundAmount: number
}): string {
  const refundText =
    params.refundAmount > 0
      ? `Remboursement de ${params.refundAmount.toLocaleString('fr-FR')} FCFA en cours.`
      : `L'acompte a été retenu selon la politique du salon.`

  return `❌ *Réservation annulée*

Votre réservation chez ${params.salonName}
📋 Service : ${params.serviceName}
📅 Date : ${params.date}

${refundText}`
}
