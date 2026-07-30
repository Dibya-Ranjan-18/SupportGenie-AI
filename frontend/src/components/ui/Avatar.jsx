import { cn, getInitials } from '../../utils'

export default function Avatar({ user, size = 'md', className }) {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
    xl: 'h-14 w-14 text-lg',
    '2xl': 'h-20 w-20 text-2xl',
  }

  const colors = [
    'from-violet-500 to-purple-600',
    'from-indigo-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-cyan-600',
  ]

  const colorIndex = user?.email
    ? user.email.charCodeAt(0) % colors.length
    : 0

  const avatarSrc = user?.avatar_url || (typeof user?.avatar === 'string' ? user.avatar : null)

  if (avatarSrc) {
    const fullSrc = avatarSrc.startsWith('http') || avatarSrc.startsWith('blob:')
      ? avatarSrc
      : `http://localhost:8000${avatarSrc.startsWith('/') ? '' : '/'}${avatarSrc}`

    return (
      <img
        src={fullSrc}
        alt={user.full_name || user.username}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white shrink-0',
        sizes[size],
        colors[colorIndex],
        className
      )}
    >
      {getInitials(user?.full_name || user?.username || user?.email || '?')}
    </div>
  )
}
