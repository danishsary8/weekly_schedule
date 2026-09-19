// ---------------------------------------------------------------------------
// Weekday names, in one place.
//
// Sunday-first, matching the API's `Date.getDay()` convention (0 = Sunday), so
// an index can move between the UI and the `weekdays` array on a day group
// without translation.
//
// This list was previously declared three times — in the builder, the routine
// settings sheet, and inline in the dashboard — which is exactly how a Monday
// -first list eventually creeps into one of them.
// ---------------------------------------------------------------------------

/** @typedef {{index: number, short: string, long: string}} Weekday */

/** @type {ReadonlyArray<Weekday>} */
export const WEEKDAYS = Object.freeze([
  { index: 0, short: 'Sun', long: 'Sunday' },
  { index: 1, short: 'Mon', long: 'Monday' },
  { index: 2, short: 'Tue', long: 'Tuesday' },
  { index: 3, short: 'Wed', long: 'Wednesday' },
  { index: 4, short: 'Thu', long: 'Thursday' },
  { index: 5, short: 'Fri', long: 'Friday' },
  { index: 6, short: 'Sat', long: 'Saturday' },
])

/** Short labels only, for compact day toggles. */
export const WEEKDAY_SHORTS = Object.freeze(WEEKDAYS.map((day) => day.short))

/**
 * Summarise a routine's weekdays for display, e.g. "Mon · Wed · Fri".
 *
 * Collapses the full week to "Every day" because reading seven abbreviations is
 * slower than reading two words. Out-of-range values are dropped rather than
 * rendered as `undefined`.
 *
 * @param {number[]} indices
 * @returns {string}
 */
export function formatWeekdays(indices) {
  if (!Array.isArray(indices) || indices.length === 0) return 'No weekdays yet'

  const valid = [...new Set(indices)].filter((index) => Number.isInteger(index) && index >= 0 && index <= 6)
  if (valid.length === 0) return 'No weekdays yet'
  if (valid.length === 7) return 'Every day'

  return valid.sort((a, b) => a - b).map((index) => WEEKDAYS[index].short).join(' · ')
}
