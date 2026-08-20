import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import Card from './Card.jsx'

export default function TodayProgressCard({ items = [], checkedIds = new Set(), accentColor = '#0F766E', onToggle }) {
  const reduceMotion = useReducedMotion()
  const completed = items.reduce((count, item) => count + (checkedIds.has(item.id) ? 1 : 0), 0)
  const percent = items.length ? Math.round((completed / items.length) * 100) : 0
  const nextItem = items.find((item) => !checkedIds.has(item.id))
  const allDone = items.length > 0 && !nextItem

  return (
    <Card tone="white" accentColor={accentColor} className="p-5 sm:p-6" aria-label="Today's progress">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-cream" aria-label={`${percent}% complete`}>
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(26,26,26,.09)" strokeWidth="6" />
              <motion.circle cx="32" cy="32" r="27" fill="none" stroke={accentColor} strokeWidth="6" strokeLinecap="round" pathLength="1" initial={false} animate={{ strokeDasharray: `${percent / 100} 1` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
            </svg>
            <span className="font-sans text-sm font-black tabular-nums text-ink">{percent}%</span>
          </div>
          <div className="min-w-0">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[.18em] text-ink/45">Today’s progress</p>
            <h2 className="mt-1 font-sans text-lg font-bold leading-snug text-ink">{allDone ? 'You completed today’s checklist.' : nextItem ? 'One small step at a time.' : 'Your day is ready.'}</h2>
            <p className="mt-1 font-sans text-sm text-ink/55">{items.length ? `${completed} of ${items.length} complete` : 'Add checklist items in edit mode when you’re ready.'}</p>
          </div>
        </div>

        {nextItem && (
          <motion.button type="button" onClick={() => onToggle?.(nextItem.id)} whileTap={reduceMotion ? undefined : { scale: 0.97 }} className="flex min-h-[52px] min-w-0 items-center justify-center gap-3 rounded-2xl bg-ink px-5 text-left font-sans text-sm font-bold text-white sm:max-w-[310px]" aria-label={`Complete ${nextItem.label}`}>
            <Circle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">Complete “{nextItem.label}”</span>
          </motion.button>
        )}
        {allDone && <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 font-sans text-sm font-bold" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}><CheckCircle2 className="h-5 w-5" aria-hidden="true" />All done</motion.div>}
      </div>
      {items.length > 0 && <span className="sr-only" aria-live="polite">{completed} of {items.length} checklist items completed.</span>}
    </Card>
  )
}
