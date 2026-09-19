import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Sparkles, UserRound } from 'lucide-react'
import Avatar from './ui/Avatar.jsx'
import { TOUCH_TARGET } from '../config/layout.js'

/**
 * Dashboard title bar.
 *
 * The routine control here is a *switcher*, not an editor. An earlier note in
 * this file argued routine actions must stay out of the header because a lone
 * pencil next to the avatar reads as "edit my account" — still true, which is
 * why this button is labelled with the routine's own name and opens a sheet
 * that lists routines. Naming the current context is what a header is for; the
 * editing lives one level in, inside that sheet.
 *
 * It replaces a full-width row of routine pills plus an Edit/New pair, which
 * cost roughly two above-the-fold rows on a phone for something used a few times
 * a week.
 */
export default function DashboardHeader({
  dayName,
  dayType,
  dateLabel,
  isViewingToday,
  accentColor,
  userName,
  onOpenProfile,
  onOpenRoutines,
  routinesButtonRef,
}) {
  const reduceMotion = useReducedMotion()

  return (
    <header>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {/* Wordmark stays confident but not 40px tall on a phone, where the
                header competes with the fold. Full size returns at sm. */}
            <motion.h1 className="display-title text-display-sm text-ink sm:text-6xl" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>Daycraft</motion.h1>
            <motion.span initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -30, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }} className="flex-shrink-0"><Sparkles className="h-5 w-5 -translate-y-1 sm:h-6 sm:w-6" style={{ color: accentColor }} aria-hidden="true" /></motion.span>
          </div>
          {/* 14px on phones: this is the date/context line users actually read,
              so it respects the mobile legibility floor rather than 12px. */}
          <p className="mt-1 font-sans text-body-sm font-medium text-ink/60 sm:text-sm">{userName ? `${userName.split(' ')[0]} · ` : ''}{isViewingToday ? 'Today' : 'Viewing'} · {dateLabel}</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {onOpenRoutines && (
            <button
              type="button"
              ref={routinesButtonRef}
              onClick={onOpenRoutines}
              data-tour="routines"
              aria-label={`Switch or manage routines. Showing ${dayType}`}
              title="Switch or manage routines"
              className={`${TOUCH_TARGET} flex max-w-[42vw] items-center gap-2 rounded-full bg-paper px-3 shadow-card ring-1 ring-black/[0.06] transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:max-w-[16rem]`}
              style={{ ['--tw-ring-color']: accentColor }}
            >
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />
              {/* The name is the label, so it must not be read twice; the button
                  carries the full sentence in aria-label. */}
              <span className="truncate font-sans text-sm font-bold text-ink" aria-hidden="true">{dayType}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-ink/45" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={onOpenProfile} aria-label="Open profile and settings" title="Profile and settings" className="flex flex-shrink-0 rounded-full shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream" style={{ ['--tw-ring-color']: accentColor }}>
            {userName
              ? <Avatar name={userName} color={accentColor} size="sm" ring />
              : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-white ring-2 ring-white" style={{ backgroundColor: accentColor }}>
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
          </button>
        </div>
      </div>

      {/*
        Hidden on phones, where Today/Viewing already appears in the meta line
        above and this row cost ~46px above the fold. It earns its place from sm
        upward, where the space is free.

        The routine name used to be stamped here as well; it now sits in the
        switcher button, so repeating it would state the same fact twice in one
        header. What is left is the only thing the button does not say: whether
        you are looking at today or previewing another day.
      */}
      <div className="mt-4 hidden flex-wrap items-center gap-x-3 gap-y-2 sm:flex">
        <motion.span
          key={dayName}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="font-display text-xl text-ink/70 sm:text-2xl"
        >
          {dayName}
        </motion.span>
      </div>
    </header>
  )
}
