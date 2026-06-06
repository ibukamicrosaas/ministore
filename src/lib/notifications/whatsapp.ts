// Notifications SMS via Twilio (anciennement WhatsApp).
// Messages volontairement courts : 1 segment SMS = 160 chars GSM-7 (sans emoji).
// sendWhatsApp est conservé comme alias pour la compatibilité avec les appelants existants.

import twilio from 'twilio'

function getClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) throw new Error('Twilio credentials not configured')
  return twilio(sid, token)
}

// Numéro SMS Twilio (format E.164, ex: +14155551234)
const FROM_SMS = process.env.TWILIO_PHONE_NUMBER ?? ''

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '')
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

export async function sendSMS(
  to: string,
  message: string,
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = getClient()
    const msg = await client.messages.create({
      from: FROM_SMS,
      to:   normalizePhone(to),
      body: message,
    })
    return { success: true, sid: msg.sid }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error('[sms]', error)
    return { success: false, error }
  }
}

// Alias de compatibilité — tous les appelants existants continuent de fonctionner
export const sendWhatsApp = sendSMS

// ─── Builders de messages ──────────────────────────────────────────────────
// Objectif : <= 160 chars par message (1 segment SMS, pas d'emoji).
// Les URL courtes sont conservées car nécessaires pour le suivi.

export function buildOrderStatusMessage(params: {
  shopName: string
  clientName: string
  newStatus: 'confirmed' | 'preparing' | 'ready' | 'delivered'
  deliveryType: 'home_delivery' | 'store_pickup'
  deliveryDate?: string
  orderRef: string
}): string | null {
  const ref = `Ref #${params.orderRef.slice(0, 8).toUpperCase()}`
  switch (params.newStatus) {
    case 'confirmed':
      return `${params.shopName}: votre commande ${ref} est confirmee! Nous preparons votre ${params.deliveryType === 'home_delivery' ? 'livraison' : 'colis'}.`
    case 'preparing':
      return `${params.shopName}: votre commande ${ref} est en preparation.`
    case 'ready':
      return params.deliveryType === 'home_delivery'
        ? `${params.shopName}: votre commande ${ref} est prete et sera livree${params.deliveryDate ? ` le ${params.deliveryDate}` : ' bientot'}.`
        : `${params.shopName}: votre commande ${ref} est prete a retirer en boutique!`
    default:
      return null
  }
}

export function buildOrderCancelledMessage(params: {
  shopName: string
  orderRef: string
  reason?: string
}): string {
  const ref    = `Ref #${params.orderRef.slice(0, 8).toUpperCase()}`
  const reason = params.reason ? ` Motif: ${params.reason}` : ''
  return `${params.shopName}: votre commande ${ref} a ete annulee.${reason} Contactez-nous pour plus d'infos.`
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
  const delivery = params.deliveryType === 'home_delivery' ? 'Livraison' : 'Retrait boutique'
  const date     = params.deliveryDate ? ` le ${params.deliveryDate}` : ''
  return `Commande confirmee chez ${params.shopName}!\n${params.items}\nTotal: ${params.totalPrice.toLocaleString('fr-FR')} FCFA | ${delivery}${date}\n${params.orderUrl}`
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
  const delivery = params.deliveryType === 'home_delivery' ? 'Livraison' : 'Retrait'
  const payment  = params.paymentType === 'on_delivery' ? 'A la reception' : params.paymentType === 'on_site' ? 'En boutique' : 'Paye en ligne'
  const date     = params.deliveryDate ? ` | ${params.deliveryDate}` : ''
  return `Nouvelle commande - ${params.clientName} (${params.clientPhone})\n${params.items}\n${params.totalPrice.toLocaleString('fr-FR')} FCFA | ${delivery}${date} | ${payment}`
}

export function buildOrderReminderMessage(params: {
  shopName: string
  clientName: string
  deliveryDate: string
  deliveryType: 'home_delivery' | 'store_pickup'
  orderUrl: string
}): string {
  const delivery = params.deliveryType === 'home_delivery' ? 'livraison' : 'retrait en boutique'
  return `Rappel ${params.shopName}: votre ${delivery} est prevu demain (${params.deliveryDate}).\n${params.orderUrl}`
}

export function buildTrialReminderMessage(params: {
  shopName: string
  daysLeft: number
  upgradeUrl: string
}): string {
  return `TekkiShop - ${params.shopName}: votre essai gratuit expire dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''}. Activez votre boutique: ${params.upgradeUrl}`
}

export function buildTrialExpiredMessage(params: {
  shopName: string
  upgradeUrl: string
}): string {
  return `TekkiShop - ${params.shopName}: votre essai est termine. Votre boutique est suspendue. Choisissez un plan pour la reactiver: ${params.upgradeUrl}`
}

export function buildSubscriptionReminderMessage(params: {
  shopName: string
  planLabel: string
  daysLeft: number
  renewUrl: string
}): string {
  return `TekkiShop - ${params.shopName}: abonnement ${params.planLabel} expire dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''}. Renouvelez: ${params.renewUrl}`
}

export function buildPlanActivatedMessage(params: {
  shopName: string
  planLabel: string
  dashboardUrl: string
}): string {
  return `TekkiShop - ${params.shopName}: plan ${params.planLabel} active! Votre boutique est en ligne. Dashboard: ${params.dashboardUrl}`
}

export function buildSubscriptionExpiredMessage(params: {
  shopName: string
  planLabel: string
  renewUrl: string
}): string {
  return `TekkiShop - ${params.shopName}: abonnement ${params.planLabel} expire. Boutique suspendue. Renouvelez: ${params.renewUrl}`
}

// ─── Builders non utilisés dans MiniStore (hérités BeautyDesk) ─────────────

export function buildBookingConfirmationMessage(params: {
  salonName: string; serviceName: string; date: string; time: string
  depositAmount: number; remainingAmount: number; bookingUrl: string
}): string {
  return `Reservation confirmee chez ${params.salonName} - ${params.serviceName} le ${params.date} a ${params.time}. Acompte: ${params.depositAmount.toLocaleString('fr-FR')} FCFA. Solde: ${params.remainingAmount.toLocaleString('fr-FR')} FCFA.\n${params.bookingUrl}`
}

export function buildNewBookingAlertMessage(params: {
  clientName: string; serviceName: string; date: string; time: string; depositAmount: number
}): string {
  return `Nouvelle reservation - ${params.clientName} | ${params.serviceName} le ${params.date} a ${params.time} | Acompte: ${params.depositAmount.toLocaleString('fr-FR')} FCFA`
}

export function buildReminderMessage(params: {
  salonName: string; serviceName: string; date: string; time: string; bookingUrl: string
}): string {
  return `Rappel RDV demain chez ${params.salonName} - ${params.serviceName} le ${params.date} a ${params.time}.\n${params.bookingUrl}`
}

export function buildClientCancelledAlertMessage(params: {
  clientName: string; serviceName: string; date: string; time: string; refundAmount: number
}): string {
  const refund = params.refundAmount > 0 ? `Remboursement: ${params.refundAmount.toLocaleString('fr-FR')} FCFA.` : 'Aucun remboursement.'
  return `Annulation - ${params.clientName} | ${params.serviceName} le ${params.date} a ${params.time}. ${refund}`
}

export function buildCancellationMessage(params: {
  salonName: string; serviceName: string; date: string; refundAmount: number
}): string {
  const refund = params.refundAmount > 0 ? `Remboursement: ${params.refundAmount.toLocaleString('fr-FR')} FCFA en cours.` : 'Acompte retenu.'
  return `Reservation annulee chez ${params.salonName} - ${params.serviceName} le ${params.date}. ${refund}`
}
