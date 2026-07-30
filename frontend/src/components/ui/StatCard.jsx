import { cn } from '../../utils'

// Stat card for admin dashboard
export default function StatCard({ title, value, subtitle, icon, color = 'primary', trend }) {
  const colors = {
    primary: {
      bg: 'bg-primary-100 dark:bg-primary-900/20',
      icon: 'text-primary-600 dark:text-primary-400',
      bar: 'bg-primary-500',
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500',
    },
    rose: {
      bg: 'bg-rose-100 dark:bg-rose-900/20',
      icon: 'text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
    },
    sky: {
      bg: 'bg-sky-100 dark:bg-sky-900/20',
      icon: 'text-sky-600 dark:text-sky-400',
      bar: 'bg-sky-500',
    },
    violet: {
      bg: 'bg-violet-100 dark:bg-violet-900/20',
      icon: 'text-violet-600 dark:text-violet-400',
      bar: 'bg-violet-500',
    },
  }

  const c = colors[color] || colors.primary

  return (
    <div className="stat-card overflow-hidden">
      <div className={cn('absolute top-0 left-0 right-0 h-1', c.bar)} />
      <div className="flex items-start justify-between">
        <div className="flex-1 pt-1">
          <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
            {value?.toLocaleString() ?? '—'}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={cn('text-xs font-medium mt-1', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% this week
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
            <span className={c.icon}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}
