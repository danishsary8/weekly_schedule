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
 * @param {ReactNode} props.action         Optional trailing control (e.g. "New
 *                                         routine"), placed at the end of the
 *                                         row so it does not claim its own line.
 */
export default function DaySwitcher({ groups = [], selectedId, onSelect, todayGroupIds = [], action = null }) {
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
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className="inline-flex min-h-touch items-center gap-2 rounded-full border-2 px-4 font-sans text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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

        {action && <li className="flex-shrink-0">{action}</li>}
      </ul>
    </nav>
  )
}
