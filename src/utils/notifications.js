// =============================================================================
// notifications.js — browser Notification scheduling for today's schedule.
//
// Builds on the existing time logic:
//   - reuses toMinutes() from time.js (no reimplementation)
//   - reuses the same calendar-day boundary as the checklist (toDateKey)
//
// Everything here no-ops gracefully when the Notification API is unavailable.
// =============================================================================

import { toMinutes } from './time.js'

const MAX_LEAD = 120

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

// 'granted' | 'denied' | 'default' | 'unsupported'
export function getPermission() {
  return isNotificationSupported() ? Notification.permission : 'unsupported'
}

export async function requestPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

function clampLead(n) {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v) || v < 0) return 0
  return v > MAX_LEAD ? MAX_LEAD : v
}

// Minutes from `now` until an entry starts, wrapping across midnight (0–1439).
export function minutesUntilStart(entry, now = new Date()) {
  const start = toMinutes(entry.start)
  if (start === null) return null
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return (start - nowMin + 1440) % 1440
}

/**
 * Entries that should trigger a "starting soon" notification right now:
 * those whose start is within [now, now + leadMinutes]. Wrap-safe.
 *
 * @returns {Array} subset of `entries` currently due for a heads-up
 */
export function getDueEntries(entries = [], now = new Date(), leadMinutes = 5) {
  const lead = clampLead(leadMinutes)
  const due = []
  for (const entry of entries) {
    const diff = minutesUntilStart(entry, now)
    if (diff === null) continue
    if (diff <= lead) due.push(entry)
  }
  return due
}

// Distinct copy for prayer (Faith) blocks vs everything else.
export function buildNotificationContent(entry, minutes) {
  const isPrayer = entry.category === 'Faith'
  const soon = minutes <= 0 ? 'now' : `in ${minutes} minute${minutes === 1 ? '' : 's'}`

  if (isPrayer) {
    return {
      title: `🕌 ${entry.description} ${minutes <= 0 ? 'now' : soon}`,
      body: minutes <= 0 ? 'It’s time — prepare for prayer.' : 'Time to prepare for prayer.',
    }
  }
  return {
    title: `⏰ ${entry.description} ${minutes <= 0 ? 'starting now' : `starts ${soon}`}`,
    body: `${entry.start}–${entry.end}`,
  }
}

/**
 * Fire a single browser notification for an entry. Returns true if dispatched.
 * Uses a per-entry `tag` so the OS coalesces any accidental repeats.
 */
export function fireNotification(entry, minutes) {
  if (getPermission() !== 'granted') return false
  const { title, body } = buildNotificationContent(entry, minutes)
  try {
    new Notification(title, {
      body,
      tag: `routine-${entry.id}`,
      icon: '/icon.svg',
      silent: false,
    })
    return true
  } catch {
    return false
  }
}
