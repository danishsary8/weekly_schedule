// ---------------------------------------------------------------------------
// Prayer-time display helpers only.
//
// Fetching, geolocation handling, per-day caching and the Aladhan fallback all
// moved to the backend (GET /prayer-times/{date}), so this file shrank from a
// full service to a single mapping helper. See src/api/services.js.
//
// This helper is intentionally category-agnostic: it inspects a block's
// description and nothing else, so the optional prayer-time annotation does not
// depend on any entry belonging to a particular category.
// ---------------------------------------------------------------------------

export const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

/**
 * Match a schedule block's description to a supported prayer name.
 *
 * @param {string} description Free-text block description, e.g. "Asr & rest".
 * @returns {string|null} The matched prayer key, or null when none matches.
 */
export function matchPrayerKey(description = '') {
  const lower = description.toLowerCase()

  for (const key of PRAYER_KEYS) {
    if (lower.includes(key.toLowerCase())) return key
  }

  return null
}
