import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Circle, Sparkles } from 'lucide-react'
import Card from './Card.jsx'
import Celebration from './ui/Celebration.jsx'
import { CARD_PADDING, DURATION, EASE, TOUCH_TARGET_LG } from '../config/layout.js'

/**
 * Today's completion indicator: a progress ring (X of Y), the single next
 * action, and the once-a-day 100% celebration.
 *
 * Celebration state is owned by the parent (via useDayCelebration) so the burst
 * survives this card re-rendering and can also be reasoned about in tests.
 */
export default function TodayProgressCard({
  items = [],
  checkedIds = new Set(),
  accentColor = '#0F766E',
  accentTextColor,
  onToggle,
  celebrating = false,
  onCelebrationEnd,
}) {
  const reduceMotion = useReducedMotion()
  const total = items.length
  const completed = items.reduce((count, item) => count + (checkedIds.has(item.id) ? 1 : 0), 0)
  const percent = total ? Math.round((completed / total) * 100) : 0
  const nextItem = items.find((item) => !checkedIds.has(item.id))
  const allDone = total > 0 && !nextItem
  const headingColor = accentTextColor ?? accentColor

  const headline = allDone
    ? 'Every habit done today.'
    : completed > 0
      ? 'Keep the streak of the day going.'
      : 'One small step at a time.'

  return (
    <Card
      tone="white"
      accentColor={accentColor}
      className={`relative ${CARD_PADDING}`}
      aria-label="Today's progress"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {/* --- Progress ring (also the celebration origin) --- */}
          <div className="relative flex-shrink-0">
            <Celebration active={celebrating} onComplete={onCelebrationEnd} />

            <motion.div
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-cream"
              animate={
                celebrating && !reduceMotion
                  ? { scale: [1, 1.12, 1], boxShadow: [`0 0 0 0px ${accentColor}00`, `0 0 0 10px ${accentColor}22`, `0 0 0 0px ${accentColor}00`] }
                  : {}
              }
              transition={{ duration: DURATION.celebrate * 0.6, ease: EASE }}
              role="img"
              aria-label={`${percent}% of today complete`}
            >
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(26,26,26,.09)" strokeWidth="6" />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  pathLength="1"
                  initial={false}
                  animate={{ strokeDasharray: `${percent / 100} 1` }}
                  transition={reduceMotion ? { duration: 0 } : { duration: DURATION.base, ease: EASE }}
                />
              </svg>

              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={percent}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.85 }}
                  transition={{ duration: DURATION.feedback, ease: EASE }}
                  className="font-sans text-sm font-black tabular-nums text-ink"
                >
                  {percent}%
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="min-w-0">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[.18em] text-ink/45">
              Today’s progress
            </p>
            <h2 className="mt-1 font-sans text-lg font-bold leading-snug text-ink">{headline}</h2>
            <p className="mt-1 font-sans text-sm text-ink/55">
              {total ? (
                <>
                  <span className="font-bold tabular-nums" style={{ color: headingColor }}>{completed}</span>
                  {' '}of <span className="tabular-nums">{total}</span> complete
                </>
              ) : (
                'Add checklist items in edit mode when you’re ready.'
              )}
            </p>
          </div>
        </div>

        {/* --- One-tap next action --- */}
        {nextItem && (
          <motion.button
            type="button"
            onClick={() => onToggle?.(nextItem.id)}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className={`${TOUCH_TARGET_LG} flex min-w-0 items-center justify-center gap-3 rounded-2xl bg-ink px-5 text-left font-sans text-sm font-bold text-white sm:max-w-[310px]`}
            aria-label={`Complete ${nextItem.label}`}
          >
            <Circle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">Complete “{nextItem.label}”</span>
          </motion.button>
        )}

        {allDone && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION.feedback, ease: EASE }}
            className={`${TOUCH_TARGET_LG} flex items-center justify-center gap-2 rounded-2xl px-5 font-sans text-sm font-bold`}
            style={{ backgroundColor: `${accentColor}18`, color: headingColor }}
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            All done
          </motion.div>
        )}
      </div>

      {/* --- Calm confirmation line; also the reduced-motion reward --- */}
      <AnimatePresence>
        {allDone && (
          <motion.p
            key="day-complete"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE }}
            className="mt-4 flex items-center gap-2 font-display text-2xl"
            style={{ color: headingColor }}
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            That’s a full day — see you tomorrow.
          </motion.p>
        )}
      </AnimatePresence>

      {total > 0 && (
        <span className="sr-only" aria-live="polite">
          {completed} of {total} checklist items completed.
        </span>
      )}
    </Card>
  )
}
