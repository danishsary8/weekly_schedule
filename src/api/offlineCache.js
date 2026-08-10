// ---------------------------------------------------------------------------
// Lightweight "last known good" response cache.
//
// Approach chosen (Phase 8): keep a small read-through cache in localStorage so
// that if the backend is unreachable we can still render the user's most recent
// schedule/checklist with a clear "offline — showing last saved data" banner,
// instead of a blank screen or a dead-end retry prompt. This matters because the
// app's whole purpose is a glanceable daily routine.
//
// It is deliberately READ-ONLY as a fallback: the API remains the source of
// truth, writes are never queued here (that would risk silent divergence), and
// keys are namespaced per user id so accounts never bleed into each other.
// ---------------------------------------------------------------------------

const PREFIX = 'cache-v1'

function key(userId, name) {
  return `${PREFIX}:${userId ?? 'anon'}:${name}`
}

export function readCache(userId, name) {
  try {
    const raw = localStorage.getItem(key(userId, name))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.value ?? null
  } catch {
    return null
  }
}

export function writeCache(userId, name, value) {
  try {
    localStorage.setItem(key(userId, name), JSON.stringify({ at: Date.now(), value }))
  } catch {
    /* quota/unavailable — cache is a nicety, never required */
  }
}

/** Wipe this user's cached responses (used on logout). */
export function clearUserCache(userId) {
  try {
    const doomed = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(`${PREFIX}:${userId ?? 'anon'}:`)) doomed.push(k)
    }
    doomed.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* non-fatal */
  }
}
