import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { DURATION, EASE } from '../../config/layout.js'

/**
 * Centred modal dialog: backdrop, focus trap, Escape to close, scroll lock.
 *
 * Used for decisions that must not be made by a stray tap while scrolling — the
 * backdrop and trap force deliberate attention, and focus returns to the trigger
 * on close.
 *
 * On phones it sits flush to the bottom as a sheet (thumb-reachable) and centres
 * from `sm` upward. The panel scrolls internally so a tall body never pushes the
 * actions off a short screen.
 *
 * @param {boolean}  open
 * @param {Function} onClose         Backdrop click, close button, Escape.
 * @param {string}   title           Accessible name; rendered as the heading.
 * @param {string}   [description]   Optional supporting line under the title.
 * @param {object}   [returnFocusRef] Element focused after the dialog closes.
 * @param {'default'|'danger'} [tone]
 * @param {import('react').ReactNode} [footer] Action row, pinned below the body.
 */

const TONES = {
  default: { accent: 'bg-career', title: 'text-ink' },
  danger: { accent: 'bg-language', title: 'text-language' },
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  returnFocusRef,
  tone = 'default',
  footer,
  children,
}) {
  const reduceMotion = useReducedMotion()
  const panelRef = useRef(null)
  const palette = TONES[tone] ?? TONES.default

  useFocusTrap(panelRef, open, { onEscape: onClose, returnFocusRef })

  // Prevent the page behind the dialog from scrolling while it is open.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  // Move focus into the dialog so keyboard and screen-reader users start inside.
  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector('input, button, [href], select, textarea')
      target?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
          <motion.div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : DURATION.page }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : DURATION.base, ease: EASE }}
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card bg-paper shadow-lift sm:max-w-md sm:rounded-card"
          >
            <span className={`h-1.5 w-full flex-shrink-0 ${palette.accent}`} aria-hidden="true" />

            <div className="flex flex-shrink-0 items-start gap-3 px-5 pt-5">
              <div className="min-w-0 flex-1">
                <h2 className={`font-sans text-lg font-bold leading-snug ${palette.title}`}>{title}</h2>
                {description && (
                  <p className="mt-1 font-sans text-body-sm leading-relaxed text-ink/65">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-ink/55 transition-colors hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-career"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer && (
              <div className="flex-shrink-0 border-t border-black/[0.07] bg-cream/40 px-5 py-4">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
