// ---------------------------------------------------------------------------
// Tour completion persistence.
//
// Stored as a localStorage flag scoped per user id (`tour-done-<userId>`) rather
// than a backend profile field, because the backend has no profile-flags column
// and modifying it was out of scope for this phase. Scoping by user id means a
// second account on the same browser still gets the tour — the behaviour that
// actually matters. Trade-off: the same user on a brand-new browser sees it
// again, which is acceptable (and arguably a useful refresher).
//
// Kept in its own tiny module so DashboardPage can read/write the flag without
// importing react-joyride, letting the tour itself be lazy-loaded.
// ---------------------------------------------------------------------------

export function tourFlagKey(userId) {
  return `tour-done-${userId}`
}

export function hasCompletedTour(userId) {
  if (!userId) return true
  try {
    return localStorage.getItem(tourFlagKey(userId)) === '1'
  } catch {
    return true
  }
}

export function markTourComplete(userId) {
  try {
    localStorage.setItem(tourFlagKey(userId), '1')
  } catch {
    /* non-fatal */
  }
}

export function resetTour(userId) {
  try {
    localStorage.removeItem(tourFlagKey(userId))
  } catch {
    /* non-fatal */
  }
}
