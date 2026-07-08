import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'TEKKIShop <noreply@tekkishop.com>'

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

interface OrderConfirmationParams {
  toEmail: string
  clientName: string
  shopName: string
  shopSlug: string
  orderId: string
  clientToken: string
  items: string        // texte préformaté "• Produit ×2 — 5 000 FCFA"
  totalPrice: number
  deliveryType: 'home_delivery' | 'store_pickup'
  deliveryDate?: string | null
  paymentType: string
  orderUrl: string
}

export async function sendOrderConfirmationEmail(params: OrderConfirmationParams): Promise<void> {
  if (!resend) return // silencieux si RESEND_API_KEY non configurée

  const deliveryLabel = params.deliveryType === 'home_delivery' ? 'Livraison à domicile' : 'Retrait en boutique'
  const dateLabel     = params.deliveryDate ?? ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

    <!-- En-tête -->
    <div style="background:#0ea5e9;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">Votre commande</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:700;">${params.shopName}</h1>
    </div>

    <!-- Corps -->
    <div style="padding:28px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        Bonjour <strong>${params.clientName}</strong>,<br>
        Votre commande a bien été enregistrée 🎉
      </p>

      <!-- Articles -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Articles</p>
        <pre style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap;font-family:inherit;">${params.items}</pre>
      </div>

      <!-- Récap -->
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Livraison</td>
          <td style="padding:6px 0;text-align:right;">${deliveryLabel}${dateLabel ? ' · ' + dateLabel : ''}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:10px 0 0;font-weight:700;">Total</td>
          <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;">${params.totalPrice.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      </table>

      <!-- CTA -->
      <a href="${params.orderUrl}"
         style="display:block;text-align:center;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 24px;border-radius:10px;margin-bottom:20px;">
        Suivre ma commande →
      </a>

      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
        Votre lien de suivi : <a href="${params.orderUrl}" style="color:#0ea5e9;">${params.orderUrl}</a>
      </p>
    </div>

    <!-- Pied de page -->
    <div style="border-top:1px solid #e5e7eb;padding:16px 28px;background:#f9fafb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Cet e-mail vous a été envoyé car vous avez passé une commande sur la boutique <strong>${params.shopName}</strong>.
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
