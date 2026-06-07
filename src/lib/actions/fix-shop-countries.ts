'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { detectCountryFromCity } from '@/lib/locations/city-to-country'

/**
 * Fix shop countries based on city names
 * This is a one-time fix to correct shops that were all created with country='SN'
 */
export async function fixShopCountriesByCity() {
  const admin = createAdminClient()

  // Get all shops
  const { data: shops, error: selectError } = await admin
    .from('shops')
    .select('id, city, country')

  if (selectError) {
    console.error('[fixShopCountries] Error fetching shops:', selectError)
    return { error: 'Erreur lors de la lecture des boutiques', fixed: 0 }
  }

  if (!shops || shops.length === 0) {
    return { message: 'Aucune boutique à corriger', fixed: 0 }
  }

  let fixed = 0
  const errors: string[] = []

  // Process each shop
  for (const shop of shops) {
    if (!shop.city) continue

    const detectedCountry = detectCountryFromCity(shop.city)
    if (!detectedCountry || detectedCountry === shop.country) {
      // Already correct or couldn't detect
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
      errors.push(`${shop.city}: ${updateError.message}`)
    } else {
      console.log(`✅ Fixed shop in ${shop.city}: ${shop.country} → ${detectedCountry}`)
      fixed++
    }
  }

  return {
    message: `Correction terminée: ${fixed} boutiques corrigées`,
    fixed,
    errors: errors.length > 0 ? errors : undefined,
  }
}
