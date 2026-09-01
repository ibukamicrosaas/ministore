// Nom (produit, catégorie...) intégralement en capitales et de plus de 3
// lettres → casse de phrase à l'affichage. La donnée en base n'est jamais
// modifiée (SPEC-v2 §4.7 / §5.6, bugs 2.6 et 2.7).
export function displayName(name: string): string {
  const letters = name.replace(/[^\p{L}]/gu, '')
  const isAllCaps = letters.length > 3 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()
  if (!isAllCaps) return name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}
