import { CATEGORIES, getCategory } from '../../config/categories.js'
import CategoryIcon from '../CategoryIcon.jsx'
import { TOUCH_TARGET } from '../../config/layout.js'

export const ALL_CATEGORIES = 'All'

/**
 * Horizontally scrollable category filter for the timeline.
 *
 * Only categories actually present in the current schedule are offered, each
 * with its count — a filter that yields an empty list is a dead end, and the
 * counts tell the user what filtering will do before they tap.
 *
 * The row scrolls sideways within the page's content box. It deliberately does
 * NOT use the `-mx-4 px-4` bleed the day switcher uses: that makes the scroll
 * container 32px wider than its parent, and with two such rows on the page the
 * rounding pushed the document 1–2px past the viewport.
 *
 * @param {Array}    schedule  Entries used to derive the available categories.
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

  // Preserve the config's display order, then append any retired/unknown keys
  // still present on historical entries so their blocks stay filterable.
  const present = [
    ...Object.keys(CATEGORIES).filter((key) => counts.has(key)),
    ...[...counts.keys()].filter((key) => !(key in CATEGORIES)),
  ]

  // One category is no choice at all.
  if (present.length < 2) return null

  const options = [{ key: ALL_CATEGORIES, label: 'All', count: schedule.length, category: null }].concat(
    present.map((key) => ({ key, label: getCategory(key).label, count: counts.get(key), category: getCategory(key) })),
  )

  return (
    <div className={className}>
      <ul
        className="flex snap-x items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap"
        aria-label="Filter blocks by category"
      >
        {options.map((option) => {
          const selected = value === option.key
          const accent = option.category?.color ?? '#1A1A1A'
          const text = option.category?.textColor ?? '#1A1A1A'

          return (
            <li key={option.key} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => onChange?.(option.key)}
                aria-pressed={selected}
                className={`${TOUCH_TARGET} inline-flex items-center gap-2 rounded-full px-3.5 font-sans text-sm font-bold ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream`}
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
                <span className={`font-sans text-body-sm tabular-nums ${selected ? 'opacity-80' : 'opacity-55'}`}>
                  {option.count}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
