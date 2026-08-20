import { Resend } from 'resend'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Si l'env contient seulement un email (ex: support@tekki.shop), on ajoute le display name.
// Si quelqu'un a copié la ligne .env entière comme valeur (ex: RESEND_FROM_EMAIL=support@...),
// on tombe sur le fallback — ça évite un from malformé en prod.
const _rawFrom = process.env.RESEND_FROM_EMAIL ?? ''
const _fromEmail = _rawFrom.includes('@') ? _rawFrom : 'noreply@tekki.shop'
const FROM_ADDRESS = `TEKKIShop <${_fromEmail}>`

interface NewOrderAlertParams {
  toEmail: string
  shopName: string
  clientName: string
  clientPhone: string
  items: string
  totalPrice: number
  deliveryType: 'home_delivery' | 'store_pickup'
  deliveryDate?: string | null
  orderDashboardUrl: string
}

export async function sendNewOrderAlertEmail(params: NewOrderAlertParams): Promise<void> {
  if (!resend) return

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f172a;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Nouvelle commande</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:700;">${params.shopName}</h1>
    </div>
    <div style="padding:28px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        <strong>${params.clientName}</strong> vient de passer une commande.
      </p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Articles</p>
        <pre style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap;font-family:inherit;">${params.items}</pre>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Client</td>
          <td style="padding:6px 0;text-align:right;">${params.clientName} · ${params.clientPhone}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:10px 0 0;font-weight:700;">Total</td>
          <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;">${params.totalPrice.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      </table>
      <a href="${params.orderDashboardUrl}"
         style="display:block;text-align:center;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 24px;border-radius:10px;">
        Gérer la commande →
      </a>
    </div>
  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [params.toEmail],
      subject: `Nouvelle commande — ${params.clientName} · ${params.totalPrice.toLocaleString('fr-FR')} FCFA`,
      html,
    })
  } catch (err) {
    console.error('[email] sendNewOrderAlertEmail failed:', err)
  }
}

interface ReviewRequestParams {
  toEmail: string
  clientName: string
  shopName: string
  shopColor: string
  shopLogoUrl?: string | null
  productNames: string[]  // noms des produits commandés
  reviewUrl: string       // /{shopSlug}/avis/{clientToken}
}

export async function sendReviewRequestEmail(params: ReviewRequestParams): Promise<void> {
  if (!resend) return

  const productList = params.productNames
    .map(n => `<li style="margin:4px 0;color:#374151;font-size:14px;">${n}</li>`)
    .join('')

  const accentColor = params.shopColor ?? '#0EA5E9'

  const logoBlock = params.shopLogoUrl
    ? `<img src="${params.shopLogoUrl}" alt="${params.shopName}" style="height:40px;width:40px;object-fit:cover;border-radius:10px;margin-bottom:4px;">`
    : `<div style="display:inline-flex;align-items:center;justify-content:center;height:40px;width:40px;border-radius:10px;background:${accentColor};color:#fff;font-weight:700;font-size:18px;">${params.shopName[0]?.toUpperCase()}</div>`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

    <!-- En-tête -->
    <div style="padding:28px 28px 20px;text-align:center;border-bottom:1px solid #f3f4f6;">
      ${logoBlock}
      <p style="margin:10px 0 0;font-size:13px;font-weight:600;color:#6b7280;">${params.shopName}</p>
    </div>

    <!-- Corps -->
    <div style="padding:28px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
        Bonjour ${params.clientName} 👋
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        Merci pour ta commande ! Ton avis sur ta/tes achat(s) aide les autres clients à choisir.
        Ça prend moins d'une minute. 😊
      </p>

      <!-- Produits -->
      <div style="background:#f9fafb;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Ta commande</p>
        <ul style="margin:0;padding-left:16px;">${productList}</ul>
      </div>

      <!-- CTA -->
      <a href="${params.reviewUrl}"
         style="display:block;text-align:center;background:${accentColor};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 24px;border-radius:12px;margin-bottom:18px;">
        ⭐ Laisser mon avis →
      </a>

      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
        Ou accède directement à : <a href="${params.reviewUrl}" style="color:${accentColor};">${params.reviewUrl}</a>
      </p>
    </div>

    <!-- Pied de page -->
    <div style="border-top:1px solid #e5e7eb;padding:16px 28px;background:#f9fafb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Cet e-mail t'a été envoyé suite à ta commande sur la boutique <strong>${params.shopName}</strong>.
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [params.toEmail],
      subject: `Ton avis compte ! Comment s'est passée ta commande chez ${params.shopName} ?`,
      html,
    })
  } catch (err) {
    console.error('[email] sendReviewRequestEmail failed:', err)
  }
}

interface OrderConfirmationParams {
  toEmail: string
  clientName: string
  shopName: string
  shopSlug: string
  orderId: string
  clientToken: string
  currency: ShopCurrency
  items: string        // texte préformaté "• Produit ×2 — 5 000 FCFA", déjà formaté dans la devise du shop (currency ci-dessus)
  itemsSubtotal: number
  promoCode?: string | null
  promoDiscountPct?: number | null
  discountAmount?: number | null
  deliveryPrice?: number | null
  deliveryZoneName?: string | null
  totalPrice: number
  /** Dû en ligne tout de suite (acompte ou total complet). 0 si rien n'est payé en ligne. */
  amountNow: number
  /** Dû à la réception, en espèces. 0 si tout est déjà réglé en ligne. */
  amountLater: number
  /** Panier 100% digital — masque toute mention de livraison/retrait (§8/§9 de SPEC-refonte-tunnel-commande.md). */
  isDigitalOrder: boolean
  deliveryType: 'home_delivery' | 'store_pickup'
  deliveryDate?: string | null
  paymentType: string
  orderUrl: string
}

export async function sendOrderConfirmationEmail(params: OrderConfirmationParams): Promise<void> {
  if (!resend) return // silencieux si RESEND_API_KEY non configurée

  const cur = params.currency

  // Même décomposition et même ordre de lignes que components/shop/OrderSummary.tsx
  // (sous-total, promo, livraison, total, puis "tu paies maintenant"/"à la livraison") —
  // ce gabarit HTML statique ne peut pas consommer directement le composant React.
  const deliveryLabel = params.deliveryType === 'home_delivery' ? 'Livraison à domicile' : 'Retrait en boutique'
  const dateLabel      = params.deliveryDate ?? ''
  const laterLabel      = params.deliveryType === 'store_pickup' ? 'en boutique' : 'à la livraison'
  const hasPromo         = !!params.promoCode && !!params.discountAmount && params.discountAmount > 0
  const hasDeliveryPrice = !params.isDigitalOrder && !!params.deliveryPrice && params.deliveryPrice > 0

  const deliveryMethodRow = params.isDigitalOrder ? '' : `
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Livraison</td>
          <td style="padding:6px 0;text-align:right;">${deliveryLabel}${dateLabel ? ' · ' + dateLabel : ''}</td>
        </tr>`

  const promoRow = !hasPromo ? '' : `
        <tr>
          <td style="padding:6px 0;color:#059669;">Réduction (${params.promoCode}${params.promoDiscountPct ? `, -${params.promoDiscountPct}%` : ''})</td>
          <td style="padding:6px 0;text-align:right;color:#059669;">-${formatPrice(params.discountAmount!, cur)}</td>
        </tr>`

  const deliveryPriceRow = !hasDeliveryPrice ? '' : `
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Livraison${params.deliveryZoneName ? ` (${params.deliveryZoneName})` : ''}</td>
          <td style="padding:6px 0;text-align:right;">+${formatPrice(params.deliveryPrice!, cur)}</td>
        </tr>`

  const paidNowBlock = params.amountNow > 0
    ? `<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:#111827;">
         <span>Tu payes maintenant</span><span>${formatPrice(params.amountNow, cur)}</span>
       </div>
       ${params.amountLater > 0 ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Puis ${formatPrice(params.amountLater, cur)} ${laterLabel}</p>` : ''}`
    : `<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:#111827;">
         <span>En espèces ${laterLabel}</span><span>${formatPrice(params.amountLater || params.totalPrice, cur)}</span>
       </div>`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

    <!-- En-tête -->
    <div style="background:#0ea5e9;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">Ta commande</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:700;">${params.shopName}</h1>
    </div>

    <!-- Corps -->
    <div style="padding:28px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        Bonjour <strong>${params.clientName}</strong>,<br>
        Ta commande a bien été enregistrée.
      </p>

      <!-- Articles -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Articles</p>
        <pre style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap;font-family:inherit;">${params.items}</pre>
      </div>

      <!-- Récap -->
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:12px;">${deliveryMethodRow}
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Sous-total</td>
          <td style="padding:6px 0;text-align:right;">${formatPrice(params.itemsSubtotal, cur)}</td>
        </tr>${promoRow}${deliveryPriceRow}
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:10px 0 0;font-weight:700;">Total</td>
          <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;">${formatPrice(params.totalPrice, cur)}</td>
        </tr>
      </table>

      <!-- Ce que tu payes -->
      <div style="background:#f3f4f6;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        ${paidNowBlock}
      </div>

      <!-- CTA -->
      <a href="${params.orderUrl}"
         style="display:block;text-align:center;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 24px;border-radius:10px;margin-bottom:20px;">
        Suivre ma commande →
      </a>

      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
        Ton lien de suivi : <a href="${params.orderUrl}" style="color:#0ea5e9;">${params.orderUrl}</a>
      </p>
    </div>

    <!-- Pied de page -->
    <div style="border-top:1px solid #e5e7eb;padding:16px 28px;background:#f9fafb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Cet e-mail t'a été envoyé car tu as passé une commande sur la boutique <strong>${params.shopName}</strong>.
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [params.toEmail],
      subject: `Commande confirmée — ${params.shopName}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendOrderConfirmationEmail failed:', err)
  }
}

interface LicenceApplicationEmailParams {
  toEmail: string
  country: string
  fullName: string
  whatsappPhone: string
  email: string
  experience: string
  acquisitionPlan: string
}

export async function sendLicenceApplicationEmail(params: LicenceApplicationEmailParams): Promise<void> {
  if (!resend) return // silencieux si RESEND_API_KEY non configurée

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f172a;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Nouvelle candidature de licence</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:700;">${escapeHtml(params.country)}</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:20px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Nom</td><td style="padding:6px 0;">${escapeHtml(params.fullName)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">WhatsApp</td><td style="padding:6px 0;">${escapeHtml(params.whatsappPhone)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">E-mail</td><td style="padding:6px 0;">${escapeHtml(params.email)}</td></tr>
      </table>
      <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Parcours</p>
        <p style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap;">${escapeHtml(params.experience)}</p>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">100 premiers marchands</p>
        <p style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap;">${escapeHtml(params.acquisitionPlan)}</p>
      </div>
    </div>
  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [params.toEmail],
      subject: `Candidature licence — ${params.country} (${params.fullName})`,
      html,
    })
  } catch (err) {
    console.error('[email] sendLicenceApplicationEmail failed:', err)
  }
}

interface CountryManagerInviteEmailParams {
  toEmail: string
  name: string
  countryLabel: string
  inviteLink: string
}

// Le mailer intégré Supabase (limite ~2-4 e-mails/heure) n'est pas utilisé
// pour ce lien — on récupère le lien via admin.auth.admin.generateLink()
// et on l'envoie nous-mêmes via Resend, même principe que le reste des
// e-mails transactionnels de ce fichier.
export async function sendCountryManagerInviteEmail(params: CountryManagerInviteEmailParams): Promise<void> {
  if (!resend) return

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f172a;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Accès Country Manager TEKKIShop</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:700;">${escapeHtml(params.countryLabel)}</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">Bonjour ${escapeHtml(params.name)},</p>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">Un accès à l&rsquo;espace Country Manager TEKKIShop pour <strong>${escapeHtml(params.countryLabel)}</strong> vient de t&rsquo;être créé. Clique sur le lien ci-dessous pour définir ton mot de passe et accéder à ton tableau de bord.</p>
      <a href="${params.inviteLink}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;">Définir mon mot de passe</a>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Si tu n&rsquo;attendais pas cet e-mail, tu peux l&rsquo;ignorer sans risque.</p>
    </div>
  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [params.toEmail],
      subject: `Ton accès Country Manager TEKKIShop — ${params.countryLabel}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendCountryManagerInviteEmail failed:', err)
  }
}
