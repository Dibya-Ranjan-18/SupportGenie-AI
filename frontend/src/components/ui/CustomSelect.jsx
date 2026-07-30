import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../utils'

export default function CustomSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  icon,
  className,
  error
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)

  // Find selected option object or string
  const selectedOption = options.find(opt => 
    (typeof opt === 'object' ? opt.value : opt) === value
  )

  const selectedLabel = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder

  // Update popup coordinates when opened or window resizes/scrolls
  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 170)
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updateCoords()
    }
    setIsOpen(!isOpen)
  }

  // Handle window scroll/resize and click outside
  useEffect(() => {
    if (!isOpen) return

    function handleScrollOrResize() {
      updateCoords()
    }

    function handleClickOutside(event) {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        // Also check if click was inside portal element
        const portalEl = document.getElementById('custom-select-portal')
        if (portalEl && portalEl.contains(event.target)) {
          return
        }
        setIsOpen(false)
      }
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (val) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-sm border cursor-pointer select-none',
          'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]',
          'hover:border-primary-500/50 hover:bg-primary-500/5',
          isOpen && 'border-primary-500 ring-4 ring-primary-500/15 shadow-glow-indigo',
          error && 'border-red-500 focus:ring-red-500/20',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-primary-500 shrink-0">{icon}</span>}
          <span className={cn('truncate', !selectedOption && 'text-[var(--text-muted)]')}>
            {selectedLabel}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-[var(--text-secondary)] shrink-0 transition-transform duration-200 ml-1',
            isOpen && 'rotate-180 text-primary-500'
          )}
        />
      </button>

      {/* Dropdown Options Portal Menu */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="custom-select-portal"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 999999,
              }}
              className="p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] shadow-2xl overflow-y-auto max-h-60 chat-scroll ring-1 ring-black/10 text-slate-900 dark:text-slate-100"
            >
              {options.map((opt) => {
                const optVal = typeof opt === 'object' ? opt.value : opt
                const optLabel = typeof opt === 'object' ? opt.label : opt
                const isSelected = optVal === value

                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => handleSelect(optVal)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 text-left my-0.5 cursor-pointer',
                      isSelected
                        ? 'bg-gradient-primary text-white shadow-glow-indigo font-bold'
                        : 'text-slate-800 dark:text-slate-100 hover:bg-primary-500/15 hover:text-primary-600 dark:hover:text-primary-400'
                    )}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && <Check className="h-4 w-4 text-white shrink-0 ml-2" />}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}
