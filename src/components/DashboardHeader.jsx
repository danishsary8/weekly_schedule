import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, LogOut, Pencil, Sparkles } from 'lucide-react'

export default function DashboardHeader({
  dayName,
  dayType,
  dateLabel,
  isViewingToday,
  accentColor,
  editMode,
  onToggleEdit,
  userName,
  onLogout,
}) {
  const reduceMotion = useReducedMotion()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const cancelLogoutRef = useRef(null)

  useEffect(() => {
    if (!confirmLogout) return undefined
    cancelLogoutRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setConfirmLogout(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmLogout])

  return (
    <header>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <motion.h1
              className="display-title text-[2.6rem] text-ink sm:text-6xl"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              Daycraft
            </motion.h1>
            <motion.span
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -30, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 15 }}
              className="flex-shrink-0"
            >
              <Sparkles className="h-5 w-5 -translate-y-1 sm:h-6 sm:w-6" style={{ color: accentColor }} aria-hidden="true" />
            </motion.span>
          </div>

          <p className="mt-1 font-sans text-xs font-medium text-ink/60 sm:text-sm">
            {userName ? `${userName.split(' ')[0]} · ` : ''}
            {isViewingToday ? 'Today' : 'Viewing'} · {dateLabel}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {onToggleEdit && <button
            type="button"
            onClick={onToggleEdit}
            aria-pressed={editMode}
            aria-label={editMode ? 'Exit edit mode' : 'Edit schedule'}
            title={editMode ? 'Done editing' : 'Edit schedule'}
            data-tour="edit-toggle"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            style={{
              color: editMode ? '#FFFFFF' : '#1A1A1A',
              backgroundColor: editMode ? '#1A1A1A' : 'transparent',
              ['--tw-ring-color']: accentColor,
            }}
          >
            {editMode ? <Check className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
          </button>}

          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink/60 ring-1 ring-black/10 transition-colors hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            style={{ ['--tw-ring-color']: accentColor }}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {confirmLogout && (
        <div role="group" aria-label="Confirm sign out" className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <span className="font-sans text-sm font-semibold text-ink/70">Sign out of this account?</span>
          <button ref={cancelLogoutRef} type="button" disabled={signingOut} onClick={() => setConfirmLogout(false)} className="min-h-[44px] rounded-xl px-4 font-sans text-sm font-semibold text-ink/70 ring-1 ring-black/15 hover:bg-black/5 disabled:opacity-50">Stay signed in</button>
          <button type="button" disabled={signingOut} onClick={async () => { setSigningOut(true); await onLogout(); setSigningOut(false) }} className="min-h-[44px] rounded-xl bg-ink px-4 font-sans text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{signingOut ? 'Signing out…' : 'Sign out'}</button>
        </div>
      )}

      {/* Stamp pill + day name */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <motion.span
          key={dayType}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="inline-block rounded-xl bg-ink px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-card sm:px-4 sm:text-xs"
        >
          {dayType}
        </motion.span>
        <span className="font-display text-xl text-ink/70 sm:text-2xl">{dayName}</span>
      </div>
    </header>
  )
}
