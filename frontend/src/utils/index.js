import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return format(date, 'MMM d, yyyy')
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return format(date, 'MMM d, yyyy · h:mm a')
}

export function formatRelative(dateStr) {
  if (!dateStr) return ''
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'h:mm a')
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function truncate(str, n = 60) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '...' : str
}

export function getStatusColor(status) {
  const map = {
    pending:    'badge-warning',
    open:       'badge-primary',
    resolved:   'badge-success',
    closed:     'badge-gray',
    indexed:    'badge-success',
    processing: 'badge-primary',
    failed:     'badge-danger',
    active:     'badge-success',
    blocked:    'badge-danger',
    up:         'badge-success',
    down:       'badge-danger',
  }
  return map[status] || 'badge-gray'
}

export function getPriorityColor(priority) {
  const map = {
    low:    'badge-gray',
    medium: 'badge-warning',
    high:   'badge-danger',
    urgent: 'badge-danger',
  }
  return map[priority] || 'badge-gray'
}

export function downloadFile(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export function debounce(fn, delay = 300) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export function copyToClipboard(text) {
  // Modern Clipboard API (requires HTTPS / secure context)
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  }
  // Fallback for HTTP (local dev) or older browsers
  return new Promise((resolve, reject) => {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      ok ? resolve() : reject(new Error('execCommand copy failed'))
    } catch (err) {
      reject(err)
    }
  })
}
