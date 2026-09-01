import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { SPECIALTY_TO_LABEL } from '@/app/start/data'

interface Props {
  /**
   * Liste manuelle d'ID de boutiques, choisie à la main — jamais une requête
   * automatique (ex. ORDER BY plan/date). Tant qu'aucune modération n'existe
   * (voir CROISSANCE-MODERATION-A-CREUSER.md), une sélection automatique
   * risquerait de mettre en avant, sur la page la plus visible du site, une
   * boutique jamais vérifiée. Ne jamais remplacer cette prop par un fetch
   * générique sans revalider cette décision avec l'utilisateur.
   */
  shopIds:  string[]
  eyebrow:  string
  headline: ReactNode
}

export async function RealShopsShowcase({ shopIds, eyebrow, headline }: Props) {
  if (shopIds.length === 0) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('shops')
    .select('id, slug, name, specialty, logo_url')
    .in('id', shopIds)
    .eq('is_active', true)

  // Confirmation d'affichage uniquement. Une boutique de la liste manuelle
  // qui devient inactive entre-temps disparaît silencieusement (filtrée par
  // is_active=true ci-dessus) plutôt que de s'afficher cassée ou de rediriger
  // vers une page morte.
  const shops = (data ?? []).slice().sort(
    (a, b) => shopIds.indexOf(a.id) - shopIds.indexOf(b.id)
  )

  if (shops.length === 0) return null

  return (
    <>
      <div className="section-head center reveal">
        <span className="label">{eyebrow}</span>
        <h2>{headline}</h2>
        <p className="lead">Des vendeurs qui ont arrêté de gérer leurs commandes dans une discussion WhatsApp.</p>
      </div>
      <div className="shops-grid reveal">
        {shops.map((s) => (
          <Link key={s.id} href={`/${s.slug}`} className="shop-card">
            <div className="shop-card-logo">
              {s.logo_url ? (
                <Image src={s.logo_url} alt={s.name} width={56} height={56} />
              ) : (
                <span>{s.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <b>{s.name}</b>
            <small>{(s.specialty && SPECIALTY_TO_LABEL[s.specialty]) || 'Boutique en ligne'}</small>
          </Link>
        ))}
      </div>
    </>
  )
}
