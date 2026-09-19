import { forwardRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { getCategory } from '../config/categories.js'
import { formatRange, to12h, toMinutes } from '../utils/time.js'
import { matchPrayerKey } from '../utils/prayerTimes.js'
import CategoryIcon from './CategoryIcon.jsx'

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
}

/**
 * Fill strength of the category tint. Live blocks read as "turned up".
 *
 * 0.18 is the floor at which the two low-saturation accents — Life (#8A8378) and
 * Rest (#7C8B9C) — still read as a deliberate colour on cream rather than as a
 * dirty white. The saturated three (teal, sage, rose) stay comfortably soft at
 * the same value, so one number holds for all five.
 */
const FILL = { rest: 0.18, live: 0.32 }

function withAlpha(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * One block on the daily timeline.
 *
 * Colour now means something
 * --------------------------
 * These cards used to rotate through three fixed shells — black, white, taupe —
 * by list position, with the category reduced to a 6px strip down the left edge.
 * That made the same category look black in one row and white in the next, so the
 * loudest visual signal on the card (its entire background) carried no
 * information at all. The card is now filled with a soft tint of its own
 * category, which is both calmer and honest: two Career blocks look alike, and
 * Rest never shouts.
 *
 * Reading order is what-then-when: the description is the headline, the time
 * range sits under it as support, and the duration is a pill in the top corner.
 * Previously the clock came first, which is the one thing a user scanning their
 * own day already knows.
 *
 * The whole card is a single tap target that opens the block's detail sheet.
 */
const TimelineItem = forwardRef(function TimelineItem(
  {
    entry,
    isLive = false,
    animateIn = false,
    onSelect,
    prayerTimings = null,
    prayerSource = null,
    hasTimeOverride = false,
  },
  ref,
) {
  const reduceMotion = useReducedMotion()
  const cat = getCategory(entry.category)

  /*
   * Optional prayer-time annotation. Matched on the block description alone, so
   * it is independent of the category system — any block a user names after a
   * prayer gets the annotation, and no category needs to exist to enable it.
   */
  const prayerKey = matchPrayerKey(entry.description)
  const prayerTime = prayerKey && prayerTimings ? prayerTimings[prayerKey] : null

  // Duration chip
  const durMin = (() => {
    const s = toMinutes(entry.start)
    const e = toMinutes(entry.end)
    if (s == null || e == null) return null
    return (e - s + 1440) % 1440 || 1440
  })()
  const durLabel = durMin == null ? '' : durMin >= 60 ? `${Math.floor(durMin / 60)}h${durMin % 60 ? ` ${durMin % 60}m` : ''}` : `${durMin}m`

  const interactive = typeof onSelect === 'function'

  const body = (
    <div className="min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 font-sans text-label font-bold uppercase tracking-wide"
          style={{ color: cat.textColor }}
        >
          <CategoryIcon token={cat.token} color={cat.color} className="h-3.5 w-3.5" />
          <span className="truncate">{cat.label}</span>
        </span>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <AnimatePresence mode="wait">
            {isLive ? (
              <motion.span
                key="now"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.7 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-label font-bold uppercase tracking-wide"
                style={{ backgroundColor: cat.color, color: cat.onColor }}
              >
                <motion.span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cat.onColor }}
                  animate={reduceMotion ? {} : { opacity: [1, 0.35, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                Now
              </motion.span>
            ) : durLabel ? (
              <span
                key="duration"
                /* text-body-sm, not text-label: 11px is reserved for uppercase
                   micro-labels, and "1h 30m" is mixed case. */
                className="rounded-full bg-white/60 px-2.5 py-0.5 font-sans text-body-sm font-bold tabular-nums"
                style={{ color: cat.textColor }}
              >
                {durLabel}
              </span>
            ) : null}
          </AnimatePresence>
          {interactive && <ChevronRight className="h-4 w-4 text-ink/30" aria-hidden="true" />}
        </div>
      </div>

      {/* The headline: what you are doing, not when. */}
      <p className="mt-2.5 break-words font-sans text-body font-bold leading-snug text-ink">
        {entry.description}
      </p>

      <p className="mt-1 font-sans text-body-sm font-medium tabular-nums text-ink/60">
        {formatRange(entry.start, entry.end)}
        {isLive && durLabel && <span className="ml-1.5 font-bold not-italic">· {durLabel}</span>}
      </p>

      {prayerTime && (
        <p className="mt-2 font-sans text-body-sm text-ink/60">
          {hasTimeOverride ? `Actual ${prayerKey} today: ${to12h(prayerTime)}` : `${prayerKey}: ${to12h(prayerTime)}`}
          {prayerSource === 'default' && <span className="opacity-70"> · using default times</span>}
        </p>
      )}
    </div>
  )

  const surfaceClasses = 'relative block w-full overflow-hidden rounded-card text-left text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream'
  const fill = withAlpha(cat.color, isLive ? FILL.live : FILL.rest)

  // Row inset is pl-10 on phones rather than pl-14: the rail sits at `left-rail`
  // (18px), so a 56px inset spent 30px of a 320px screen on empty space and
  // squeezed the card to 73% of the viewport. The rail position itself is
  // unchanged, so this stays aligned with Timeline's ruler and TimelineSkeleton
  // — those three MUST keep the same `left-rail` offset.
  return (
    <motion.li ref={ref} variants={itemVariants} initial={animateIn ? undefined : false} className="relative pl-10 sm:pl-16">
      {/* Node on the ruler line */}
      <span
        className="absolute left-rail sm:left-rail-sm top-6 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-cream"
        style={{ backgroundColor: cat.color }}
        aria-hidden="true"
      >
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: cat.color }}
          animate={
            isLive && !reduceMotion
              ? { boxShadow: [`0 0 6px 1px ${withAlpha(cat.color, 0.45)}`, `0 0 14px 4px ${withAlpha(cat.color, 0.8)}`, `0 0 6px 1px ${withAlpha(cat.color, 0.45)}`] }
              : { boxShadow: 'none' }
          }
          transition={isLive && !reduceMotion ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
        />
        <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-white" />
      </span>

      <motion.div
        initial={false}
        animate={{
          // A tinted card needs no drop shadow to separate from cream; the live
          // block gets a ring in its own colour instead of a heavier shadow.
          boxShadow: isLive ? `0 0 0 2px ${withAlpha(cat.color, 0.9)}` : `0 0 0 1px ${withAlpha(cat.color, 0.22)}`,
        }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        whileHover={reduceMotion || !interactive ? undefined : { y: -3 }}
        className="rounded-card"
        style={{ ['--tw-ring-color']: cat.color }}
      >
        {interactive ? (
          <button
            type="button"
            onClick={() => onSelect(entry)}
            aria-label={`${entry.description}, ${formatRange(entry.start, entry.end)}. Open details.`}
            className={surfaceClasses}
            style={{ backgroundColor: fill }}
          >
            {body}
          </button>
        ) : (
          <div className={surfaceClasses} style={{ backgroundColor: fill }}>
            {body}
          </div>
        )}
      </motion.div>
    </motion.li>
  )
})

export default TimelineItem
