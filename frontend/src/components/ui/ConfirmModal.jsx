import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import Button from './Button'

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Delete Item?',
  description = 'Are you sure you want to delete this? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={loading ? undefined : onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden z-10 p-6 flex flex-col items-center text-center"
          >
            {/* Close Icon */}
            {!loading && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Glowing Danger Icon */}
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4 ring-8 ring-red-500/5 shadow-glow">
              {variant === 'danger' ? (
                <Trash2 className="h-7 w-7 animate-pulse" />
              ) : (
                <AlertTriangle className="h-7 w-7 animate-pulse" />
              )}
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              {title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-medium transition-all shadow-glow disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
