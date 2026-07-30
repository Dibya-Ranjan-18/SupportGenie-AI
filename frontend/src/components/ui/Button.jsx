import { cn } from '../../utils'
import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  disabled,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] px-4 py-2.5 text-sm',
    warning: 'btn bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98] px-4 py-2.5 text-sm',
  }

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 rounded-lg',
    sm: 'text-xs px-3 py-2 rounded-xl',
    md: '',
    lg: 'text-base px-6 py-3 rounded-2xl',
    xl: 'text-lg px-8 py-4 rounded-2xl',
  }

  return (
    <button
      className={cn(variants[variant], sizes[size] !== '' && sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
}
