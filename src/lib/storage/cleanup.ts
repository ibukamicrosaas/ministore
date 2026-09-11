import type { SupabaseClient } from '@supabase/supabase-js'

// Extrait le chemin interne d'un bucket depuis une URL publique Supabase
// Storage (ex: https://xxx.supabase.co/storage/v1/object/public/<bucket>/<path>).
// Retourne null si l'URL ne correspond pas à ce bucket (rien à supprimer).
export function storagePathFromPublicUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return url.slice(i + marker.length)
}

// Supprime un ou plusieurs anciens fichiers de storage, jamais bloquant :
// une image déjà remplacée/retirée en base ne doit jamais faire échouer
// l'opération qui a réussi (upload, sauvegarde produit...) si le nettoyage
// échoue — seulement logguée (REPRISE.md §104).
export async function deleteOldStorageFiles(
  admin: SupabaseClient,
  bucket: string,
  urls: (string | null | undefined)[],
): Promise<void> {
  const paths = urls
    .map(u => storagePathFromPublicUrl(u, bucket))
    .filter((p): p is string => Boolean(p))
  if (paths.length === 0) return

  const { error } = await admin.storage.from(bucket).remove(paths)
  if (error) {
    console.error(`[deleteOldStorageFiles] ${bucket}`, error.message, paths)
  }
}
