import { motion, useReducedMotion } from 'framer-motion'
import { Check, Pencil, Sparkles, UserRound } from 'lucide-react'

export default function DashboardHeader({ dayName, dayType, dateLabel, isViewingToday, accentColor, editMode, onToggleEdit, userName, onOpenProfile }) {
  const reduceMotion = useReducedMotion()
  const initial = userName?.trim()?.charAt(0)?.toUpperCase() || 'U'

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
          {onToggleEdit && <button type="button" onClick={onToggleEdit} aria-pressed={editMode} aria-label={editMode ? 'Exit edit mode' : 'Edit schedule'} title={editMode ? 'Done editing' : 'Edit schedule'} data-tour="edit-toggle" className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream" style={{ color: editMode ? '#FFFFFF' : '#1A1A1A', backgroundColor: editMode ? '#1A1A1A' : 'transparent', ['--tw-ring-color']: accentColor }}>{editMode ? <Check className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}</button>}
          <button type="button" onClick={onOpenProfile} aria-label="Open profile and settings" title="Profile and settings" className="flex h-11 min-w-11 items-center justify-center rounded-full font-sans text-sm font-black text-white ring-2 ring-white shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream" style={{ backgroundColor: accentColor, ['--tw-ring-color']: accentColor }}>
            {userName ? initial : <UserRound className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/*
        Hidden on phones: the routine name is already the selected pill in
        DaySwitcher directly below, and Today/Viewing is already in the meta line
        above, so this row repeated both and cost ~46px above the fold. It earns
        its place from sm upward, where the space is free.
      */}
      <div className="mt-4 hidden flex-wrap items-center gap-x-3 gap-y-2 sm:flex">
        <motion.span key={dayType} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: -1.5 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="inline-block rounded-xl bg-ink eyebrow-stamp px-3 py-1.5 text-white shadow-card sm:px-4">{dayType}</motion.span>
        <span className="font-display text-xl text-ink/70 sm:text-2xl">{dayName}</span>
      </div>
    </header>
  )
}
