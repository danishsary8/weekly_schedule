import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import TimelineItem from './TimelineItem.jsx'

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
}

/**
 * The day's blocks, as a vertical timeline.
 *
 * The section header carries the count and the add action. Both were elsewhere
 * before: the count nowhere, and "Add a block" at the very bottom of the list,
 * which on a full day meant scrolling the whole plan to reach it.
 *
 * @param {Array}    schedule
 * @param {number}   [liveId]      Block happening now.
 * @param {Function} [onSelectEntry]
 * @param {Function} [onAdd]       Omit to hide the add action entirely.
 * @param {string}   [emptyMessage]
 */
export default function Timeline({
  schedule = [],
  liveId = null,
  staggerOnMount = false,
  onSelectEntry,
  onAdd,
  emptyMessage = 'No blocks scheduled for this day.',
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="display-title text-3xl text-ink">Schedule</h2>
          <p className="mt-0.5 font-sans text-body-sm text-ink/55">
            {schedule.length === 0
              ? 'Nothing here yet'
              : `${schedule.length} block${schedule.length === 1 ? '' : 's'} today`}
          </p>
        </div>

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex min-h-touch flex-shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
        )}
      </div>

      <div className="relative">
        {/*
          The horizontal grid lines that used to sit here are gone. They were a
          fixed 64px rhythm behind cards whose heights vary with their content, so
          they never lined up with anything — against the old white/black cards
          they read as a faint texture, but against filled cards they read as
          stray marks. The vertical rail alone carries the timeline idea.
        */}
        {/* Vertical ruler line */}
        <span
          className="pointer-events-none absolute bottom-3 left-rail top-3 w-0.5 -translate-x-1/2 rounded-full bg-ink/15 sm:left-rail-sm"
          aria-hidden="true"
        />

        {schedule.length === 0 ? (
          <div className="ml-10 rounded-card bg-paper p-5 text-center ring-1 ring-black/10 sm:ml-16 sm:p-6">
            <p className="font-sans text-body-sm font-semibold text-ink/65">{emptyMessage}</p>
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
                dataTour={i === 0 ? 'routine-block' : undefined}
                isLive={entry.id === liveId}
                animateIn={staggerOnMount}
                onSelect={onSelectEntry}
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
