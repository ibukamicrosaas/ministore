import { createAdminClient } from '@/lib/supabase/admin'

// Définition revue le 2026-10-15 : toutes les commandes, tous statuts
// confondus (y compris cancelled et pending), toutes boutiques (test et
// exemples landing-v7 inclus — mesuré séparément, jamais exclu de ce
// chiffre public). Arrondi à la dizaine inférieure. null si la requête
// échoue — l'appelant doit alors masquer la ligne, jamais un repli figé.

export async function getPublicOrdersCount(): Promise<number | null> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
  if (error || count == null) return null
  return Math.floor(count / 10) * 10
}
