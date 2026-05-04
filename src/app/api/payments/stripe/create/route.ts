import { NextResponse } from 'next/server'

// TekkiShop utilise exclusivement Bictorys pour les paiements Mobile Money.
// Stripe n'est pas supporté dans cette version.
export async function POST() {
  return NextResponse.json({ error: 'Stripe non supporté. Utilisez /api/payments/bictorys/create.' }, { status: 400 })
}
