import { CATEGORIES, CATEGORY_KEYS, getCategory } from '../../config/categories.js'
import CategoryIcon from '../CategoryIcon.jsx'
import { TOUCH_TARGET } from '../../config/layout.js'

export const ALL_CATEGORIES = 'All'

/**
 * Primary category nav for the day's plan.
 *
 * This row is deliberately *stable*: it always offers "All" plus every
 * selectable category, in config order, whether or not the current routine
 * happens to use them. An earlier version listed only the categories present in
 * the schedule and hid itself below two options, which meant the row changed
 * shape — or vanished — as the user switched routines. A navigation control that
 * moves is a navigation control users stop trusting.
 *
 * Categories with nothing in them are dimmed and show a `0`, so the row is
 * honest about what a tap will do without ever becoming a dead end: selecting
 * one lands on the caller's empty message rather than a blank screen.
 *
 * Retired or hand-edited keys still present on historical entries are appended
 * after the five, so those blocks remain reachable even though the category can
 * no longer be chosen for new ones.
 *
 * The row scrolls sideways within the page's content box. It deliberately does
 * NOT use the `-mx-4 px-4` bleed the old day switcher used: that makes the
 * scroll container 32px wider than its parent, and the rounding pushed the
 * document 1–2px past the viewport.
 *
 * @param {Array}    schedule  Entries of the current routine, used for counts.
 * @param {string}   value     Selected category key, or ALL_CATEGORIES.
 * @param {Function} onChange
 * @param {string}   [className]
 */
export default function CategoryFilter({ schedule = [], value = ALL_CATEGORIES, onChange, className = '' }) {
  const counts = schedule.reduce((totals, entry) => {
    const key = entry.category ?? 'Life'
    totals.set(key, (totals.get(key) ?? 0) + 1)
    return totals
  }, new Map())

  // Every selectable category, always, then any legacy/unknown key the data
  // still carries so its blocks stay filterable.
  const keys = [...CATEGORY_KEYS, ...[...counts.keys()].filter((key) => !(key in CATEGORIES))]

  const options = [
    { key: ALL_CATEGORIES, label: 'All', count: schedule.length, category: null },
    ...keys.map((key) => ({ key, label: getCategory(key).label, count: counts.get(key) ?? 0, category: getCategory(key) })),
  ]

  return (
    <nav className={className} aria-label="Filter the plan by category">
      <ul className="flex snap-x items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
        {options.map((option) => {
          const selected = value === option.key
          const empty = option.count === 0 && !selected
          const accent = option.category?.color ?? '#1A1A1A'
          const text = option.category?.textColor ?? '#1A1A1A'

          return (
            <li key={option.key} className="flex-shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onChange?.(option.key)}
                aria-pressed={selected}
                /*
                 * Explicit label: the visible count sits in its own element with
                 * no separating whitespace, so the derived name would be read as
                 * "Career2". Spelling it out also lets the empty state say what
                 * it means instead of relying on a dimmed appearance.
                 */
                aria-label={`${option.label}, ${option.count} ${option.count === 1 ? 'block' : 'blocks'}`}
                className={`${TOUCH_TARGET} inline-flex items-center gap-2 rounded-full px-3.5 font-sans text-sm font-bold ring-1 transition-[background-color,color,opacity] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${empty ? 'opacity-45' : ''}`}
                style={selected
                  ? { backgroundColor: accent, color: option.category?.onColor ?? '#FFFFFF', ['--tw-ring-color']: accent }
                  : { backgroundColor: 'transparent', color: text, ['--tw-ring-color']: 'rgba(26,26,26,0.15)' }}
              >
                {option.category && (
                  <CategoryIcon
                    token={option.category.token}
                    color={selected ? (option.category.onColor ?? '#FFFFFF') : option.category.color}
                    className="h-4 w-4"
                  />
                )}
                {option.label}
                <span
                  className={`font-sans text-body-sm tabular-nums ${selected ? 'opacity-80' : 'opacity-55'}`}
                  aria-hidden="true"
                >
                  {option.count}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
