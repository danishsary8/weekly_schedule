import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Detects the moment a user completes 100% of today's checklist.
//
// Two rules make this feel earned rather than noisy:
//  1. It fires on the *transition* into completion, not whenever a complete day
//     happens to be on screen. Loading an already-finished day stays calm.
//  2. It fires at most once per account per calendar date. The marker lives in
//     localStorage — deliberately NOT a backend field, since persisting
//     celebration state would need a new API column (flagged as a follow-up).
//
// Un-checking and re-checking the last item the same day will not re-trigger the
// burst, which is the correct call: repeat fireworks for the same achievement
// cheapen it, and it would otherwise be trivially farmable.
// ---------------------------------------------------------------------------

function markerKey(userId, date) {
  return `daycraft:day-complete:${userId ?? 'anon'}:${date}`
}

function alreadyCelebrated(userId, date) {
  try {
    return localStorage.getItem(markerKey(userId, date)) === '1'
  } catch {
    // Storage unavailable (private mode / quota): fall back to in-session only.
    return false
  }
}

function rememberCelebrated(userId, date) {
  try {
    localStorage.setItem(markerKey(userId, date), '1')
  } catch {
    /* non-fatal — the in-memory ref still prevents a repeat this session */
  }
}

/**
 * @param {object}  options
 * @param {number}  options.completed  items checked today
 * @param {number}  options.total      items scheduled today
 * @param {string}  options.date       YYYY-MM-DD
 * @param {number}  options.userId
 * @param {boolean} options.enabled    only true when viewing today's routine
 * @returns {{celebrating: boolean, dismiss: Function}}
 */
export function useDayCelebration({ completed, total, date, userId, enabled = true }) {
  const [celebrating, setCelebrating] = useState(false)

  // Tracks the previous completion state so we only react to a real transition.
  // `null` means "haven't observed a settled value yet", which is how we avoid
  // firing on the very first render after data loads.
  const wasComplete = useRef(null)
  const firedThisSession = useRef(false)

  // A new day (or a different account) resets the session guard.
  useEffect(() => {
    wasComplete.current = null
    firedThisSession.current = false
    setCelebrating(false)
  }, [date, userId])

  useEffect(() => {
    if (!enabled || total === 0) {
      wasComplete.current = null
      return
    }

    const isComplete = completed === total
    const previous = wasComplete.current
    wasComplete.current = isComplete

    // First settled observation — establish the baseline without celebrating.
    if (previous === null) return

    // Only the false → true edge counts.
    if (!isComplete || previous === true) return
    if (firedThisSession.current || alreadyCelebrated(userId, date)) return

    firedThisSession.current = true
    rememberCelebrated(userId, date)
    setCelebrating(true)
  }, [completed, total, enabled, date, userId])

  const dismiss = useCallback(() => setCelebrating(false), [])

  return { celebrating, dismiss }
}
