import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import TimelineItem from './TimelineItem.jsx'

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
}

// Rotate the three tones for visual rhythm (not per-category).
const TONE_ORDER = ['black', 'white', 'taupe']

export default function Timeline({
  schedule = [],
  liveId = null,
  staggerOnMount = false,
  editMode = false,
  onSaveEntry,
  onDeleteEntry,
  prayerTimings = null,
  prayerSource = null,
  overriddenTimeIds,
}) {
  const itemRefs = useRef(new Map())

  useEffect(() => {
    if (!liveId) return
    const node = itemRefs.current.get(liveId)
    if (!node) return
    const t = setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250)
    return () => clearTimeout(t)
  }, [liveId])

  return (
    <section aria-label="Daily timeline" className="relative">
      <h2 className="display-title mb-4 text-3xl text-ink">Schedule</h2>

      <div className="relative">
        {/* Thin horizontal grid lines behind the timeline (time-ruler feel) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-card"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 63px, rgba(26,26,26,0.06) 63px, rgba(26,26,26,0.06) 64px)',
          }}
          aria-hidden="true"
        />
        {/* Vertical ruler line */}
        <span
          className="pointer-events-none absolute bottom-3 left-rail top-3 w-0.5 -translate-x-1/2 rounded-full bg-ink/15 sm:left-rail-sm"
          aria-hidden="true"
        />

        {schedule.length === 0 ? (
          <div className="ml-12 rounded-card bg-paper p-5 text-center ring-1 ring-black/10 sm:ml-14 sm:p-6">
            <p className="font-sans text-sm font-semibold text-ink/65">No blocks scheduled for this day.</p>
          </div>
        ) : (
          <motion.ul
            variants={listVariants}
            initial={staggerOnMount ? 'hidden' : 'show'}
            animate="show"
            className="relative z-10 space-y-3 sm:space-y-4"
          >
            {schedule.map((entry, i) => (
              <TimelineItem
                key={entry.id}
                entry={entry}
                isLive={entry.id === liveId}
                animateIn={staggerOnMount}
                editMode={editMode}
                tone={TONE_ORDER[i % TONE_ORDER.length]}
                onSaveEntry={onSaveEntry}
                onDeleteEntry={onDeleteEntry}
                prayerTimings={prayerTimings}
                prayerSource={prayerSource}
                hasTimeOverride={overriddenTimeIds?.has(entry.id) ?? false}
                ref={(node) => {
                  if (node) itemRefs.current.set(entry.id, node)
                  else itemRefs.current.delete(entry.id)
                }}
              />
            ))}
          </motion.ul>
        )}
      </div>
    </section>
  )
}
