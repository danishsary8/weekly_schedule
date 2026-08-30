import { forwardRef, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getCategory } from '../config/categories.js'
import { formatRange, to12h, toMinutes } from '../utils/time.js'
import { matchPrayerKey } from '../utils/prayerTimes.js'
import { Pencil, Trash2 } from 'lucide-react'
import { TONES } from './Card.jsx'
import CategoryIcon from './CategoryIcon.jsx'
import EntryEditForm from './EntryEditForm.jsx'

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
}

function withAlpha(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const TimelineItem = forwardRef(function TimelineItem(
  {
    entry,
    isLive = false,
    animateIn = false,
    editMode = false,
    tone = 'white',
    onSaveEntry,
    onDeleteEntry,
    prayerTimings = null,
    prayerSource = null,
    hasTimeOverride = false,
  },
  ref,
) {
  const reduceMotion = useReducedMotion()
  const cat = getCategory(entry.category)
  const [isEditing, setIsEditing] = useState(false)
  const editButtonRef = useRef(null)
  const t = TONES[tone] ?? TONES.white
  const isDark = tone === 'black'

  /*
   * Optional prayer-time annotation. Matched on the block description alone, so
   * it is independent of the category system — any block a user names after a
   * prayer gets the annotation, and no category needs to exist to enable it.
   */
  const prayerKey = matchPrayerKey(entry.description)
  const prayerTime = prayerKey && prayerTimings ? prayerTimings[prayerKey] : null

  const mutedText = isDark ? 'text-white/70' : 'text-ink/60'

  // Duration chip
  const durMin = (() => {
    const s = toMinutes(entry.start)
    const e = toMinutes(entry.end)
    if (s == null || e == null) return null
    return (e - s + 1440) % 1440 || 1440
  })()
  const durLabel = durMin == null ? '' : durMin >= 60 ? `${Math.floor(durMin / 60)}h${durMin % 60 ? ` ${durMin % 60}m` : ''}` : `${durMin}m`

  return (
    <motion.li ref={ref} variants={itemVariants} initial={animateIn ? undefined : false} className="relative pl-14 sm:pl-16">
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

      {editMode && isEditing ? (
        <EntryEditForm
          entry={entry}
          accent={cat.color}
          onAccent={cat.onColor}
          onSave={(patch) => onSaveEntry?.(entry.id, patch)}
          onClose={() => {
            setIsEditing(false)
            window.requestAnimationFrame(() => editButtonRef.current?.focus())
          }}
          returnFocusRef={editButtonRef}
        />
      ) : (
        <motion.div
          className={`relative overflow-hidden rounded-card ring-1 ring-black/10 shadow-card ${t.text}`}
          initial={false}
          animate={{
            boxShadow: isLive
              ? `0 0 0 2px ${withAlpha(cat.color, 0.85)}, 0 12px 26px -8px ${withAlpha(cat.color, 0.5)}`
              : '0 6px 18px -8px rgba(26,26,26,0.25)',
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          whileHover={reduceMotion ? undefined : { y: -3 }}
          style={{ backgroundColor: t.bg }}
        >
          {/* accent strip */}
          <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: cat.color }} aria-hidden="true" />

          <div className="min-w-0 py-4 pl-5 pr-4 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: withAlpha(cat.color, isDark ? 0.28 : 0.16) }}
                >
                  <CategoryIcon token={cat.token} color={isDark ? '#FFFFFF' : cat.color} className="h-4 w-4" />
                </span>
                <span className={`font-sans text-sm font-semibold tabular-nums ${isDark ? 'text-white/90' : 'text-ink/80'}`}>
                  {formatRange(entry.start, entry.end)}
                </span>
                {durLabel && (
                  <span className={`rounded-full px-2 py-0.5 font-sans text-label font-bold tabular-nums ${isDark ? 'bg-white/15 text-white/80' : 'bg-black/[0.06] text-ink/60'}`}>
                    {durLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editMode && (<>
                  <button
                    ref={editButtonRef}
                    type="button"
                    onClick={() => setIsEditing(true)}
                    aria-label={`Edit ${entry.description}`}
                    title={`Edit ${entry.description}`}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDark ? 'text-white hover:bg-white/10 focus-visible:ring-offset-ink' : 'text-ink hover:bg-black/5 focus-visible:ring-offset-paper'}`}
                    style={{ ['--tw-ring-color']: cat.color }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => { if (window.confirm(`Delete “${entry.description}”?`)) onDeleteEntry?.(entry.id) }} aria-label={`Delete ${entry.description}`} title={`Delete ${entry.description}`} className={`flex h-11 w-11 items-center justify-center rounded-xl text-language transition-colors focus:outline-none focus-visible:ring-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-language/10'}`}><Trash2 className="h-4 w-4" /></button>
                </>)}
                <AnimatePresence mode="wait">
                  {isLive && (
                    <motion.span
                      key="now"
                      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.7 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 font-sans text-label font-bold uppercase tracking-wide"
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
                  )}
                  {!isLive && (
                    <span
                      className="rounded-full px-2.5 py-0.5 font-sans text-label font-semibold uppercase tracking-wide"
                      style={{ color: isDark ? '#FFFFFF' : cat.textColor, backgroundColor: withAlpha(cat.color, isDark ? 0.3 : 0.14) }}
                    >
                      {cat.label}
                    </span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <p className="mt-2 break-words font-sans text-body font-medium leading-snug">
              {entry.description}
            </p>

            {prayerTime && (
              <p className={`mt-2 font-sans text-body-sm ${mutedText}`}>
                {hasTimeOverride ? `Actual ${prayerKey} today: ${to12h(prayerTime)}` : `${prayerKey}: ${to12h(prayerTime)}`}
                {prayerSource === 'default' && <span className="opacity-70"> · using default times</span>}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.li>
  )
})

export default TimelineItem
