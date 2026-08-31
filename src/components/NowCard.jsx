import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { getCategory } from '../config/categories.js'
import { to12h, toMinutes } from '../utils/time.js'
import CategoryIcon from './CategoryIcon.jsx'

function withAlpha(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function fmtDur(mins) {
  if (mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

/** Countdowns are only meaningful for the near future; beyond that, state the time. */
const COUNTDOWN_WINDOW_MINUTES = 180

/**
 * Schedule hero card with three distinct states, each on its own card tone so
 * the current situation is readable at a glance:
 *
 *   bg-ink    Today, a block is running now — live progress plus what's next.
 *   bg-paper  Today, nothing running — the next block and when it starts.
 *   bg-taupe  Another day's routine — a calm preview summary.
 *
 * The middle state matters: it is what a user sees for most of the day, between
 * blocks. Collapsing it into the preview state told people to "switch to today"
 * while they were already on today.
 */
export default function NowCard({ schedule = [], liveId = null, isViewingToday = false, dayName = '', dayType = '', nowTs = Date.now() }) {
  const reduceMotion = useReducedMotion()
  const blockCount = `${schedule.length} block${schedule.length === 1 ? '' : 's'}`

  // --- Another day's routine: calm preview -------------------------------
  if (!isViewingToday) {
    // p-5 sm:p-6 matches every peer card (Checklist, TodayProgressCard) so
    // mobile padding is uniform at 375px instead of 24px next to 20px.
    return (
      <div className="relative overflow-hidden rounded-card bg-taupe p-5 text-ink shadow-card sm:p-6">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-ink/30" aria-hidden="true" />
        <p className="eyebrow text-ink/70">Preview</p>
        <p className="mt-2 font-display text-3xl leading-tight">{dayName}</p>
        <p className="mt-1 font-sans text-body-sm text-ink/75">
          {dayType} · {blockCount}. Switch to today to track live progress.
        </p>
      </div>
    )
  }

  const now = new Date(nowTs)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const liveIndex = schedule.findIndex((entry) => entry.id === liveId)
  const live = liveIndex === -1 ? null : schedule[liveIndex]

  // --- Today, but nothing is running right now ---------------------------
  if (!live) {
    // Soonest upcoming block, wrapping past midnight so an early-morning block
    // is correctly read as "next" late in the evening.
    const upcoming = schedule
      .map((entry) => ({ entry, start: toMinutes(entry.start) }))
      .filter((candidate) => candidate.start !== null)
      .map((candidate) => ({ ...candidate, until: (candidate.start - nowMin + 1440) % 1440 }))
      .sort((a, b) => a.until - b.until)[0]

    const upcomingCategory = upcoming ? getCategory(upcoming.entry.category) : null

    return (
      <div className="relative overflow-hidden rounded-card bg-paper p-5 text-ink shadow-card ring-1 ring-black/10 sm:p-6">
        <span
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: upcomingCategory?.color ?? '#8A8378' }}
          aria-hidden="true"
        />

        {upcoming ? (
          <>
            <p className="eyebrow text-ink/45">Up next</p>
            <div className="mt-3 flex items-start gap-3">
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: withAlpha(upcomingCategory.color, 0.16) }}
              >
                <CategoryIcon token={upcomingCategory.token} color={upcomingCategory.color} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="break-words font-sans text-lg font-bold leading-snug">{upcoming.entry.description}</p>
                <p className="mt-0.5 font-sans text-body-sm text-ink/60">
                  {to12h(upcoming.entry.start)} – {to12h(upcoming.entry.end)} · {upcomingCategory.label}
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-black/[0.07] pt-3 font-sans text-body-sm text-ink/55">
              Nothing running right now ·{' '}
              {upcoming.until <= COUNTDOWN_WINDOW_MINUTES
                ? `starts in ${fmtDur(upcoming.until)}`
                : `starts at ${to12h(upcoming.entry.start)}`}
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow text-ink/45">Today</p>
            <p className="mt-2 font-display text-3xl leading-tight">Nothing scheduled yet</p>
            <p className="mt-1 font-sans text-body-sm text-ink/60">
              Add a block in edit mode to shape how today runs.
            </p>
          </>
        )}
      </div>
    )
  }

  // --- Today, a block is running now -------------------------------------
  // A single-block routine has no "next"; showing one pointed back at itself.
  const next = schedule.length > 1 ? schedule[(liveIndex + 1) % schedule.length] : null
  const category = getCategory(live.category)
  const nextCategory = next ? getCategory(next.category) : null

  const startMin = toMinutes(live.start)
  const endMin = toMinutes(live.end)
  const duration = (endMin - startMin + 1440) % 1440 || 1440
  const elapsed = Math.min(duration, Math.max(0, (nowMin - startMin + 1440) % 1440))
  const remaining = Math.max(0, duration - elapsed)
  const percent = Math.round((elapsed / duration) * 100)

  return (
    <div className="relative overflow-hidden rounded-card bg-ink p-5 text-white shadow-lift sm:p-6">
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: category.color }} aria-hidden="true" />
      {/* soft accent glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: withAlpha(category.color, 0.35) }} aria-hidden="true" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <motion.span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: category.color }}
            animate={reduceMotion ? {} : { opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="eyebrow text-white/70">Happening now</span>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: withAlpha(category.color, 0.3) }}>
            <CategoryIcon token={category.token} color="#FFFFFF" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="break-words font-sans text-lg font-bold leading-snug">{live.description}</p>
            <p className="mt-0.5 font-sans text-body-sm text-white/70">
              {to12h(live.start)} – {to12h(live.end)} · {category.label}
            </p>
          </div>
        </div>

        {/* live progress within the block */}
        <div className="mt-4">
          <div className="flex items-center justify-between font-sans text-body-sm text-white/70">
            <span>{fmtDur(elapsed)} in</span>
            <span>{fmtDur(remaining)} left</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: category.color }}
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24 }}
            />
          </div>
        </div>

        {/* up next */}
        {next && (
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/10 pt-3">
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/50" aria-hidden="true" />
            <span className="eyebrow text-white/50">Next</span>
            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: nextCategory.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words font-sans text-body-sm leading-relaxed text-white/85">{next.description}</span>
            <span className="ml-auto flex-shrink-0 font-sans text-body-sm font-semibold tabular-nums text-white/70">{to12h(next.start)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
