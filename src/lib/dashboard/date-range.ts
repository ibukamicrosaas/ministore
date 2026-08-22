export type RevenuePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all'

export function getDateRange(period: RevenuePeriod): { from: string | null } {
  const now  = new Date()
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate()

  switch (period) {
    case 'today':
      return { from: new Date(Date.UTC(y, m, d)).toISOString() }
    case 'yesterday':
      return { from: new Date(Date.UTC(y, m, d - 1)).toISOString() }
    case 'week': {
      const dow = (now.getUTCDay() + 6) % 7 // lundi = 0
      return { from: new Date(Date.UTC(y, m, d - dow)).toISOString() }
    }
    case 'month':
      return { from: new Date(Date.UTC(y, m, 1)).toISOString() }
    case 'quarter':
      return { from: new Date(Date.UTC(y, m - 2, 1)).toISOString() }
    case 'semester':
      return { from: new Date(Date.UTC(y, m - 5, 1)).toISOString() }
    case 'year':
      return { from: new Date(Date.UTC(y, 0, 1)).toISOString() }
    case 'all':
      return { from: null }
  }
}
