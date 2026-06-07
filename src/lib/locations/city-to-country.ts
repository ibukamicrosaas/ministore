/**
 * Mapping of cities to country codes for West African countries
 */

const CITY_TO_COUNTRY: Record<string, string> = {
  // Sénégal (SN)
  'dakar': 'SN',
  'saint-louis': 'SN',
  'saint louis': 'SN',
  'kaolack': 'SN',
  'tambacounda': 'SN',
  'kolda': 'SN',
  'matam': 'SN',
  'louga': 'SN',
  'thiès': 'SN',
  'thies': 'SN',
  'rufisque': 'SN',
  'pikine': 'SN',
  'guédiawaye': 'SN',
  'guedjawaye': 'SN',

  // Côte d'Ivoire (CI)
  'abidjan': 'CI',
  'bouaké': 'CI',
  'bouake': 'CI',
  'yamoussoukro': 'CI',
  'san-pédro': 'CI',
  'san pedro': 'CI',
  'korhogo': 'CI',
  'man': 'CI',
  'daloa': 'CI',
  'gagnoa': 'CI',

  // Burkina Faso (BK)
  'ouagadougou': 'BK',
  'bobo-dioulasso': 'BK',
  'bobo dioulasso': 'BK',
  'koudougou': 'BK',
  'ouahigouya': 'BK',

  // Mali (ML)
  'bamako': 'ML',
  'ségou': 'ML',
  'segou': 'ML',
  'mopti': 'ML',
  'kayes': 'ML',
  'koulikoro': 'ML',

  // Togo (TG)
  'lomé': 'TG',
  'lome': 'TG',
  'kara': 'TG',
  'sokodé': 'TG',
  'sokode': 'TG',

  // Bénin (BJ)
  'cotonou': 'BJ',
  'porto-novo': 'BJ',
  'porto novo': 'BJ',
  'parakou': 'BJ',
  'bohicon': 'BJ',

  // Guinea (GN)
  'conakry': 'GN',
  'kindia': 'GN',
  'mamou': 'GN',

  // Cameroon (CM)
  'douala': 'CM',
  'yaoundé': 'CM',
  'yaounde': 'CM',

  // DRC (CD)
  'kinshasa': 'CD',
  'lubumbashi': 'CD',

  // Gabon (GA)
  'libreville': 'GA',
  'port-gentil': 'GA',
  'port gentil': 'GA',

  // Madagascar (MG)
  'antananarivo': 'MG',
  'toliara': 'MG',

  // Morocco (MA)
  'casablanca': 'MA',
  'fès': 'MA',
  'fes': 'MA',
  'marrakech': 'MA',
}

/**
 * Detect country code from city name
 * @param city City name (case-insensitive)
 * @returns Country code or null if not found
 */
export function detectCountryFromCity(city: string): string | null {
  if (!city) return null

  const normalized = city
    .toLowerCase()
    .trim()
    .replace(/[àâäéèêëïîôöùûüç]/g, c => ({
      'à': 'a', 'â': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'ï': 'i', 'î': 'i',
      'ô': 'o', 'ö': 'o',
      'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c',
    }[c] || c))

  return CITY_TO_COUNTRY[normalized] || null
}

/**
 * Get country code - try city first, then phone fallback
 */
export function getCountryFromCityOrPhone(
  city: string,
  phone?: string,
  phoneDetector?: (phone: string) => string | null,
): string | null {
  // Priority 1: Detect from city
  const fromCity = detectCountryFromCity(city)
  if (fromCity) return fromCity

  // Priority 2: Detect from phone (if function provided)
  if (phone && phoneDetector) {
    return phoneDetector(phone)
  }

  return null
}
