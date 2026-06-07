'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { detectCountryFromCity } from '@/lib/locations/city-to-country'
import { detectCountryFromPhone } from '@/lib/payments/bictorys'

/**
 * Fix shop countries based on city names and phone numbers
 * This is a one-time fix to correct shops that were all created with country='SN'
 */
export async function fixShopCountriesByCity() {
  const admin = createAdminClient()

  // Get all shops with their city and phone
  const { data: shops, error: selectError } = await admin
    .from('shops')
    .select('id, name, city, country, phone_whatsapp')

  if (selectError) {
    console.error('[fixShopCountries] Error fetching shops:', selectError)
    return { error: 'Erreur lors de la lecture des boutiques', fixed: 0 }
  }

  if (!shops || shops.length === 0) {
    return { message: 'Aucune boutique à corriger', fixed: 0 }
  }

  let fixed = 0
  let skipped = 0
  const errors: { shop: string; reason: string }[] = []
  const corrections: { shop: string; from: string | null; to: string }[] = []

  // Process each shop
  for (const shop of shops) {
    // Priority: detect from city first, then from phone
    let detectedCountry: string | null = null
    let detectionSource: string = ''

    if (shop.city) {
      detectedCountry = detectCountryFromCity(shop.city)
      if (detectedCountry) {
        detectionSource = `city (${shop.city})`
      }
    }

    if (!detectedCountry && shop.phone_whatsapp) {
      detectedCountry = detectCountryFromPhone(shop.phone_whatsapp)
      if (detectedCountry) {
        detectionSource = `phone (${shop.phone_whatsapp})`
      }
    }

    if (!detectedCountry) {
      errors.push({
        shop: shop.name,
        reason: `Impossible de détecter le pays (city: ${shop.city ?? 'vide'}, phone: ${shop.phone_whatsapp ?? 'vide'})`,
      })
      continue
    }

    if (detectedCountry === shop.country) {
      skipped++
      continue
    }

    // Update shop with detected country
    const { error: updateError } = await admin
      .from('shops')
      .update({
        country: detectedCountry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id)

    if (updateError) {
      errors.push({
        shop: shop.name,
        reason: updateError.message,
      })
    } else {
      console.log(`✅ Fixed ${shop.name}: ${shop.country} → ${detectedCountry} (source: ${detectionSource})`)
      corrections.push({
        shop: shop.name,
        from: shop.country,
        to: detectedCountry,
      })
      fixed++
    }
  }

  return {
    message: `Correction terminée: ${fixed} boutiques corrigées, ${skipped} déjà correct`,
    fixed,
    skipped,
    total: shops.length,
    corrections: corrections.length > 0 ? corrections : undefined,
    errors: errors.length > 0 ? errors : undefined,
  }
}
