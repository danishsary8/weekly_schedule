import { motion, useReducedMotion } from 'framer-motion'

/**
 * Horizontal routine-group selector.
 *
 * The "today" marker is rendered two ways on purpose. On phones it is a dot
 * inside the pill, because the desktop treatment — a badge floating above the
 * pill — needs 20px of dead top padding across the whole row, which is
 * expensive on a screen where chrome already competes with the fold.
 *
 * @param {object}    props
 * @param {Array}     props.groups         Routine groups to list.
 * @param {number}    props.selectedId     Currently selected group id.
 * @param {Function}  props.onSelect       Called with the chosen group id.
 * @param {Array}     props.todayGroupIds  Ids assigned to the current weekday.
 */
export default function DaySwitcher({ groups = [], selectedId, onSelect, todayGroupIds = [] }) {
  const reduceMotion = useReducedMotion()

  return (
    <nav aria-label="Select day group" className="w-full">
      <ul className="-mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 pt-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pt-5">
        {groups.map((group) => {
          const active = group.id === selectedId
          const isToday = todayGroupIds.includes(group.id)

          return (
            <li key={group.id} className="relative flex-shrink-0">
              {isToday && (
                <span className="absolute -top-4 left-1/2 hidden -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 font-sans text-label font-bold uppercase text-white sm:inline-block">
                  Today
                </span>
              )}
              <motion.button
                type="button"
                onClick={() => onSelect(group.id)}
                aria-current={active ? 'page' : undefined}
                title={group.name}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                /*
                 * max-w-[70vw] on phones caps a very long routine name so the
                 * pill can't shoot past the viewport edge; the name wraps within
                 * the cap rather than clipping. Desktop (sm+) uses the wrapping
                 * flex row and has room, so the cap is lifted. Kept as a bare
                 * text node so it wraps naturally.
                 */
                className="inline-flex min-h-touch max-w-[70vw] items-center gap-2 rounded-2xl border-2 px-4 py-1.5 text-left font-sans text-sm font-bold leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:max-w-none sm:rounded-full sm:py-0"
                style={{ borderColor: group.color, backgroundColor: active ? group.color : `${group.color}18`, color: active ? '#fff' : group.color, ['--tw-ring-color']: group.color }}
              >
                {isToday && (
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full sm:hidden"
                    style={{ backgroundColor: active ? '#FFFFFF' : group.color }}
                    aria-hidden="true"
                  />
                )}
                {group.name}
                {isToday && <span className="sr-only"> (today)</span>}
              </motion.button>
            </li>
          )
        })}

      </ul>
    </nav>
  )
}
