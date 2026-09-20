import { CATEGORIES, CATEGORY_KEYS, getCategory } from '../../config/categories.js'
import CategoryIcon from '../CategoryIcon.jsx'
import { TOUCH_TARGET } from '../../config/layout.js'

export const ALL_CATEGORIES = 'All'

/**
 * Category filter for the day's plan.
 *
 * Only offers what can actually narrow the list
 * ---------------------------------------------
 * An earlier version always rendered "All" plus every selectable category, with
 * the unused ones dimmed at a `0` count. On a phone that produced a row of five
 * chips where four were dead ends, and the audit showed three of them scrolled
 * off-screen — the nav cost horizontal space to advertise choices that lead to an
 * empty list. It now offers "All" plus the categories present in this routine.
 *
 * The row hides itself entirely when the schedule holds fewer than two
 * categories, because filtering one category by that same category is not a
 * choice. The one exception is an active filter: if a selection is still applied
 * (after switching routines, say) its chip stays rendered even at zero blocks, so
 * the user always has a way back to "All" instead of facing an empty plan with no
 * visible control.
 *
 * Retired or hand-edited keys still present on historical entries are appended
 * after the configured ones, so those blocks remain reachable even though the
 * category can no longer be chosen for new ones.
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

  const filtering = value !== ALL_CATEGORIES

  // Nothing to narrow: one category (or none) cannot be filtered into anything
  // smaller. Kept visible while a filter is applied so it can be undone.
  if (counts.size < 2 && !filtering) return null

  const present = new Set(counts.keys())
  if (filtering) present.add(value)

  const keys = [
    ...CATEGORY_KEYS.filter((key) => present.has(key)),
    ...[...present].filter((key) => !(key in CATEGORIES)).sort(),
  ]

  const options = [
    { key: ALL_CATEGORIES, label: 'All', count: schedule.length, category: null },
    ...keys.map((key) => ({ key, label: getCategory(key).label, count: counts.get(key) ?? 0, category: getCategory(key) })),
  ]

  return (
    <nav className={className} aria-label="Filter the plan by category">
      {/* The tour anchor lives on the row itself, not on a wrapper in the page.
          This component now returns null when it cannot narrow anything, and an
          anchor left behind on an empty wrapper would give the onboarding tour a
          zero-height target to point at. With the attribute here, the step's
          target simply does not exist and Joyride moves on. */}
      <ul
        data-tour="category-filter"
        className="flex snap-x items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap"
      >
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
                 * "Career2".
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
