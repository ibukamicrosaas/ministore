// Notifications SMS via Lafricamobile (anciennement Twilio — coût trop élevé
// pour l'Afrique de l'Ouest, ~300 FCFA/SMS).
// Messages volontairement courts : 1 segment SMS = 160 chars GSM-7 (sans emoji).
// sendWhatsApp est conservé comme alias pour la compatibilité avec les appelants existants.

import { sendLafricamobileSms } from './lafricamobile'

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '')
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

export async function sendSMS(
  to: string,
  message: string,
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const result = await sendLafricamobileSms({ to: normalizePhone(to), text: message })
  if (!result.success) {
    console.error('[sms]', result.error)
    return { success: false, error: result.error }
  }
  return { success: true, sid: result.rawResponse }
}

// Alias de compatibilité — tous les appelants existants continuent de fonctionner
export const sendWhatsApp = sendSMS

// ─── Builders de messages ──────────────────────────────────────────────────
// Objectif : <= 160 chars par message (1 segment SMS, pas d'emoji).
// Les URL courtes sont conservées car nécessaires pour le suivi.

export function buildLowStockAlertMessage(params: {
  shopName: string
  productName: string
  stockCount: number
}): string {
  return `TekkiShop - ${params.shopName}: stock faible pour "${params.productName}" — plus que ${params.stockCount} unite${params.stockCount > 1 ? 's' : ''} disponible${params.stockCount > 1 ? 's' : ''}. Pensez a reapprovisionner.`
}

export function buildStockBackMessage(params: {
  shopName: string
  productName: string
  productUrl: string
}): string {
  return `${params.shopName}: "${params.productName}" est de nouveau disponible ! Commandez ici : ${params.productUrl}`
}

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

// ─── Modèle "boutique publique + commandes offertes" (trial_model='free_orders') ──

export function buildFreeOrdersActivatedMessage(params: {
  shopName: string
  releasedCount: number
  releasedTotal: string // déjà formaté dans la devise de la boutique, ex. "37 500 FCFA"
  /** Fonds de commandes digitales retenues, déjà nets de commission et formatés — voir ADDITIF-argent-commandes-retenues.md */
  unlockedFunds?: string | null
}): string {
  if (params.releasedCount === 0 && !params.unlockedFunds) {
    return `TekkiShop - ${params.shopName}: boutique activee ! Tu peux desormais recevoir des commandes sans limite.`
  }
  const parts: string[] = []
  if (params.releasedCount > 0) {
    const plural = params.releasedCount > 1 ? 's' : ''
    parts.push(`${params.releasedCount} commande${plural} t'attend${params.releasedCount > 1 ? 'ent' : ''}, pour un total de ${params.releasedTotal}`)
  }
  if (params.unlockedFunds) {
    parts.push(`${params.unlockedFunds} sont maintenant disponibles au retrait`)
  }
  return `TekkiShop - ${params.shopName}: boutique activee ! ${parts.join(', et ')}.`
}

export function buildFreeOrdersTrialExpiredMessage(params: {
  shopName: string
  upgradeUrl: string
}): string {
  return `TekkiShop - ${params.shopName}: tes 14 jours sont ecoules. Active ta boutique pour continuer a recevoir des commandes: ${params.upgradeUrl}`
}

export function buildHeldOrderClientConfirmationMessage(params: {
  shopName: string
}): string {
  return `Commande enregistree chez ${params.shopName}. Le vendeur va te contacter pour confirmer.`
}

export function buildHeldOrderMerchantAlertMessage(params: {
  totalPrice: number
  itemCount: number
  upgradeUrl: string
}): string {
  const plural = params.itemCount > 1 ? 's' : ''
  return `TekkiShop: une commande de ${params.totalPrice.toLocaleString('fr-FR')} FCFA (${params.itemCount} article${plural}) t'attend. Active ta boutique pour voir le client et la traiter: ${params.upgradeUrl}`
}

export function buildQuotaWarningMessage(params: {
  shopName: string
  orderTotal: number
  remaining: number
  upgradeUrl: string
}): string {
  return `TekkiShop - ${params.shopName}: nouvelle commande de ${params.orderTotal.toLocaleString('fr-FR')} FCFA. Il te reste ${params.remaining} commande offerte. Active ta boutique maintenant pour ne pas rater la suivante: ${params.upgradeUrl}`
}

export function buildHeldOrderClientNoticeMessage(params: {
  shopName: string
  merchantPhone: string
}): string {
  return `Bonjour, ta commande chez ${params.shopName} n'a pas pu etre traitee. Tu peux contacter le vendeur au ${params.merchantPhone}.`
}

export function buildDigitalDownloadMessage(params: {
  shopName: string
  clientName: string
  productName: string
  downloadUrl: string
  expiresHours: number
}): string {
  return `Merci ${params.clientName} ! Ton achat chez *${params.shopName}* est confirme.\n\n📄 *${params.productName}*\n\nTelecharge ton fichier ici :\n${params.downloadUrl}\n\n_Lien valide ${params.expiresHours}h — max 5 telechargements._`
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
