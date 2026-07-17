import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deleteReview } from '@/lib/actions/reviews'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Star, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata = { title: 'Avis clients — TekkiShop' }

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default async function ReviewsPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews } = await (supabase as any)
    .from('product_reviews')
    .select('id, product_id, order_id, client_name, rating, comment, created_at, products(name)')
    .eq('shop_id', profile.shop_id)
    .order('created_at', { ascending: false })

  type Review = {
    id: string
    product_id: string
    order_id: string | null
    client_name: string
    rating: number
    comment: string | null
    created_at: string
    products: { name: string } | null
  }

  const list = (reviews ?? []) as Review[]

  const avgRating = list.length > 0
    ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1)
    : null

  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: list.filter(r => r.rating === n).length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avis clients</h1>
        <p className="text-sm text-gray-500 mt-1">
          {list.length} avis{list.length > 0 && avgRating ? ` · Moyenne ${avgRating}/5` : ''}
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Aucun avis pour l'instant"
          description="Les avis de vos clients apparaîtront ici dès qu'ils en laisseront un."
        />
      ) : (
        <>
          {/* Résumé notes */}
          <Card className="p-5">
            <div className="flex items-center gap-6">
              <div className="text-center shrink-0">
                <p className="text-4xl font-extrabold text-gray-900">{avgRating}</p>
                <StarRating rating={Math.round(parseFloat(avgRating!))} />
                <p className="text-xs text-gray-400 mt-1">{list.length} avis</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingCounts.map(({ n, count }) => (
                  <div key={n} className="flex items-center gap-2">
                    <span className="w-2 text-xs text-gray-500 shrink-0">{n}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: list.length > 0 ? `${(count / list.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-4 text-xs text-gray-400 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Liste des avis */}
          <div className="space-y-3">
            {list.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRating rating={review.rating} />
                      <span className="text-sm font-semibold text-gray-900">{review.client_name}</span>
                      {review.products?.name && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {review.products.name}
                        </span>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {format(new Date(review.created_at), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>

                  <form action={async () => { 'use server'; await deleteReview(review.id) }}>
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Supprimer cet avis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
