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

export function buildOrderConfirmationMessage(params: {
  shopName: string
  clientName: string
  items: string
  totalPrice: number
  deliveryType: 'home_delivery' | 'store_pickup'
  deliveryDate?: string
  paymentType: string
  orderUrl: string
}): string {
  const deliveryText = params.deliveryType === 'home_delivery'
    ? `📦 Livraison à domicile${params.deliveryDate ? ` le ${params.deliveryDate}` : ''}`
    : `🏪 Retrait en boutique${params.deliveryDate ? ` le ${params.deliveryDate}` : ''}`

  const paymentText = params.paymentType === 'on_delivery'
    ? '💵 Paiement à la réception'
    : params.paymentType === 'on_site'
    ? '🏪 Paiement en boutique'
    : '✅ Paiement en ligne confirmé'

  return `✅ *Commande confirmée chez ${params.shopName} !*

Bonjour ${params.clientName} 👋

🛒 Articles :
${params.items}

💰 Total : ${params.totalPrice.toLocaleString('fr-FR')} FCFA
${deliveryText}
${paymentText}

Voir votre commande : ${params.orderUrl}`
}

export function buildNewOrderAlertMessage(params: {
  clientName: string
  clientPhone: string
  items: string
  totalPrice: number
  deliveryType: 'home_delivery' | 'store_pickup'
  deliveryDate?: string
  paymentType: string
}): string {
  const deliveryText = params.deliveryType === 'home_delivery' ? 'Livraison à domicile' : 'Retrait en boutique'
  const paymentText = params.paymentType === 'on_delivery' ? 'À la réception' : params.paymentType === 'on_site' ? 'En boutique' : 'Payé en ligne'

  return `🔔 *Nouvelle commande !*

👤 Client : ${params.clientName} · ${params.clientPhone}
🛒 Articles :
${params.items}
💰 Total : ${params.totalPrice.toLocaleString('fr-FR')} FCFA
${params.deliveryDate ? `📅 Date : ${params.deliveryDate}` : ''}
📦 Livraison : ${deliveryText}
💳 Paiement : ${paymentText}`
}

export function buildOrderReminderMessage(params: {
  shopName: string
  clientName: string
  deliveryDate: string
  deliveryType: 'home_delivery' | 'store_pickup'
  orderUrl: string
}): string {
  const deliveryText = params.deliveryType === 'home_delivery'
    ? `📦 Livraison prévue demain (${params.deliveryDate})`
    : `🏪 Retrait en boutique demain (${params.deliveryDate})`

  return `⏰ *Rappel de commande*

Bonjour ${params.clientName} 👋

Votre commande chez *${params.shopName}* est prévue pour demain.
${deliveryText}

Voir les détails : ${params.orderUrl}`
}

export function buildTrialReminderMessage(params: {
  shopName: string
  daysLeft: number
  upgradeUrl: string
}): string {
  return `⏳ *Votre essai TekkiShop expire dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''} !*

Bonjour ${params.shopName} 👋

Votre période d'essai gratuite se termine bientôt. Pour continuer à recevoir des commandes en ligne, choisissez un plan avant la date d'expiration.

👉 ${params.upgradeUrl}

Paiement simple par Wave ou Orange Money. Des questions ? Répondez à ce message !`
}

export function buildTrialExpiredMessage(params: {
  shopName: string
  upgradeUrl: string
}): string {
  return `🔴 *Votre essai TekkiShop est terminé*

Bonjour ${params.shopName},

Votre période d'essai gratuite est expirée. Votre mini site est temporairement suspendu.

Pour le réactiver, choisissez un plan :
👉 ${params.upgradeUrl}

Paiement par Wave ou Orange Money. Répondez à ce message pour toute question.`
}

export function buildSubscriptionReminderMessage(params: {
  shopName: string
  planLabel: string
  daysLeft: number
  renewUrl: string
}): string {
  return `⏳ *Abonnement TEKKIShop — Renouvellement dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''}*

Bonjour ${params.shopName} 👋

Ton abonnement *Plan ${params.planLabel}* expire dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''}. Pour continuer à recevoir des commandes en ligne, renouvelle-le avant la date d'expiration.

👉 ${params.renewUrl}

Paiement simple par Wave ou Orange Money. Des questions ? Réponds à ce message !`
}

export function buildSubscriptionExpiredMessage(params: {
  shopName: string
  planLabel: string
  renewUrl: string
}): string {
  return `🔴 *Abonnement TEKKIShop expiré*

Bonjour ${params.shopName},

Ton abonnement *Plan ${params.planLabel}* est expiré. Ton mini-site est temporairement suspendu et tes clients ne peuvent plus passer de commandes.

Pour le réactiver, renouvelle ton abonnement :
👉 ${params.renewUrl}

Paiement par Wave ou Orange Money. Réponds à ce message pour toute question.`
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
