import api from './api/client.js'

// Module scope survives React StrictMode's development remount, preventing a
// navigation from being counted twice while still counting real route changes.
const trackedLocations = new Set()

function idempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function trackPageView(locationKey, pathname) {
  if (trackedLocations.has(locationKey)) return
  trackedLocations.add(locationKey)
  void api.post('/analytics/page-view', { path: pathname, idempotency_key: idempotencyKey() }).catch(() => {
    // Analytics must never interrupt navigation or surface an error to users.
  })
}

export function trackEvent(event) {
  return api.post('/analytics/event', { event, idempotency_key: idempotencyKey() }).catch(() => {
    // Product actions remain successful if aggregate analytics is unavailable.
  })
}

export function trackNotificationPermission(permission) {
  if (permission !== 'granted' && permission !== 'denied') return Promise.resolve()
  return trackEvent(`notification_permission_${permission}`)
}
