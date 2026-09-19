import { CalendarDays, ChevronRight } from 'lucide-react'
import { formatWeekdays } from '../../config/weekdays.js'

/**
 * "Which routine am I looking at, and how do I change it?" — answered in one row.
 *
 * This replaces a chevron pill that sat next to the avatar. Two problems with
 * that spot: controls in an icon cluster read as account controls, and a name
 * with a chevron is only discoverable if you already suspect it is a menu. Here
 * the row states the routine, the days it runs, how many blocks it holds, and
 * says "Change" in words — so nothing has to be guessed or hovered to be found.
 *
 * It is a single button rather than a card containing one: the whole row is the
 * target, which is what a thumb expects.
 *
 * No "Today" badge here on purpose. The header one line above already reads
 * "Today ·" or "Preview ·" for exactly this routine, and repeating it stole the
 * width that long routine names need — "Weekday mornings and focused deep work"
 * truncated to "Weekday mor…" with the badge present.
 *
 * @param {object}   routine        Loaded routine, or a summary from the list.
 * @param {number}   [blockCount]
 * @param {Function} onOpen         Opens the routines sheet.
 * @param {object}   [buttonRef]    So the sheet can return focus here on close.
 * @param {string}   [className]
 */
export default function RoutineContextBar({
  routine,
  blockCount = 0,
  onOpen,
  buttonRef,
  className = '',
}) {
  const name = routine?.name ?? 'Routine'
  const accent = routine?.color ?? '#0F766E'
  const days = formatWeekdays(routine?.weekdays)
  const blocks = `${blockCount} block${blockCount === 1 ? '' : 's'}`

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onOpen}
      data-tour="routines"
      aria-label={`Change routine. Showing ${name}, ${days}, ${blocks}`}
      className={`flex w-full items-center gap-3 rounded-card bg-paper px-4 py-3 text-left shadow-card ring-1 ring-black/[0.06] transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${className}`}
      style={{ ['--tw-ring-color']: accent }}
    >
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1F` }}
      >
        <CalendarDays className="h-5 w-5" style={{ color: accent }} aria-hidden="true" />
      </span>

      {/* Wraps rather than truncates. A routine name is the one string on this
          row the user chose themselves, and "Weekday mornings an…" tells them
          less than two short lines do. The API caps names at 80 characters, so
          the row can grow at most a line or two. */}
      <span className="min-w-0 flex-1" aria-hidden="true">
        <span className="block break-words font-sans text-body font-bold leading-snug text-ink">{name}</span>
        <span className="mt-0.5 block break-words font-sans text-body-sm leading-snug text-ink/55">{days} · {blocks}</span>
      </span>

      {/* The word, not just a chevron: "Change" is what makes the row obviously
          interactive to someone who has never used the app. */}
      <span
        className="flex flex-shrink-0 items-center gap-0.5 font-sans text-body-sm font-bold"
        style={{ color: accent }}
        aria-hidden="true"
      >
        Change
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  )
}
