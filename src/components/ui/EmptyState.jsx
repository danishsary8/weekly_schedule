import { motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE, TOUCH_TARGET_LG } from '../../config/layout.js'

// ---------------------------------------------------------------------------
// Shared empty state. Previously each screen improvised a grey paragraph, which
// read as an error rather than an invitation. This gives every "nothing here
// yet" moment the same warm, actionable shape.
// ---------------------------------------------------------------------------

/**
 * @param {object}    props
 * @param {Function}  props.icon      lucide icon component
 * @param {string}    props.title     short, human headline
 * @param {string}    props.body      one supportive sentence
 * @param {string}    props.accent    accent hex for the icon wash
 * @param {string}    [props.actionLabel]
 * @param {Function}  [props.onAction]
 * @param {boolean}   [props.compact] tighter padding for in-card use
 */
export default function EmptyState({
  icon: Icon,
  title,
  body,
  accent = '#0F766E',
  actionLabel,
  onAction,
  actionDisabled = false,
  compact = false,
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE }}
      className={`rounded-2xl bg-cream/60 text-center ring-1 ring-black/[0.06] ${compact ? 'p-5' : 'p-6 sm:p-8'}`}
    >
      {Icon && (
        <span
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}

      <p className="font-sans text-base font-bold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm font-sans text-sm leading-relaxed text-ink/60">{body}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className={`${TOUCH_TARGET_LG} mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45`}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
