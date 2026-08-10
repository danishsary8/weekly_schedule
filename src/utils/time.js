// =============================================================================
// time.js — time formatting + live "what's happening right now" detection.
// =============================================================================

// Format a 24h "HH:MM" string into a friendly 12h label, e.g. "09:00" -> "9:00 AM".
export function to12h(hhmm) {
  if (typeof hhmm !== 'string' || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm
  const [hStr, mStr] = hhmm.split(':')
  let h = Number(hStr)
  const suffix = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${suffix}`
}

// A compact time range label, e.g. "4:40 AM – 5:30 AM".
export function formatRange(start, end) {
  return `${to12h(start)} – ${to12h(end)}`
}

// Convert "HH:MM" to minutes-since-midnight (0–1439), or null if malformed.
export function toMinutes(hhmm) {
  if (typeof hhmm !== 'string' || !/^\d{2}:\d{2}$/.test(hhmm)) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/**
 * getLiveEntryId — given a day's timeline entries and the current time, return
 * the id of the entry whose start–end range contains "now", else null.
 *
 * Comparison is done in minutes-since-midnight. Overnight ranges (end <= start,
 * e.g. 22:30–06:30 "Sleep") are handled by treating them as wrapping midnight:
 * active when now >= start OR now < end. Ranges are treated as [start, end):
 * inclusive of start, exclusive of end, so adjacent blocks never both match.
 *
 * @param {Array<{id:string,start:string,end:string}>} entries
 * @param {Date} [now=new Date()]
 * @returns {string|null} the id of the currently-active entry, or null
 */
export function getLiveEntryId(entries = [], now = new Date()) {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (const entry of entries) {
    const start = toMinutes(entry.start)
    const end = toMinutes(entry.end)
    if (start === null || end === null) continue
    const overnight = end <= start
    const active = overnight
      ? nowMin >= start || nowMin < end
      : nowMin >= start && nowMin < end
    if (active) return entry.id
  }
  return null
}
