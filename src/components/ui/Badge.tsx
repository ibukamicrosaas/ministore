import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?:
    | 'default' | 'success' | 'warning' | 'error' | 'info'
    // Palette de statut de commande — section 6, SPEC-refonte-dashboard-marchand.md
    // (Lot 1). Repli littéral si jamais rendu hors de .dashboard-scope
    // (globals.css) — aujourd'hui Badge n'est utilisé que dans le dashboard.
    | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  className?: string
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error:   'bg-red-100 text-red-800',
  info:    'bg-sky-100 text-sky-800',
  pending:   'bg-[var(--db-amber-soft,#FBF0DD)] text-[var(--db-amber,#B4740E)]',
  confirmed: 'bg-[var(--db-primary-soft,#E7EFFF)] text-[var(--db-primary,#155EEF)]',
  preparing: 'bg-[var(--db-primary-soft,#E7EFFF)] text-[var(--db-primary,#155EEF)]',
  ready:     'bg-[var(--db-money-soft,#E4F6EC)] text-[var(--db-money,#128A4C)]',
  delivered: 'bg-[var(--db-money,#128A4C)] text-white',
  cancelled: 'bg-[var(--db-danger-soft,#FBEAE7)] text-[var(--db-danger,#C4321F)]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
