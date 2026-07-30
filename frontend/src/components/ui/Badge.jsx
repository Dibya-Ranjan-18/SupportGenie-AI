import { cn, getStatusColor, getPriorityColor } from '../../utils'

export default function Badge({ status, priority, children, variant, className }) {
  const cls = variant
    ? `badge-${variant}`
    : status
    ? getStatusColor(status)
    : priority
    ? getPriorityColor(priority)
    : 'badge-gray'

  const label = children || status || priority

  return (
    <span className={cn('badge', cls, className)}>
      {(status || priority) && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {label}
    </span>
  )
}
