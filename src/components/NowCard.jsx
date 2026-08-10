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

/**
 * "Happening Now" hero. Shows the current live block with a live progress bar
 * and the next-up block. On non-today tabs, shows a calm preview summary.
 */
export default function NowCard({ schedule = [], liveId = null, isViewingToday = false, dayName = '', dayType = '', nowTs = Date.now() }) {
  const reduceMotion = useReducedMotion()

  // --- Non-today: calm preview state ---
  if (!isViewingToday || !liveId) {
    return (
      <div className="relative overflow-hidden rounded-card bg-taupe p-6 text-ink shadow-card">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-ink/30" aria-hidden="true" />
        <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink/70">Preview</p>
        <p className="mt-2 font-display text-3xl leading-tight">{dayName}</p>
        <p className="mt-1 font-sans text-sm text-ink/75">
          {dayType} · {schedule.length} blocks. Switch to today to track live progress.
        </p>
      </div>
    )
  }

  const now = new Date(nowTs)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const idx = schedule.findIndex((e) => e.id === liveId)
  const live = schedule[idx]
  const next = schedule[(idx + 1) % schedule.length]
  const cat = getCategory(live.category)
  const nextCat = getCategory(next.category)

  const startMin = toMinutes(live.start)
  const endMin = toMinutes(live.end)
  const dur = (endMin - startMin + 1440) % 1440 || 1440
  const elapsed = Math.min(dur, Math.max(0, (nowMin - startMin + 1440) % 1440))
  const remaining = Math.max(0, dur - elapsed)
  const pct = Math.round((elapsed / dur) * 100)

  return (
    <div className="relative overflow-hidden rounded-card bg-ink p-6 text-white shadow-lift">
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: cat.color }} aria-hidden="true" />
      {/* soft accent glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: withAlpha(cat.color, 0.35) }} aria-hidden="true" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <motion.span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: cat.color }}
            animate={reduceMotion ? {} : { opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-white/70">Happening now</span>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: withAlpha(cat.color, 0.3) }}>
            <CategoryIcon token={cat.token} color="#FFFFFF" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-sans text-lg font-bold leading-snug">{live.description}</p>
            <p className="mt-0.5 font-sans text-sm text-white/70">
              {to12h(live.start)} – {to12h(live.end)} · {cat.label}
            </p>
          </div>
        </div>

        {/* live progress within the block */}
        <div className="mt-4">
          <div className="flex items-center justify-between font-sans text-xs text-white/70">
            <span>{fmtDur(elapsed)} in</span>
            <span>{fmtDur(remaining)} left</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cat.color }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24 }}
            />
          </div>
        </div>

        {/* up next */}
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/10 pt-3">
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/50" aria-hidden="true" />
          <span className="font-sans text-xs font-bold uppercase tracking-wide text-white/50">Next</span>
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: nextCat.color }} aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words font-sans text-sm leading-relaxed text-white/85">{next.description}</span>
          <span className="ml-auto flex-shrink-0 font-sans text-sm font-semibold tabular-nums text-white/70">{to12h(next.start)}</span>
        </div>
      </div>
    </div>
  )
}
