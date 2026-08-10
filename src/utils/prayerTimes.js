// ---------------------------------------------------------------------------
// Prayer-time display helpers only.
//
// Fetching, geolocation handling, per-day caching and the Aladhan fallback all
// moved to the backend (GET /prayer-times/{date}), so this file shrank from a
// full service to a single mapping helper. See src/api/services.js.
// ---------------------------------------------------------------------------

export const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

/**
 * Map a Faith entry's description to its prayer key, e.g.
 * Matches an optional faith-category description to a supported prayer name.
 */
export function matchPrayerKey(description = '') {
  const lower = description.toLowerCase()

  for (const key of PRAYER_KEYS) {
    if (lower.includes(key.toLowerCase())) return key
  }

  return null
}
