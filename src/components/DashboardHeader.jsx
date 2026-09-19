import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, UserRound } from 'lucide-react'
import Avatar from './ui/Avatar.jsx'

/**
 * Dashboard title bar: brand, the date, and what today amounts to.
 *
 * Structure, smallest to largest: a quiet wordmark, the weekday and date as an
 * eyebrow, then one large statement line — "You have 6 blocks today." The
 * statement is the headline on purpose. A date is a fact the user already knows;
 * the number of things in front of them is the thing worth setting in type, and
 * it gives the script face something to say.
 *
 * Nothing about routines lives here. A routine switcher was tried in this corner
 * and pulled back out: anything sitting beside the avatar reads as an account
 * control. That job belongs to RoutineContextBar, which sits in the content flow
 * and says "Change" out loud.
 *
 * The eyebrow keeps two date lengths because the long form wrapped onto three
 * lines at 390px — the tallest piece of chrome above the user's actual plan.
 *
 * @param {string}      dateLabel       Long date, shown from `sm` up.
 * @param {string}      [dateShortLabel] Phone-width date.
 * @param {boolean}     isViewingToday
 * @param {number|null} [blockCount]    null while the routine is still loading.
 * @param {string}      [statement]     Overrides the derived line, for screens
 *                                      where block counts are not the point
 *                                      (first run, for instance).
 * @param {string}      accentColor
 * @param {string}      [userName]
 * @param {Function}    onOpenProfile
 */
export default function DashboardHeader({
  dateLabel,
  dateShortLabel,
  isViewingToday,
  blockCount = null,
  statement: statementOverride,
  accentColor,
  userName,
  onOpenProfile,
}) {
  const reduceMotion = useReducedMotion()

  /*
   * "today" is only true when the selected routine actually runs today —
   * otherwise the user is previewing another routine and a promise about their
   * day would be wrong.
   */
  const statement = statementOverride
    ?? (blockCount === null
    ? 'Your day, in order.'
    : blockCount === 0
      ? isViewingToday ? 'Nothing planned today.' : 'This routine is empty.'
      : isViewingToday
        ? `You have ${blockCount} block${blockCount === 1 ? '' : 's'} today.`
        : `${blockCount} block${blockCount === 1 ? '' : 's'} in this routine.`)

  return (
    <header>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <motion.p
              className="font-display text-xl font-bold text-ink/45"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              Daycraft
            </motion.p>
            <motion.span
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -30, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
              className="flex-shrink-0"
            >
              <Sparkles className="h-4 w-4 -translate-y-0.5" style={{ color: accentColor }} aria-hidden="true" />
            </motion.span>
          </div>

          <p className="eyebrow mt-2 text-ink/45">
            {isViewingToday ? 'Today' : 'Preview'} ·{' '}
            <span className="sm:hidden">{dateShortLabel ?? dateLabel}</span>
            <span className="hidden sm:inline">{dateLabel}</span>
          </p>

          {/* h1 is the statement, not the wordmark: it is the one line that
              describes this screen's content rather than the product. */}
          <motion.h1
            key={statement}
            className="display-title mt-1 text-display-sm text-ink sm:text-display-md"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            {statement}
          </motion.h1>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Open profile and settings"
            title="Profile and settings"
            className="flex flex-shrink-0 rounded-full shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            style={{ ['--tw-ring-color']: accentColor }}
          >
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
    </header>
  )
}
